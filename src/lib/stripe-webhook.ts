import type Stripe from 'stripe';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export type StripeWebhookDependencies = {
  db: Firestore;
  auth: Auth;
  stripe: Stripe;
};

export async function handleStripeEvent({
  event,
  db,
  auth,
  stripe,
}: StripeWebhookDependencies & { event: Stripe.Event }): Promise<
  'processed' | 'duplicate' | 'stale' | 'unhandled'
> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted({ event, db, auth, stripe });
    default:
      return handleUnknownEvent(event, db);
  }
}

async function handleCheckoutCompleted({
  event,
  db,
  auth,
  stripe,
}: StripeWebhookDependencies & { event: Stripe.Event }): Promise<
  'processed' | 'duplicate' | 'stale'
> {
  const session = event.data.object as Stripe.Checkout.Session;

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    throw new Error(
      `Checkout session ${session.id} missing customer or subscription`
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadataUid = subscription.metadata?.firebaseUid ?? null;

  if (!metadataUid) {
    throw new Error(
      `Subscription ${subscription.id} is missing metadata.firebaseUid`
    );
  }

  const customerRef = db.doc(`stripeCustomers/${customerId}`);
  const subscriptionRef = db.doc(
    `users/${metadataUid}/billing/subscription`
  );
  const eventRef = db.doc(`stripeEvents/${event.id}`);

  await auth.getUser(metadataUid);

  return db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);

    if (eventSnap.exists) {
      return 'duplicate';
    }

    const customerSnap = await tx.get(customerRef);
    const currentSnap = await tx.get(subscriptionRef);

    const storedUid = customerSnap.exists
      ? customerSnap.data()?.firebaseUid ?? null
      : null;

    if (storedUid && storedUid !== metadataUid) {
      throw new Error(
        `UID mismatch for Stripe customer ${customerId}: stripe=${metadataUid}, firestore=${storedUid}`
      );
    }

    const lastStripeEventCreated = currentSnap.exists
      ? currentSnap.data()?.lastStripeEventCreated ?? null
      : null;

    if (
      lastStripeEventCreated !== null &&
      typeof lastStripeEventCreated === 'number' &&
      event.created < lastStripeEventCreated
    ) {
      tx.create(eventRef, {
        status: 'stale',
        type: event.type,
        created: event.created,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        firebaseUid: metadataUid,
        processedAt: FieldValue.serverTimestamp(),
      });
      return 'stale';
    }

    const entitlementStatus =
      subscription.status === 'active'
        ? 'PRO'
        : subscription.status === 'trialing'
          ? 'TRIAL'
          : 'FREE';

    tx.set(
      customerRef,
      {
        firebaseUid: metadataUid,
        stripeCustomerId: customerId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      subscriptionRef,
      {
        uid: metadataUid,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        billingStatus: subscription.status,
        entitlementStatus,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        gracePeriodStartedAt: null,
        gracePeriodEndsAt: null,
        lastStripeEventId: event.id,
        lastStripeEventCreated: event.created,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.create(eventRef, {
      status: 'processed',
      type: event.type,
      created: event.created,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      firebaseUid: metadataUid,
      processedAt: FieldValue.serverTimestamp(),
    });

    return 'processed';
  });
}

async function handleUnknownEvent(
  event: Stripe.Event,
  db: Firestore
): Promise<'unhandled' | 'duplicate'> {
  const eventRef = db.doc(`stripeEvents/${event.id}`);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(eventRef);

    if (existing.exists) {
      return 'duplicate';
    }

    tx.create(eventRef, {
      status: 'unhandled',
      type: event.type,
      created: event.created,
      processedAt: FieldValue.serverTimestamp(),
    });

    return 'unhandled';
  });
}
