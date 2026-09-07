import express, { type Request as ExpressRequest, type Response as ExpressResponse, type NextFunction } from 'express';
import cors from 'cors';
import http from 'node:http';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiHandler from '../../api/ai.js';

const app = express();
const router = express.Router();
const APP_URL = process.env.APP_URL || 'https://masteringlocal-pro.netlify.app';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || APP_URL).split(',').map(s => s.trim()).filter(Boolean);
const DB_ID = process.env.FIRESTORE_DATABASE_ID || '(default)';

try {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    raw ? initializeApp({ credential: cert(JSON.parse(raw)) }) : initializeApp();
  }
} catch (e) {
  console.error('[Firebase]', e);
}

const db = getApps().length ? getFirestore(undefined, DB_ID) : null;
const adminAuth = getApps().length ? getAuth() : null;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

type Plan = 'free' | 'pro_monthly' | 'pro_yearly';
type Status = 'FREE' | 'PRO' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE';
type Account = {
  email: string;
  name: string;
  tier: 'FREE' | 'PRO';
  subscription: {
    id: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan: Plan;
    status: Status;
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
  invoices: any[];
  exportHistory: any[];
  createdAt: number;
  updatedAt: number;
};

const memory = new Map<string, Account>();
const buckets = new Map<string, { count: number; resetAt: number }>();

const features = (p: Plan) =>
  p === 'free'
    ? ['standard_16bit_export', 'baseline_dsp', 'max_5_exports_monthly']
    : [
        'high_res_24bit_32bit_export',
        'advanced_presets',
        'lufs_targeting',
        'true_peak_calibration',
        'unlimited_exports',
        'commercial_license',
        'version_history',
      ];

const fresh = (uid: string, email = ''): Account => {
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
      features: features('free'),
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
};

async function account(uid: string, email = ''): Promise<Account> {
  if (!db) {
    let a = memory.get(uid);
    if (!a) {
      a = fresh(uid, email);
      memory.set(uid, a);
    }
    return a;
  }
  const r = db.collection('accounts').doc(uid);
  const s = await r.get();
  if (!s.exists) {
    const a = fresh(uid, email);
    await r.create(a);
    return a;
  }
  return s.data() as Account;
}

async function save(uid: string, patch: Partial<Account>): Promise<Account> {
  const updatedAt = Date.now();
  if (!db) {
    const a = { ...(await account(uid)), ...patch, updatedAt } as Account;
    memory.set(uid, a);
    return a;
  }
  await db.collection('accounts').doc(uid).set({ ...patch, updatedAt }, { merge: true });
  return account(uid);
}

const ip = (r: ExpressRequest) => (r.ip || r.socket.remoteAddress || 'unknown').replace('::ffff:', '');

function limit(n: number, ms: number) {
  return (r: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const k = `${r.path}:${ip(r)}`;
    const now = Date.now();
    const b = buckets.get(k);
    if (!b || b.resetAt <= now) {
      buckets.set(k, { count: 1, resetAt: now + ms });
      return next();
    }
    if (b.count >= n) return res.status(429).json({ error: 'Too many requests. Please retry later.' });
    b.count++;
    next();
  };
}

async function auth(r: ExpressRequest, res: ExpressResponse, next: NextFunction) {
  if (r.path === '/health' || r.path === '/legal-config' || r.path === '/api/health' || r.path === '/api/legal-config') {
    return next();
  }
  const h = r.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t) return res.status(401).json({ error: 'Authentication required.' });
  if (!adminAuth) return res.status(503).json({ error: 'Authentication service is unavailable.' });
  try {
    const d = await adminAuth.verifyIdToken(t, true);
    (r as any).user = { uid: d.uid, email: d.email || '' };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

const user = (r: ExpressRequest) => (r as any).user as { uid: string; email: string };
const publicOrigin = (r: ExpressRequest) => {
  const o = r.headers.origin;
  return o && ALLOWED_ORIGINS.includes(o) ? o : APP_URL;
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_r, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(
  cors({
    origin: (o, cb) => (!o || ALLOWED_ORIGINS.includes(o) ? cb(null, true) : cb(new Error('Origin not allowed'))),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  })
);

router.post(['/stripe/webhook', '/webhooks/stripe', '/webhooks/payment'], express.raw({ type: 'application/json', limit: '256kb' }), async (r, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook is not configured.' });
  const sig = r.headers['stripe-signature'];
  if (typeof sig !== 'string') return res.status(400).json({ error: 'Missing Stripe-Signature header.' });
  let ev: Stripe.Event;
  try {
    ev = stripe.webhooks.constructEvent(r.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ error: 'Invalid Stripe webhook signature.' });
  }
  if (db) {
    const ref = db.collection('stripe_webhook_events').doc(ev.id);
    if ((await ref.get()).exists) return res.json({ received: true, duplicate: true });
    await ref.create({ type: ev.type, created: Date.now() });
  }
  const obj = ev.data.object as any;
  const uid = typeof obj.metadata?.userId === 'string' ? obj.metadata.userId : '';
  if (!uid) return res.json({ received: true, ignored: true });
  const a = await account(uid);
  const s = { ...a.subscription };
  const u = { ...a.usage };
  if (ev.type === 'checkout.session.completed') {
    const x = obj as Stripe.Checkout.Session;
    const p: Plan = obj.metadata?.plan === 'yearly' || obj.metadata?.planId === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly';
    Object.assign(s, {
      id: typeof x.subscription === 'string' ? x.subscription : `sub_${ev.id}`,
      stripeSubscriptionId: typeof x.subscription === 'string' ? x.subscription : x.subscription?.id,
      stripeCustomerId: typeof x.customer === 'string' ? x.customer : x.customer?.id,
      plan: p,
      status: 'PRO',
      features: features(p),
    });
    u.exportsLimit = -1;
  }
  if (ev.type === 'customer.subscription.created' || ev.type === 'customer.subscription.updated') {
    const x = obj as Stripe.Subscription;
    const p: Plan = obj.metadata?.plan === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    Object.assign(s, {
      id: x.id,
      stripeSubscriptionId: x.id,
      stripeCustomerId: typeof x.customer === 'string' ? x.customer : x.customer.id,
      plan: p,
      status: x.status === 'trialing' ? 'TRIAL' : x.status === 'past_due' ? 'PAST_DUE' : x.status === 'canceled' ? 'CANCELED' : 'PRO',
      currentPeriodEnd: Number((x as any).current_period_end || 0) * 1000 || s.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean((x as any).cancel_at_period_end),
    });
    s.features = s.status === 'PRO' || s.status === 'TRIAL' ? features(p) : features('free');
    u.exportsLimit = s.status === 'PRO' || s.status === 'TRIAL' ? -1 : 5;
  }
  if (ev.type === 'customer.subscription.deleted' || ev.type === 'invoice.payment_failed') {
    s.status = ev.type === 'customer.subscription.deleted' ? 'CANCELED' : 'PAST_DUE';
    s.plan = ev.type === 'customer.subscription.deleted' ? 'free' : s.plan;
    s.features = features(ev.type === 'customer.subscription.deleted' ? 'free' : s.plan);
    u.exportsLimit = 5;
  }
  if (ev.type === 'invoice.payment_succeeded' || ev.type === 'invoice.paid') {
    if (s.plan !== 'free') {
      s.status = 'PRO';
      s.features = features(s.plan);
      u.exportsLimit = -1;
    }
    a.invoices.unshift({
      id: obj.id,
      number: obj.number || obj.id,
      amount: Number(obj.amount_paid || obj.amount_due || 0) / 100,
      currency: obj.currency || 'eur',
      status: 'paid',
      created: Number(obj.created || Date.now() / 1000) * 1000,
      pdfUrl: obj.invoice_pdf,
    });
  }
  await save(uid, {
    tier: s.status === 'PRO' || s.status === 'TRIAL' ? 'PRO' : 'FREE',
    subscription: s,
    usage: u,
    invoices: a.invoices.slice(0, 100),
  });
  res.json({ received: true });
});

router.use(express.json({ limit: '256kb' }));
router.use(auth);

router.get('/health', (_r, res) =>
  res.json({
    status: 'ok',
    version: '1.1.0-netlify',
    service: 'MasteringLocal.Pro Netlify Gateway',
    timestamp: Date.now(),
    checks: {
      firebase: Boolean(db),
      firestoreDatabase: DB_ID,
      stripe: Boolean(stripe),
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.NETLIFY_AI_GATEWAY_KEY),
      legal: Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_VAT_ID),
    },
  })
);

router.get('/me', async (r, res) => {
  const u = user(r);
  const a = await account(u.uid, u.email);
  res.json({
    user: { id: u.uid, email: a.email || u.email, name: a.name },
    subscription: a.subscription,
    usage: a.usage,
  });
});

router.get(['/entitlements', '/entitlement'], async (r, res) => {
  const u = user(r);
  const a = await account(u.uid, u.email);
  const pro = a.subscription.status === 'PRO' || a.subscription.status === 'TRIAL';
  res.json({
    entitlement: {
      plan: a.subscription.plan,
      status: a.subscription.status,
      customerId: u.uid,
      subscriptionId: a.subscription.stripeSubscriptionId || a.subscription.id,
      currentPeriodEnd: a.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: a.subscription.cancelAtPeriodEnd,
      features: a.subscription.features,
      lastVerifiedAt: Date.now(),
    },
    usage: a.usage,
    user: { id: u.uid, email: a.email || u.email, name: a.name },
    tier: pro ? 'PRO' : 'FREE',
    limits: {
      maxBitDepth: pro ? 32 : 16,
      allowFloatingPoint: pro,
      allowUnlimitedExports: pro,
      monthlyExportsLimit: pro ? -1 : 5,
      exportsRemaining: pro ? -1 : Math.max(0, a.usage.exportsLimit - a.usage.exportsUsed),
      advancedPresets: pro,
      lufsAnalysis: true,
      truePeakLimiting: true,
      commercialLicense: pro,
    },
  });
});

router.get('/subscription', async (r, res) => {
  const a = await account(user(r).uid);
  res.json({ subscription: a.subscription, usage: a.usage });
});

router.get('/usage', async (r, res) => {
  res.json({ usage: (await account(user(r).uid)).usage });
});

router.get('/billing/invoices', async (r, res) => {
  res.json({ invoices: (await account(user(r).uid)).invoices });
});

router.get('/account/exports', async (r, res) => {
  res.json({ exports: (await account(user(r).uid)).exportHistory });
});

router.get('/legal-config', (_r, res) =>
  res.json({
    businessName: process.env.LEGAL_BUSINESS_NAME || '',
    tradingName: 'MasteringLocal.Pro',
    registeredAddress: process.env.LEGAL_BUSINESS_ADDRESS || '',
    country: process.env.LEGAL_BUSINESS_COUNTRY || '',
    registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER || '',
    vatId: process.env.LEGAL_VAT_ID || '',
    supportEmail: process.env.LEGAL_SUPPORT_EMAIL || '',
    privacyEmail: process.env.LEGAL_PRIVACY_EMAIL || '',
    governingLaw: process.env.LEGAL_GOVERNING_LAW || '',
    isConfigured: Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_VAT_ID),
  })
);

router.post(['/stripe/checkout', '/checkout'], limit(10, 60000), async (r, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const raw = r.body?.plan || r.body?.planId;
  if (!['monthly', 'yearly', 'pro_monthly', 'pro_yearly'].includes(raw))
    return res.status(400).json({ error: 'Invalid plan selected.' });
  const yearly = raw === 'yearly' || raw === 'pro_yearly';
  const plan: Plan = yearly ? 'pro_yearly' : 'pro_monthly';
  const priceId = yearly ? process.env.STRIPE_PRO_YEARLY_PRICE_ID : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  if (!priceId) return res.status(503).json({ error: 'Stripe price is not configured.' });
  const u = user(r);
  const a = await account(u.uid, u.email);
  let customerId = a.subscription.stripeCustomerId;
  if (!customerId) {
    const c = await stripe.customers.create({ email: a.email || u.email, metadata: { userId: u.uid } });
    customerId = c.id;
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${publicOrigin(r)}/?checkout=success`,
    cancel_url: `${publicOrigin(r)}/?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: { userId: u.uid, plan, planId: plan },
    subscription_data: { metadata: { userId: u.uid, plan, planId: plan } },
  });
  await save(u.uid, { subscription: { ...a.subscription, stripeCustomerId: customerId } });
  res.json({ url: session.url, sessionId: session.id });
});

router.post('/checkout/confirm', (_r, res) => {
  res.status(410).json({ error: 'Checkout confirmation is deprecated. Stripe webhooks are authoritative; refresh entitlements after returning from Checkout.' });
});

router.post('/stripe/portal', async (r, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const a = await account(user(r).uid);
  if (!a.subscription.stripeCustomerId) return res.status(409).json({ error: 'No Stripe customer found.' });
  res.json({
    url: (
      await stripe.billingPortal.sessions.create({
        customer: a.subscription.stripeCustomerId,
        return_url: publicOrigin(r),
      })
    ).url,
  });
});

router.post('/subscription/cancel', async (r, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const u = user(r);
  const a = await account(u.uid);
  const sid = a.subscription.stripeSubscriptionId;
  if (!sid) return res.status(409).json({ error: 'No active Stripe subscription.' });
  const x = r.body?.immediately ? await stripe.subscriptions.cancel(sid) : await stripe.subscriptions.update(sid, { cancel_at_period_end: true });
  const subscription = {
    ...a.subscription,
    cancelAtPeriodEnd: Boolean((x as any).cancel_at_period_end),
    currentPeriodEnd: Number((x as any).current_period_end || 0) * 1000 || a.subscription.currentPeriodEnd,
  };
  await save(u.uid, { subscription });
  res.json({ subscription });
});

router.post('/subscription/resume', async (r, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const a = await account(user(r).uid);
  if (!a.subscription.stripeSubscriptionId) return res.status(409).json({ error: 'No Stripe subscription is linked to this account.' });
  await stripe.subscriptions.update(a.subscription.stripeSubscriptionId, { cancel_at_period_end: false });
  const subscription = { ...a.subscription, cancelAtPeriodEnd: false };
  const next = await save(user(r).uid, { subscription });
  res.json({ success: true, message: 'Subscription successfully resumed.', entitlement: next.subscription });
});

router.post('/exports/log', limit(30, 60000), async (r, res) => {
  const u = user(r);
  const a = await account(u.uid);
  const pro = a.subscription.status === 'PRO' || a.subscription.status === 'TRIAL';
  if (!pro && a.usage.exportsLimit !== -1 && a.usage.exportsUsed >= a.usage.exportsLimit)
    return res.status(403).json({ error: 'Free monthly export quota reached.', allowed: false, usage: a.usage });
  const usage = { ...a.usage, exportsUsed: a.usage.exportsUsed + 1 };
  const record = {
    id: `exp_${crypto.randomUUID()}`,
    filename: r.body?.trackName || 'Master Track.wav',
    format: r.body?.format || '16-bit PCM WAV',
    sampleRate: Number(r.body?.sampleRate || 48000),
    channels: Number(r.body?.channels || 2),
    duration: Number(r.body?.duration || 0),
    profileName: pro ? 'Studio Pro Master' : 'Standard Master',
    createdAt: Date.now(),
    tier: pro ? 'PRO' : 'FREE',
  };
  const next = await save(u.uid, { usage, exportHistory: [record, ...a.exportHistory].slice(0, 500) });
  res.json({ success: true, allowed: true, usage: next.usage, logRecord: record });
});

router.post('/privacy/data-request', limit(5, 3600000), async (r, res) => {
  const u = user(r);
  const type = r.body?.type;
  if (!['access', 'rectification', 'erasure', 'portability', 'objection'].includes(type))
    return res.status(400).json({ error: 'Invalid data request type.' });
  const requestId = `dsar_${crypto.randomUUID()}`;
  if (db)
    await db.collection('privacy_requests').doc(requestId).set({
      requestId,
      userId: u.uid,
      email: u.email,
      type,
      details: r.body?.details || '',
      createdAt: FieldValue.serverTimestamp(),
      status: 'received',
    });
  res.json({ requestId, message: 'Your data request has been recorded.' });
});

router.post('/account/delete', async (r, res) => {
  const u = user(r);
  if (db)
    await db.collection('accounts').doc(u.uid).set(
      {
        tier: 'FREE',
        subscription: { ...fresh(u.uid).subscription, status: 'CANCELED' },
        usage: fresh(u.uid).usage,
        exportHistory: [],
        updatedAt: Date.now(),
        deletedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  try {
    await adminAuth?.deleteUser(u.uid);
  } catch (e) {
    console.warn('[Account delete]', e);
  }
  res.json({ success: true, message: 'Account deleted. Financial records are retained only where legally required.' });
});

router.post('/ai/mastering', limit(20, 60000), (r, res) => {
  r.url = '/api/ai/mastering';
  void aiHandler(r, res);
});

router.post('/ai/release', limit(20, 60000), (r, res) => {
  r.url = '/api/ai/release';
  void aiHandler(r, res);
});

router.use((e: unknown, _r: ExpressRequest, res: ExpressResponse, _n: NextFunction) => {
  console.error('[API]', e);
  if (!res.headersSent) res.status(500).json({ error: e instanceof Error ? e.message : 'Internal server error.' });
});

// Mount router under prefixes and root
app.use(['/api', '/.netlify/functions/api'], router);
app.use(router);

const server = http.createServer(app);
let serverPort: number | null = null;
let serverPromise: Promise<number> | null = null;

function getListeningPort(): Promise<number> {
  if (serverPort) return Promise.resolve(serverPort);
  if (!serverPromise) {
    serverPromise = new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        server.unref();
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
          resolve(serverPort);
        } else {
          reject(new Error('Failed to bind server to local port'));
        }
      });
      server.on('error', reject);
    });
  }
  return serverPromise;
}

export default async (req: Request, context?: any): Promise<Response> => {
  const port = await getListeningPort();
  const url = new URL(req.url);
  const targetUrl = new URL(url.pathname + url.search, `http://127.0.0.1:${port}`);

  const headers = new Headers(req.headers);
  headers.set('host', `127.0.0.1:${port}`);
  if (context?.ip && !headers.has('x-forwarded-for')) {
    headers.set('x-forwarded-for', context.ip);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
    // @ts-ignore
    init.duplex = 'half';
  }

  const localRes = await fetch(targetUrl, init);

  return new Response(localRes.body, {
    status: localRes.status,
    statusText: localRes.statusText,
    headers: localRes.headers,
  });
};

export const config = {
  path: ['/api/*', '/.netlify/functions/api/*'],
  preferStatic: false,
};
