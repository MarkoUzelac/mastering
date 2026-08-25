import express from 'express';
import cors from 'cors';
import path from 'path';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Lazy Stripe initialization
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

// Global Middlewares
app.use(cors());

// Webhook raw body middleware for Stripe signature verification
app.use(['/api/webhooks/stripe', '/api/stripe/webhook'], express.raw({ type: 'application/json' }));
app.use(express.json());

// In-memory persistent session storage (Single-tenant / demo workspace)
interface SubscriptionRecord {
  id: string;
  customerId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'pro_monthly' | 'pro_yearly';
  status: 'FREE' | 'PRO' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE';
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  features: string[];
}

interface UsageRecord {
  period: string;
  exportsUsed: number;
  exportsLimit: number;
  resetAt: number;
}

interface InvoiceRecord {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: number;
  interval: 'month' | 'year';
  pdfUrl?: string;
}

interface ExportLogRecord {
  id: string;
  filename: string;
  format: string;
  sampleRate: number;
  channels: number;
  duration: number;
  profileName: string;
  createdAt: number;
  tier: 'FREE' | 'PRO';
}

interface DataRequestRecord {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection';
  email: string;
  details?: string;
  status: 'received' | 'processing' | 'completed';
  createdAt: number;
}

// User state
let userAccount = {
  id: 'usr_mastering_local_01',
  email: 'artist@masteringlocal.pro',
  name: 'Studio Producer',
  tier: 'FREE',
  paymentMethod: {
    brand: 'Mastercard',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
  },
};

let subscription: SubscriptionRecord = {
  id: 'sub_default_free',
  customerId: userAccount.id,
  plan: 'free',
  status: 'FREE',
  currentPeriodEnd: Date.now() + 1000 * 60 * 60 * 24 * 30,
  cancelAtPeriodEnd: false,
  features: [
    'standard_16bit_export',
    'baseline_dsp',
    'max_5_exports_monthly',
  ],
};

let usage: UsageRecord = {
  period: new Date().toISOString().substring(0, 7),
  exportsUsed: 0,
  exportsLimit: 5,
  resetAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
};

let invoices: InvoiceRecord[] = [];
let exportHistory: ExportLogRecord[] = [];
const dataRequests: DataRequestRecord[] = [];
const processedWebhookEvents = new Set<string>();

function getPlanFeatures(plan: 'free' | 'pro_monthly' | 'pro_yearly'): string[] {
  if (plan === 'free') {
    return ['standard_16bit_export', 'baseline_dsp', 'max_5_exports_monthly'];
  }
  return [
    'high_res_24bit_32bit_export',
    'advanced_presets',
    'lufs_targeting',
    'true_peak_calibration',
    'unlimited_exports',
    'commercial_license',
    'version_history',
  ];
}

// ---------------- API ENDPOINTS ----------------

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'MasteringLocal.Pro Production Gateway',
    timestamp: Date.now(),
  });
});

// GET /api/me - Authenticated user account info
app.get('/api/me', (req, res) => {
  res.json({
    user: userAccount,
    subscription: {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    },
    usage,
  });
});

// GET /api/entitlements & GET /api/entitlement - Authoritative Entitlement Matrix
app.get(['/api/entitlements', '/api/entitlement'], (req, res) => {
  const isPro = subscription.status === 'PRO' || subscription.status === 'TRIAL';
  res.json({
    tier: isPro ? 'PRO' : 'FREE',
    status: subscription.status,
    plan: subscription.plan,
    features: subscription.features,
    limits: {
      maxBitDepth: isPro ? 32 : 16,
      allowFloatingPoint: isPro,
      allowUnlimitedExports: isPro,
      monthlyExportsLimit: isPro ? -1 : 5,
      exportsRemaining: isPro ? 999999 : Math.max(0, usage.exportsLimit - usage.exportsUsed),
      advancedPresets: isPro,
      lufsAnalysis: true,
      truePeakLimiting: true,
      commercialLicense: isPro,
    },
    subscription: {
      id: subscription.id,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    },
  });
});

// GET /api/subscription - Subscription Details
app.get('/api/subscription', (req, res) => {
  res.json({
    subscription,
    usage,
  });
});

// GET /api/usage - Quota Metrics
app.get('/api/usage', (req, res) => {
  res.json({
    usage,
  });
});

// GET /api/billing/invoices - Invoice History
app.get('/api/billing/invoices', (req, res) => {
  res.json({
    invoices,
    paymentMethod: userAccount.paymentMethod,
  });
});

// GET /api/account/exports - Export Logs
app.get('/api/account/exports', (req, res) => {
  res.json({
    exports: exportHistory,
  });
});

// GET /api/legal-config - Public Legal Entity Data
app.get('/api/legal-config', (req, res) => {
  res.json({
    businessName: process.env.LEGAL_BUSINESS_NAME || 'REQUIRED_CONFIGURATION [Legal Entity Name]',
    tradingName: 'MasteringLocal.Pro',
    registeredAddress: process.env.LEGAL_BUSINESS_ADDRESS || 'REQUIRED_CONFIGURATION [Registered Office Address]',
    country: process.env.LEGAL_BUSINESS_COUNTRY || 'REQUIRED_CONFIGURATION [Country / EU Member State]',
    registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER || 'REQUIRED_CONFIGURATION [Registry ID]',
    vatId: process.env.LEGAL_VAT_ID || 'REQUIRED_CONFIGURATION [VAT ID / OIB]',
    supportEmail: process.env.LEGAL_SUPPORT_EMAIL || 'info@markouzelacuzy.com',
    privacyEmail: process.env.LEGAL_PRIVACY_EMAIL || 'info@markouzelacuzy.com',
    governingLaw: process.env.LEGAL_GOVERNING_LAW || 'REQUIRED_CONFIGURATION [Governing Law & Jurisdiction]',
    isConfigured: Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_VAT_ID),
  });
});

// POST /api/stripe/checkout & POST /api/checkout - Create Stripe Checkout Session
app.post(['/api/stripe/checkout', '/api/checkout'], async (req, res) => {
  const { plan, planId, returnUrl } = req.body;
  const rawPlan = plan || planId;

  if (!rawPlan || (rawPlan !== 'monthly' && rawPlan !== 'yearly' && rawPlan !== 'pro_monthly' && rawPlan !== 'pro_yearly')) {
    return res.status(400).json({ error: 'Invalid plan selected. Permitted values are "monthly" or "yearly".' });
  }

  const isYearly = rawPlan === 'yearly' || rawPlan === 'pro_yearly';
  const canonicalPlan = isYearly ? 'yearly' : 'monthly';
  const legacyPlanId = isYearly ? 'pro_yearly' : 'pro_monthly';

  const stripe = getStripe();
  const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1U8NH5CseMvXi9qpU2i9i9XV';
  const annualPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID || process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_1U8NHBCseMvXi9qpLOvF4OIu';
  const priceId = isYearly ? annualPriceId : monthlyPriceId;

  // Real Stripe Integration if API key is present
  if (stripe && priceId) {
    try {
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer_email: userAccount.email,
        client_reference_id: userAccount.id,
        metadata: {
          plan: canonicalPlan,
          planId: legacyPlanId,
          userId: userAccount.id,
        },
        subscription_data: {
          metadata: {
            plan: canonicalPlan,
            userId: userAccount.id,
          },
        },
        success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: returnUrl || `${origin}/?checkout=cancel`,
      });

      return res.json({
        sessionId: session.id,
        url: session.url,
        plan: canonicalPlan,
        planId: legacyPlanId,
        provider: 'stripe_live',
      });
    } catch (err: unknown) {
      console.error('[Stripe] Checkout Session Creation Failed:', err);
      return res.status(500).json({
        error: 'Failed to create Stripe Checkout session. Please check Stripe configuration.',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Development / Test Fallback
  const sessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
  const checkoutUrl = `/?checkout=simulated&session_id=${sessionId}&plan=${canonicalPlan}`;

  res.json({
    sessionId,
    url: checkoutUrl,
    plan: canonicalPlan,
    planId: legacyPlanId,
    provider: 'stripe_simulated',
    mode: process.env.PAYMENT_MODE || 'test',
  });
});

// POST /api/checkout/confirm - Complete checkout & activate entitlement
app.post('/api/checkout/confirm', (req, res) => {
  const { plan, planId } = req.body;
  const rawPlan = plan || planId;
  if (!rawPlan) {
    return res.status(400).json({ error: 'Missing plan ID' });
  }

  const isYearly = rawPlan === 'yearly' || rawPlan === 'pro_yearly';
  const legacyPlanId: 'pro_monthly' | 'pro_yearly' = isYearly ? 'pro_yearly' : 'pro_monthly';
  const periodDuration = isYearly ? 1000 * 60 * 60 * 24 * 365 : 1000 * 60 * 60 * 24 * 30;

  subscription = {
    id: 'sub_' + Math.random().toString(36).substring(2, 12),
    customerId: userAccount.id,
    plan: legacyPlanId,
    status: 'PRO',
    currentPeriodEnd: Date.now() + periodDuration,
    cancelAtPeriodEnd: false,
    features: getPlanFeatures(legacyPlanId),
  };

  usage = {
    period: new Date().toISOString().substring(0, 7),
    exportsUsed: usage.exportsUsed,
    exportsLimit: -1, // Unlimited for Pro
    resetAt: Date.now() + periodDuration,
  };

  const newInvoice: InvoiceRecord = {
    id: 'inv_' + Math.random().toString(36).substring(2, 10),
    number: `INV-2026-${String(invoices.length + 101).padStart(4, '0')}`,
    amount: isYearly ? 169.0 : 19.0,
    currency: 'EUR',
    status: 'paid',
    created: Date.now(),
    interval: isYearly ? 'year' : 'month',
  };
  invoices.unshift(newInvoice);

  res.json({
    success: true,
    entitlement: {
      plan: subscription.plan,
      status: subscription.status,
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: subscription.features,
    },
    usage,
    invoice: newInvoice,
  });
});

// POST /api/stripe/portal & POST /api/billing/portal - Stripe Customer Portal Session
app.post(['/api/stripe/portal', '/api/billing/portal'], async (req, res) => {
  const stripe = getStripe();
  const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';

  if (stripe && subscription.stripeCustomerId) {
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${origin}/?view=billing`,
      });
      return res.json({ url: portalSession.url });
    } catch (err) {
      console.error('[Stripe] Portal Session Creation Error:', err);
    }
  }

  // Fallback in-app billing manager
  res.json({ url: '/?view=billing' });
});

// POST /api/subscription/cancel - Schedule or perform subscription cancellation
app.post('/api/subscription/cancel', (req, res) => {
  const { immediately } = req.body;

  if (immediately) {
    subscription = {
      ...subscription,
      plan: 'free',
      status: 'CANCELED',
      features: getPlanFeatures('free'),
    };
    usage.exportsLimit = 5;
  } else {
    subscription.cancelAtPeriodEnd = true;
  }

  res.json({
    success: true,
    message: immediately
      ? 'Subscription canceled immediately.'
      : 'Subscription will remain active until the end of your current billing period.',
    entitlement: {
      plan: subscription.plan,
      status: subscription.status,
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: subscription.features,
    },
  });
});

// POST /api/subscription/resume - Resume subscription
app.post('/api/subscription/resume', (req, res) => {
  subscription.cancelAtPeriodEnd = false;
  res.json({
    success: true,
    message: 'Subscription successfully resumed.',
    entitlement: {
      plan: subscription.plan,
      status: subscription.status,
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: subscription.features,
    },
  });
});

// POST /api/exports/log - Log export and enforce quotas
app.post('/api/exports/log', (req, res) => {
  const { format, trackName, duration, sampleRate } = req.body;
  const isPro = subscription.status === 'PRO' || subscription.status === 'TRIAL';

  if (!isPro && usage.exportsUsed >= usage.exportsLimit && usage.exportsLimit !== -1) {
    return res.status(403).json({
      error: 'Free monthly export quota reached (5/5). Upgrade to MasteringPro Pro for unlimited high-resolution exports.',
      allowed: false,
      usage,
    });
  }

  usage.exportsUsed += 1;

  const logRecord: ExportLogRecord = {
    id: 'exp_' + Math.random().toString(36).substring(2, 10),
    filename: trackName || 'Master Track.wav',
    format: format || '16-bit PCM WAV',
    sampleRate: sampleRate || 48000,
    channels: 2,
    duration: duration || 0,
    profileName: isPro ? 'Studio Pro Master' : 'Standard Master',
    createdAt: Date.now(),
    tier: isPro ? 'PRO' : 'FREE',
  };
  exportHistory.unshift(logRecord);

  res.json({
    success: true,
    allowed: true,
    usage,
    logRecord,
  });
});

// POST /api/privacy/data-request - GDPR Data Subject Request
app.post('/api/privacy/data-request', (req, res) => {
  const { type, email, details } = req.body;
  if (!type || !email) {
    return res.status(400).json({ error: 'Missing required request parameters' });
  }

  const record: DataRequestRecord = {
    id: 'dsar_' + Math.random().toString(36).substring(2, 10),
    type,
    email,
    details: details || '',
    status: 'received',
    createdAt: Date.now(),
  };
  dataRequests.unshift(record);

  res.json({
    success: true,
    message: `Your request (${type}) has been recorded. Our Data Protection Officer will process it within statutory limits (30 days).`,
    requestId: record.id,
  });
});

// POST /api/account/delete - Account Deletion
app.post('/api/account/delete', (req, res) => {
  // Clear non-financial user data
  userAccount = {
    id: 'usr_deleted',
    email: 'deleted@masteringlocal.pro',
    name: 'Deleted User',
    tier: 'FREE',
    paymentMethod: {
      brand: 'None',
      last4: '0000',
      expMonth: 0,
      expYear: 0,
    },
  };
  subscription = {
    id: 'sub_deleted',
    customerId: 'usr_deleted',
    plan: 'free',
    status: 'FREE',
    currentPeriodEnd: 0,
    cancelAtPeriodEnd: true,
    features: getPlanFeatures('free'),
  };
  exportHistory = [];

  res.json({
    success: true,
    message: 'User account and associated data have been permanently deleted. Financial tax invoices are retained in accordance with statutory obligations.',
  });
});

// POST /api/stripe/webhook & /api/webhooks/stripe & /api/webhooks/payment - Webhook Handler with Signature Verification
app.post(['/api/stripe/webhook', '/api/webhooks/stripe', '/api/webhooks/payment'], (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event | { id: string; type: string; data?: { object?: Record<string, unknown> } };

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: unknown) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    event = req.body;
  }

  const eventId = event?.id || (req.headers['stripe-event-id'] as string);
  const eventType = event?.type;

  if (!eventId) {
    return res.status(400).json({ error: 'Missing webhook event ID' });
  }

  // Idempotency verification
  if (processedWebhookEvents.has(eventId)) {
    return res.json({ received: true, duplicate: true });
  }
  processedWebhookEvents.add(eventId);

  console.log(`[WEBHOOK] Processed event: ${eventType} (ID: ${eventId})`);

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = (event as { data?: { object?: Record<string, unknown> } })?.data?.object;
      const meta = session?.metadata as Record<string, unknown> | undefined;
      const isYearly = meta?.plan === 'yearly' || meta?.planId === 'pro_yearly';
      const plan = isYearly ? 'pro_yearly' : 'pro_monthly';
      subscription.status = 'PRO';
      subscription.plan = plan;
      subscription.features = getPlanFeatures(plan);
      usage.exportsLimit = -1;
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const obj = (event as { data?: { object?: Record<string, unknown> } })?.data?.object;
      const planObj = obj?.plan as Record<string, unknown> | undefined;
      const planIdStr = typeof planObj?.id === 'string' ? planObj.id : '';
      const isYearly = planIdStr.includes('year') || (obj?.metadata as Record<string, unknown>)?.plan === 'yearly';
      const planId = isYearly ? 'pro_yearly' : 'pro_monthly';
      subscription.status = 'PRO';
      subscription.plan = planId;
      subscription.features = getPlanFeatures(planId);
      usage.exportsLimit = -1;
      break;
    }
    case 'invoice.payment_succeeded':
    case 'invoice.paid': {
      subscription.status = 'PRO';
      usage.exportsLimit = -1;
      break;
    }
    case 'customer.subscription.deleted': {
      subscription.status = 'CANCELED';
      subscription.plan = 'free';
      subscription.features = getPlanFeatures('free');
      usage.exportsLimit = 5;
      break;
    }
    case 'invoice.payment_failed': {
      subscription.status = 'PAST_DUE';
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

// ---------------- VITE & STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MasteringLocal.Pro] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
