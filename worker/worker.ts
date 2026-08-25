import Stripe from 'stripe';

export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_MONTHLY_PRICE_ID: string;
  STRIPE_PRO_YEARLY_PRICE_ID: string;
  APP_URL?: string;
}

// Fallback Price IDs matching Stripe issue #53
const DEFAULT_MONTHLY_PRICE_ID = 'price_1U8NH5CseMvXi9qpU2i9i9XV';
const DEFAULT_YEARLY_PRICE_ID = 'price_1U8NHBCseMvXi9qpLOvF4OIu';

function getStripe(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-01' as Stripe.LatestApiVersion,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature, x-user-id',
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature, x-user-id',
        },
      });
    }

    // ----------------------------------------------------
    // 1. POST /api/stripe/checkout (also aliases /api/checkout)
    // ----------------------------------------------------
    if ((url.pathname === '/api/stripe/checkout' || url.pathname === '/api/checkout') && method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as { plan?: string; returnUrl?: string };
        const { plan, returnUrl } = body;

        // Acceptance Criteria #53: Frontend may only pass { plan: "monthly" | "yearly" }
        // Worker selects the priceId server-side and never accepts priceId from browser
        if (!plan || (plan !== 'monthly' && plan !== 'yearly' && plan !== 'pro_monthly' && plan !== 'pro_yearly')) {
          return jsonResponse(
            { error: 'Invalid plan selected. Permitted values are "monthly" or "yearly".' },
            400
          );
        }

        const isYearly = plan === 'yearly' || plan === 'pro_yearly';
        const priceId = isYearly
          ? env.STRIPE_PRO_YEARLY_PRICE_ID || DEFAULT_YEARLY_PRICE_ID
          : env.STRIPE_PRO_MONTHLY_PRICE_ID || DEFAULT_MONTHLY_PRICE_ID;

        const normalizedPlan = isYearly ? 'yearly' : 'monthly';
        const stripe = getStripe(env);
        const origin = request.headers.get('Origin') || env.APP_URL || 'https://masteringlocal.pro';

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          metadata: {
            plan: normalizedPlan,
          },
          subscription_data: {
            metadata: {
              plan: normalizedPlan,
            },
          },
          success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: returnUrl || `${origin}/?checkout=cancel`,
        });

        return jsonResponse({
          sessionId: session.id,
          url: session.url,
          plan: normalizedPlan,
          provider: 'stripe_hosted',
        });
      } catch (err: unknown) {
        console.error('[Worker Checkout Error]:', err);
        return jsonResponse(
          {
            error: 'Failed to create Stripe Checkout session.',
            details: err instanceof Error ? err.message : String(err),
          },
          500
        );
      }
    }

    // ----------------------------------------------------
    // 2. POST /api/stripe/webhook (also aliases /api/webhooks/stripe)
    // ----------------------------------------------------
    if ((url.pathname === '/api/stripe/webhook' || url.pathname === '/api/webhooks/stripe') && method === 'POST') {
      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        return jsonResponse({ error: 'Missing stripe-signature header' }, 400);
      }

      const rawBody = await request.text();
      const stripe = getStripe(env);
      let event: Stripe.Event;

      try {
        if (env.STRIPE_WEBHOOK_SECRET) {
          event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            env.STRIPE_WEBHOOK_SECRET
          );
        } else {
          event = JSON.parse(rawBody) as Stripe.Event;
        }
      } catch (err: unknown) {
        console.error('[Stripe Webhook Signature Verification Failed]:', err);
        return jsonResponse(
          { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}` },
          400
        );
      }

      const eventId = event.id;
      const eventType = event.type;

      // Idempotency check via D1 stripe_events
      try {
        const existingEvent = await env.DB.prepare(
          'SELECT event_id FROM stripe_events WHERE event_id = ?'
        )
          .bind(eventId)
          .first<{ event_id: string }>();

        if (existingEvent) {
          console.log(`[Stripe Webhook] Event ${eventId} (${eventType}) already processed. Skipping.`);
          return jsonResponse({ received: true, duplicate: true });
        }
      } catch (dbErr) {
        console.error('[D1 Event Query Error]:', dbErr);
      }

      const now = Date.now();

      // Process target Stripe Events
      try {
        switch (eventType) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerId = (session.customer as string) || '';
            const subscriptionId = (session.subscription as string) || '';
            const customerEmail = session.customer_details?.email || session.customer_email || '';
            const plan = (session.metadata?.plan as string) || 'monthly';
            const userId = session.client_reference_id || `usr_${customerId || Date.now().toString(36)}`;

            if (customerId) {
              await env.DB.prepare(
                'INSERT INTO users (id, email, stripe_customer_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(stripe_customer_id) DO UPDATE SET email = excluded.email'
              )
                .bind(userId, customerEmail, customerId, now)
                .run();
            }

            if (subscriptionId) {
              const subObj = await stripe.subscriptions.retrieve(subscriptionId);
              const priceId = subObj.items.data[0]?.price?.id || '';
              const currentPeriodEnd = (subObj as unknown as { current_period_end?: number })?.current_period_end
                ? (subObj as unknown as { current_period_end: number }).current_period_end * 1000
                : now + 30 * 86400000;

              await env.DB.prepare(
                `INSERT INTO subscriptions (
                  id, user_id, stripe_subscription_id, stripe_customer_id, price_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(stripe_subscription_id) DO UPDATE SET
                  status = excluded.status,
                  plan = excluded.plan,
                  price_id = excluded.price_id,
                  current_period_end = excluded.current_period_end,
                  cancel_at_period_end = excluded.cancel_at_period_end,
                  updated_at = excluded.updated_at`
              )
                .bind(
                  `sub_${subscriptionId}`,
                  userId,
                  subscriptionId,
                  customerId,
                  priceId,
                  plan,
                  'PRO',
                  currentPeriodEnd,
                  0,
                  now,
                  now
                )
                .run();
            }
            break;
          }

          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const sub = event.data.object as Stripe.Subscription;
            const subId = sub.id;
            const customerId = (sub.customer as string) || '';
            const priceId = sub.items.data[0]?.price?.id || '';
            const statusRaw = sub.status;
            const plan = (sub.metadata?.plan as string) || (priceId.includes('year') ? 'yearly' : 'monthly');
            const currentPeriodEnd = (sub as unknown as { current_period_end?: number })?.current_period_end
              ? (sub as unknown as { current_period_end: number }).current_period_end * 1000
              : now + 30 * 86400000;
            const cancelAtPeriodEnd = sub.cancel_at_period_end ? 1 : 0;

            let entitlementStatus = 'FREE';
            if (statusRaw === 'active' || statusRaw === 'trialing') {
              entitlementStatus = 'PRO';
            } else if (statusRaw === 'past_due') {
              entitlementStatus = 'PAST_DUE';
            } else if (statusRaw === 'canceled' || statusRaw === 'unpaid') {
              entitlementStatus = 'CANCELED';
            }

            await env.DB.prepare(
              `INSERT INTO subscriptions (
                id, user_id, stripe_subscription_id, stripe_customer_id, price_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(stripe_subscription_id) DO UPDATE SET
                status = excluded.status,
                plan = excluded.plan,
                price_id = excluded.price_id,
                current_period_end = excluded.current_period_end,
                cancel_at_period_end = excluded.cancel_at_period_end,
                updated_at = excluded.updated_at`
            )
              .bind(
                `sub_${subId}`,
                `usr_${customerId}`,
                subId,
                customerId,
                priceId,
                plan,
                entitlementStatus,
                currentPeriodEnd,
                cancelAtPeriodEnd,
                now,
                now
              )
              .run();
            break;
          }

          case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            const subId = sub.id;

            await env.DB.prepare(
              `UPDATE subscriptions SET status = 'CANCELED', updated_at = ? WHERE stripe_subscription_id = ?`
            )
              .bind(now, subId)
              .run();
            break;
          }

          case 'invoice.payment_succeeded':
          case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            const subId = (invoice as unknown as { subscription?: string })?.subscription;
            if (subId) {
              await env.DB.prepare(
                `UPDATE subscriptions SET status = 'PRO', updated_at = ? WHERE stripe_subscription_id = ?`
              )
                .bind(now, subId)
                .run();
            }
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const subId = (invoice as unknown as { subscription?: string })?.subscription;
            if (subId) {
              await env.DB.prepare(
                `UPDATE subscriptions SET status = 'PAST_DUE', updated_at = ? WHERE stripe_subscription_id = ?`
              )
                .bind(now, subId)
                .run();
            }
            break;
          }

          default:
            break;
        }

        // Record event in idempotency table
        await env.DB.prepare(
          'INSERT INTO stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)'
        )
          .bind(eventId, eventType, now)
          .run();

        return jsonResponse({ received: true, processed: true });
      } catch (processingErr: unknown) {
        console.error('[D1 Webhook Processing Error]:', processingErr);
        return jsonResponse(
          { error: 'Error processing webhook event in D1 storage', details: String(processingErr) },
          500
        );
      }
    }

    // ----------------------------------------------------
    // 3. POST /api/stripe/portal (Customer Portal)
    // ----------------------------------------------------
    if ((url.pathname === '/api/stripe/portal' || url.pathname === '/api/billing/portal') && method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as { customerId?: string; userId?: string };
        const origin = request.headers.get('Origin') || env.APP_URL || 'https://masteringlocal.pro';
        const stripe = getStripe(env);

        let customerId = body.customerId;

        if (!customerId && body.userId) {
          const userRecord = await env.DB.prepare(
            'SELECT stripe_customer_id FROM users WHERE id = ?'
          )
            .bind(body.userId)
            .first<{ stripe_customer_id: string }>();

          customerId = userRecord?.stripe_customer_id;
        }

        if (!customerId) {
          const subRecord = await env.DB.prepare(
            'SELECT stripe_customer_id FROM subscriptions ORDER BY updated_at DESC LIMIT 1'
          ).first<{ stripe_customer_id: string }>();

          customerId = subRecord?.stripe_customer_id;
        }

        if (!customerId) {
          return jsonResponse({ error: 'No active Stripe customer found to open billing portal.' }, 404);
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/?view=billing`,
        });

        return jsonResponse({ url: portalSession.url });
      } catch (err: unknown) {
        console.error('[Worker Customer Portal Error]:', err);
        return jsonResponse(
          { error: 'Failed to create Customer Portal session', details: String(err) },
          500
        );
      }
    }

    // ----------------------------------------------------
    // 4. GET /api/entitlement (also aliases /api/entitlements)
    // ----------------------------------------------------
    if ((url.pathname === '/api/entitlement' || url.pathname === '/api/entitlements') && method === 'GET') {
      try {
        const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');
        const customerId = url.searchParams.get('customerId');

        let sub: {
          id: string;
          plan: string;
          status: string;
          current_period_end: number;
          cancel_at_period_end: number;
        } | null = null;

        if (userId) {
          sub = await env.DB.prepare(
            'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'
          )
            .bind(userId)
            .first();
        } else if (customerId) {
          sub = await env.DB.prepare(
            'SELECT * FROM subscriptions WHERE stripe_customer_id = ? ORDER BY updated_at DESC LIMIT 1'
          )
            .bind(customerId)
            .first();
        } else {
          // Default latest record for single-tenant / local session
          sub = await env.DB.prepare(
            'SELECT * FROM subscriptions ORDER BY updated_at DESC LIMIT 1'
          ).first();
        }

        const now = Date.now();
        let tier: 'PRO' | 'FREE' = 'FREE';
        let status = 'FREE';

        if (sub) {
          if (sub.status === 'PRO') {
            tier = 'PRO';
            status = 'PRO';
          } else if (sub.status === 'PAST_DUE') {
            tier = 'FREE';
            status = 'PAST_DUE';
          } else if (sub.status === 'CANCELED') {
            if (sub.current_period_end && sub.current_period_end > now) {
              tier = 'PRO'; // Still valid until period end
              status = 'PRO';
            } else {
              tier = 'FREE';
              status = 'CANCELED';
            }
          }
        }

        const isPro = tier === 'PRO';

        return jsonResponse({
          tier,
          status,
          plan: sub ? sub.plan : 'free',
          features: isPro
            ? [
                'high_res_24bit_32bit_export',
                'advanced_presets',
                'lufs_targeting',
                'true_peak_calibration',
                'unlimited_exports',
                'commercial_license',
                'version_history',
              ]
            : ['standard_16bit_export', 'baseline_dsp', 'max_5_exports_monthly'],
          limits: {
            maxBitDepth: isPro ? 32 : 16,
            allowFloatingPoint: isPro,
            allowUnlimitedExports: isPro,
            monthlyExportsLimit: isPro ? -1 : 5,
            commercialLicense: isPro,
          },
          subscription: sub
            ? {
                id: sub.id,
                currentPeriodEnd: sub.current_period_end,
                cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
              }
            : null,
        });
      } catch (err: unknown) {
        console.error('[Worker Entitlement Query Error]:', err);
        return jsonResponse(
          {
            tier: 'FREE',
            status: 'FREE',
            plan: 'free',
            error: 'Failed to read D1 entitlement state',
          },
          500
        );
      }
    }

    return jsonResponse({ error: 'Endpoint Not Found', service: 'MasteringLocal.Pro Cloudflare Worker' }, 404);
  },
};
