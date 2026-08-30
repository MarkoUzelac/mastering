import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiHandler from './api/ai.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || APP_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (IS_PRODUCTION) {
  const required = ['APP_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRO_MONTHLY_PRICE_ID', 'STRIPE_PRO_YEARLY_PRICE_ID', 'GEMINI_API_KEY', 'LEGAL_BUSINESS_NAME', 'LEGAL_BUSINESS_ADDRESS', 'LEGAL_BUSINESS_COUNTRY', 'LEGAL_REGISTRATION_NUMBER', 'LEGAL_VAT_ID', 'LEGAL_SUPPORT_EMAIL', 'LEGAL_PRIVACY_EMAIL', 'LEGAL_GOVERNING_LAW'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Production configuration missing: ${missing.join(', ')}`);
}

// Firebase Admin: use ADC in managed environments or FIREBASE_SERVICE_ACCOUNT_JSON locally.
let firebaseReady = false;
if (getApps().length) {
  firebaseReady = true;
} else {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
    } else {
      initializeApp();
    }
    firebaseReady = true;
  } catch (error) {
    if (IS_PRODUCTION) throw error;
    console.warn('[Firebase] Admin SDK unavailable in development; auth bypass requires explicit DEV_AUTH_BYPASS=true.');
  }
}

const db = firebaseReady ? getFirestore() : null;
const adminAuth = firebaseReady ? getAuth() : null;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

interface AccountState {
  email: string;
  name: string;
  tier: 'FREE' | 'PRO';
  subscription: {
    id: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan: 'free' | 'pro_monthly' | 'pro_yearly';
    status: 'FREE' | 'PRO' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE';
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    features: string[];
  };
  usage: {
    period: string;
    exportsUsed: number;
    exportsLimit: number;
    resetAt: number;
  };
  invoices: Array<Record<string, unknown>>;
  exportHistory: Array<Record<string, unknown>>;
  createdAt: number;
  updatedAt: number;
}

const memoryAccounts = new Map<string, AccountState>();
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function featuresFor(plan: AccountState['subscription']['plan']) {
  return plan === 'free'
    ? ['standard_16bit_export', 'baseline_dsp', 'max_5_exports_monthly']
    : ['high_res_24bit_32bit_export', 'advanced_presets', 'lufs_targeting', 'true_peak_calibration', 'unlimited_exports', 'commercial_license', 'version_history'];
}

function defaultAccount(uid: string, email = ''): AccountState {
  const now = Date.now();
  return {
    email,
    name: email ? email.split('@')[0] : 'Mastering Engineer',
    tier: 'FREE',
    subscription: {
      id: `sub_free_${uid.slice(0, 12)}`,
      plan: 'free',
      status: 'FREE',
      currentPeriodEnd: now + 30 * 86400000,
      cancelAtPeriodEnd: false,
      features: featuresFor('free'),
    },
    usage: {
      period: new Date().toISOString().slice(0, 7),
      exportsUsed: 0,
      exportsLimit: 5,
      resetAt: now + 30 * 86400000,
    },
    invoices: [],
    exportHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function getAccount(uid: string, email = ''): Promise<AccountState> {
  if (!db) {
    let account = memoryAccounts.get(uid);
    if (!account) {
      account = defaultAccount(uid, email);
      memoryAccounts.set(uid, account);
    }
    return account;
  }
  const ref = db.collection('accounts').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const account = defaultAccount(uid, email);
    await ref.create(account);
    return account;
  }
  return snap.data() as AccountState;
}

async function saveAccount(uid: string, patch: Partial<AccountState>) {
  const updatedAt = Date.now();
  if (!db) {
    const current = await getAccount(uid);
    const next = { ...current, ...patch, updatedAt } as AccountState;
    memoryAccounts.set(uid, next);
    return next;
  }
  await db.collection('accounts').doc(uid).set({ ...patch, updatedAt }, { merge: true });
  return getAccount(uid);
}

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function clientIp(req: Request) {
  return (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
}

function requireRateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!rateLimit(`${req.path}:${clientIp(req)}`, limit, windowMs)) {
      return res.status(429).json({ error: 'Too many requests. Please retry later.' });
    }
    next();
  };
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health' || req.path === '/legal-config') return next();
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    if (!IS_PRODUCTION && process.env.DEV_AUTH_BYPASS === 'true') {
      (req as Request & { user?: { uid: string; email: string } }).user = { uid: 'dev-user', email: 'dev@localhost' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!adminAuth) return res.status(503).json({ error: 'Authentication service is unavailable.' });
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    (req as Request & { user?: { uid: string; email: string } }).user = { uid: decoded.uid, email: decoded.email || '' };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function userOf(req: Request) {
  return (req as Request & { user?: { uid: string; email: string } }).user!;
}

function publicOrigin(req: Request) {
  const origin = req.headers.origin;
  return origin && ALLOWED_ORIGINS.includes(origin) ? origin : APP_URL;
}

// Security headers and strict CORS. CORS is not authentication; Firebase auth is authoritative.
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
}));

// Stripe requires the exact raw body for signature verification; this route must precede express.json().
app.post(['/api/stripe/webhook', '/api/webhooks/stripe', '/api/webhooks/payment'], express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook is not configured.' });
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') return res.status(400).json({ error: 'Missing Stripe-Signature header.' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: 'Invalid Stripe webhook signature.' });
  }

  if (db) {
    const eventRef = db.collection('stripe_webhook_events').doc(event.id);
    const existing = await eventRef.get();
    if (existing.exists) return res.json({ received: true, duplicate: true });
    await eventRef.create({ type: event.type, created: Date.now() });
  }

  const object = event.data.object as Record<string, any>;
  const metadata = object.metadata || {};
  const uid = typeof metadata.userId === 'string' ? metadata.userId : '';
  if (!uid) return res.json({ received: true, ignored: true });

  const account = await getAccount(uid);
  const subscription = { ...account.subscription };
  const usage = { ...account.usage };

  if (event.type === 'checkout.session.completed') {
    const session = object as Stripe.Checkout.Session;
    const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const plan = metadata.plan === 'yearly' || metadata.planId === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly';
    subscription.id = stripeSubscriptionId || `sub_${event.id}`;
    subscription.stripeSubscriptionId = stripeSubscriptionId;
    subscription.stripeCustomerId = stripeCustomerId;
    subscription.plan = plan;
    subscription.status = 'PRO';
    subscription.features = featuresFor(plan);
    usage.exportsLimit = -1;
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const stripeSubscription = object as Stripe.Subscription;
    const plan = metadata.plan === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    subscription.id = stripeSubscription.id;
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.stripeCustomerId = typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id;
    subscription.plan = plan;
    subscription.status = stripeSubscription.status === 'trialing' ? 'TRIAL' : stripeSubscription.status === 'past_due' ? 'PAST_DUE' : stripeSubscription.status === 'canceled' ? 'CANCELED' : 'PRO';
    subscription.currentPeriodEnd = (stripeSubscription as any).current_period_end ? Number((stripeSubscription as any).current_period_end) * 1000 : subscription.currentPeriodEnd;
    subscription.cancelAtPeriodEnd = Boolean((stripeSubscription as any).cancel_at_period_end);
    subscription.features = subscription.status === 'PRO' || subscription.status === 'TRIAL' ? featuresFor(plan) : featuresFor('free');
    usage.exportsLimit = subscription.status === 'PRO' || subscription.status === 'TRIAL' ? -1 : 5;
  }

  if (event.type === 'customer.subscription.deleted') {
    subscription.status = 'CANCELED';
    subscription.plan = 'free';
    subscription.features = featuresFor('free');
    usage.exportsLimit = 5;
  }

  if (event.type === 'invoice.payment_failed') {
    subscription.status = 'PAST_DUE';
    subscription.features = featuresFor('free');
    usage.exportsLimit = 5;
  }

  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
    if (subscription.plan !== 'free') {
      subscription.status = 'PRO';
      subscription.features = featuresFor(subscription.plan);
      usage.exportsLimit = -1;
    }
  }

  const invoiceEvents = new Set(['invoice.payment_succeeded', 'invoice.paid']);
  const invoices = [...account.invoices];
  if (invoiceEvents.has(event.type)) {
    invoices.unshift({
      id: object.id,
      number: object.number || object.id,
      amount: Number(object.amount_paid || object.amount_due || 0) / 100,
      currency: object.currency || 'eur',
      status: 'paid',
      created: Number(object.created || Math.floor(Date.now() / 1000)) * 1000,
      pdfUrl: object.invoice_pdf || undefined,
      interval: subscription.plan === 'pro_yearly' ? 'year' : 'month',
    });
  }

  await saveAccount(uid, {
    tier: subscription.status === 'PRO' || subscription.status === 'TRIAL' ? 'PRO' : 'FREE',
    subscription,
    usage,
    invoices: invoices.slice(0, 100),
  });
  return res.json({ received: true });
});

app.use(express.json({ limit: '256kb' }));
app.use(authMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.1.0',
    service: 'MasteringLocal.Pro Production Gateway',
    timestamp: Date.now(),
    environment: NODE_ENV,
    checks: { firebase: firebaseReady, stripe: Boolean(stripe), gemini: Boolean(process.env.GEMINI_API_KEY), legal: Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_VAT_ID) },
  });
});

app.get('/api/me', async (req, res) => {
  const user = userOf(req);
  const account = await getAccount(user.uid, user.email);
  res.json({ user: { id: user.uid, email: account.email || user.email, name: account.name }, subscription: account.subscription, usage: account.usage });
});

app.get(['/api/entitlements', '/api/entitlement'], async (req, res) => {
  const account = await getAccount(userOf(req).uid, userOf(req).email);
  const isPro = account.subscription.status === 'PRO' || account.subscription.status === 'TRIAL';
  res.json({
    entitlement: { plan: account.subscription.plan, status: account.subscription.status, customerId: userOf(req).uid, subscriptionId: account.subscription.stripeSubscriptionId || account.subscription.id, currentPeriodEnd: account.subscription.currentPeriodEnd, cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd, features: account.subscription.features, lastVerifiedAt: Date.now() },
    usage: account.usage,
    user: { id: userOf(req).uid, email: account.email || userOf(req).email, name: account.name },
    tier: isPro ? 'PRO' : 'FREE',
    limits: { maxBitDepth: isPro ? 32 : 16, allowFloatingPoint: isPro, allowUnlimitedExports: isPro, monthlyExportsLimit: isPro ? -1 : 5, exportsRemaining: isPro ? -1 : Math.max(0, account.usage.exportsLimit - account.usage.exportsUsed), advancedPresets: isPro, lufsAnalysis: true, truePeakLimiting: true, commercialLicense: isPro },
  });
});

app.get('/api/subscription', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ subscription: a.subscription, usage: a.usage }); });
app.get('/api/usage', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ usage: a.usage }); });
app.get('/api/billing/invoices', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ invoices: a.invoices }); });
app.get('/api/account/exports', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ exports: a.exportHistory }); });

app.get('/api/legal-config', (_req, res) => {
  const configured = Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_BUSINESS_ADDRESS && process.env.LEGAL_BUSINESS_COUNTRY && process.env.LEGAL_REGISTRATION_NUMBER && process.env.LEGAL_VAT_ID && process.env.LEGAL_SUPPORT_EMAIL && process.env.LEGAL_PRIVACY_EMAIL && process.env.LEGAL_GOVERNING_LAW);
  if (IS_PRODUCTION && !configured) return res.status(503).json({ error: 'Legal configuration is incomplete.' });
  res.json({ businessName: process.env.LEGAL_BUSINESS_NAME || '', tradingName: 'MasteringLocal.Pro', registeredAddress: process.env.LEGAL_BUSINESS_ADDRESS || '', country: process.env.LEGAL_BUSINESS_COUNTRY || '', registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER || '', vatId: process.env.LEGAL_VAT_ID || '', supportEmail: process.env.LEGAL_SUPPORT_EMAIL || '', privacyEmail: process.env.LEGAL_PRIVACY_EMAIL || '', governingLaw: process.env.LEGAL_GOVERNING_LAW || '', isConfigured: configured });
});

app.post(['/api/stripe/checkout', '/api/checkout'], requireRateLimit(10, 60000), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const rawPlan = req.body?.plan || req.body?.planId;
  if (!['monthly', 'yearly', 'pro_monthly', 'pro_yearly'].includes(rawPlan)) return res.status(400).json({ error: 'Invalid plan selected.' });
  const isYearly = rawPlan === 'yearly' || rawPlan === 'pro_yearly';
  const plan = isYearly ? 'yearly' : 'monthly';
  const planId = isYearly ? 'pro_yearly' : 'pro_monthly';
  const priceId = isYearly ? process.env.STRIPE_PRO_YEARLY_PRICE_ID : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  if (!priceId) return res.status(503).json({ error: 'Stripe price is not configured.' });
  const user = userOf(req);
  const account = await getAccount(user.uid, user.email);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: account.email || user.email,
    client_reference_id: user.uid,
    metadata: { userId: user.uid, plan, planId },
    subscription_data: { metadata: { userId: user.uid, plan, planId } },
    success_url: `${publicOrigin(req)}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicOrigin(req)}/?checkout=cancel`,
  });
  res.json({ sessionId: session.id, url: session.url, plan, planId, provider: 'stripe_live' });
});

// Deliberately removed: client confirmation is not an entitlement authority.
app.post('/api/checkout/confirm', (_req, res) => res.status(410).json({ error: 'Checkout confirmation is deprecated. Stripe webhooks are authoritative; refresh entitlements after returning from Checkout.' }));

app.post(['/api/stripe/portal', '/api/billing/portal'], requireRateLimit(10, 60000), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const a = await getAccount(userOf(req).uid);
  if (!a.subscription.stripeCustomerId) return res.status(409).json({ error: 'No Stripe customer is linked to this account.' });
  const portal = await stripe.billingPortal.sessions.create({ customer: a.subscription.stripeCustomerId, return_url: `${publicOrigin(req)}/?view=billing` });
  res.json({ url: portal.url });
});

app.post('/api/subscription/cancel', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const a = await getAccount(userOf(req).uid);
  if (!a.subscription.stripeSubscriptionId) return res.status(409).json({ error: 'No active Stripe subscription.' });
  const updated = await stripe.subscriptions.update(a.subscription.stripeSubscriptionId, { cancel_at_period_end: !Boolean(req.body?.immediately) });
  if (req.body?.immediately) await stripe.subscriptions.cancel(a.subscription.stripeSubscriptionId);
  const subscription = { ...a.subscription, cancelAtPeriodEnd: Boolean((updated as any).cancel_at_period_end), status: req.body?.immediately ? 'CANCELED' : a.subscription.status } as AccountState['subscription'];
  const next = await saveAccount(userOf(req).uid, { subscription });
  res.json({ success: true, message: req.body?.immediately ? 'Subscription canceled immediately.' : 'Subscription will remain active until the end of the current billing period.', entitlement: next.subscription });
});

app.post('/api/subscription/resume', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const a = await getAccount(userOf(req).uid);
  if (!a.subscription.stripeSubscriptionId) return res.status(409).json({ error: 'No Stripe subscription is linked to this account.' });
  const updated = await stripe.subscriptions.update(a.subscription.stripeSubscriptionId, { cancel_at_period_end: false });
  const subscription = { ...a.subscription, cancelAtPeriodEnd: Boolean((updated as any).cancel_at_period_end) };
  const next = await saveAccount(userOf(req).uid, { subscription });
  res.json({ success: true, message: 'Subscription successfully resumed.', entitlement: next.subscription });
});

app.post('/api/exports/log', requireRateLimit(30, 60000), async (req, res) => {
  const uid = userOf(req).uid;
  const a = await getAccount(uid);
  const isPro = a.subscription.status === 'PRO' || a.subscription.status === 'TRIAL';
  if (!isPro && a.usage.exportsLimit !== -1 && a.usage.exportsUsed >= a.usage.exportsLimit) return res.status(403).json({ error: 'Free monthly export quota reached.', allowed: false, usage: a.usage });
  const usage = { ...a.usage, exportsUsed: a.usage.exportsUsed + 1 };
  const record = { id: `exp_${crypto.randomUUID()}`, filename: req.body?.trackName || 'Master Track.wav', format: req.body?.format || '16-bit PCM WAV', sampleRate: Number(req.body?.sampleRate || 48000), channels: Number(req.body?.channels || 2), duration: Number(req.body?.duration || 0), profileName: isPro ? 'Studio Pro Master' : 'Standard Master', createdAt: Date.now(), tier: isPro ? 'PRO' : 'FREE' };
  const next = await saveAccount(uid, { usage, exportHistory: [record, ...a.exportHistory].slice(0, 500) });
  res.json({ success: true, allowed: true, usage: next.usage, logRecord: record });
});

app.post('/api/privacy/data-request', requireRateLimit(5, 3600000), async (req, res) => {
  const type = req.body?.type;
  if (!['access', 'rectification', 'erasure', 'portability', 'objection'].includes(type)) return res.status(400).json({ error: 'Invalid data request type.' });
  const uid = userOf(req).uid;
  if (db) await db.collection('data_requests').add({ uid, type, details: String(req.body?.details || '').slice(0, 5000), status: 'received', createdAt: FieldValue.serverTimestamp() });
  res.json({ success: true, message: 'Your data request has been recorded.', requestId: `dsar_${crypto.randomUUID()}` });
});

app.post('/api/account/delete', async (req, res) => {
  const uid = userOf(req).uid;
  const a = await getAccount(uid);
  if (stripe && a.subscription.stripeSubscriptionId && ['PRO', 'TRIAL', 'PAST_DUE'].includes(a.subscription.status)) return res.status(409).json({ error: 'Cancel the active subscription before deleting the account.' });
  if (db) await db.collection('accounts').doc(uid).set({ email: '', name: 'Deleted User', tier: 'FREE', subscription: { ...defaultAccount(uid).subscription, status: 'CANCELED' }, usage: { ...defaultAccount(uid).usage }, exportHistory: [], updatedAt: Date.now(), deletedAt: FieldValue.serverTimestamp() }, { merge: true });
  else memoryAccounts.delete(uid);
  if (adminAuth) { try { await adminAuth.deleteUser(uid); } catch {} }
  res.json({ success: true, message: 'Account deleted. Financial records are retained only where legally required.' });
});

// AI endpoints are mounted on the same authenticated Express server.
app.post('/api/ai/mastering', requireRateLimit(20, 60000), (req, res) => { req.url = '/api/ai/mastering'; void aiHandler(req, res); });
app.post('/api/ai/release', requireRateLimit(20, 60000), (req, res) => { req.url = '/api/ai/release'; void aiHandler(req, res); });

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  console.error('[HTTP]', error);
  res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', index: false }));
    app.use((req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[MasteringLocal.Pro] listening on ${PORT} (${NODE_ENV})`));
}

void startServer();
