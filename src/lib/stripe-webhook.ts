import Stripe from 'stripe';
import type { Firestore } from 'firebase-admin/firestore';

export type StripeWebhookDependencies = {
  db: Firestore;
  auth: any;
  stripe: Stripe;
};

export async function processStripeEvent({
  db,
  auth,
  stripe,
  event,
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
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start ?? null;
  const currentPeriodEnd = subscriptionItem?.current_period_end ?? null;
  const metadataUid = subscription.metadata?.firebaseUid ?? null;

  const uid = metadataUid;
  if (!uid) {
    throw new Error(`Subscription ${subscription.id} missing firebaseUid metadata`);
  }

  const userRef = db.doc(`users/${uid}/billing/subscription`);
  const eventRef = db.doc(`stripeEvents/${event.id}`);

  return db.runTransaction(async (tx) => {
    const [eventSnap, userSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(userRef),
    ]);

    if (eventSnap.exists) {
      return 'duplicate';
    }

    const existing = userSnap.exists ? userSnap.data() : undefined;
    const lastStripeEventCreated = existing?.lastStripeEventCreated ?? 0;

    if (event.created < lastStripeEventCreated) {
      tx.set(eventRef, {
        eventId: event.id,
        type: event.type,
        created: event.created,
        status: 'stale',
      });
      return 'stale';
    }

    tx.set(userRef, {
      entitlementStatus: 'PRO',
      billingStatus: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart,
      currentPeriodEnd,
      lastStripeEventId: event.id,
      lastStripeEventCreated: event.created,
      updatedAt: new Date(),
    }, { merge: true });

    tx.set(eventRef, {
      eventId: event.id,
      type: event.type,
      created: event.created,
      status: 'processed',
    });

    return 'processed';
  });
}
