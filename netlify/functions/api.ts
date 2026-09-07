import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import serverless from 'serverless-http';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiHandler from '../../api/ai.js';

const app = express();
const APP_URL = process.env.APP_URL || 'https://masteringlocal-pro.netlify.app';
const NODE_ENV = process.env.NODE_ENV || 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || APP_URL).split(',').map((v) => v.trim()).filter(Boolean);
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || '(default)';

let firebaseReady = false;
try {
  if (getApps().length) firebaseReady = true;
  else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw) initializeApp({ credential: cert(JSON.parse(raw)) });
    else initializeApp();
    firebaseReady = true;
  }
} catch (error) {
  console.error('[Firebase] initialization failed', error);
}

const db = firebaseReady ? getFirestore(undefined, FIRESTORE_DATABASE_ID) : null;
const adminAuth = firebaseReady ? getAuth() : null;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

type Plan = 'free' | 'pro_monthly' | 'pro_yearly';
type Status = 'FREE' | 'PRO' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE';
interface AccountState {
  email: string; name: string; tier: 'FREE' | 'PRO';
  subscription: { id: string; stripeCustomerId?: string; stripeSubscriptionId?: string; plan: Plan; status: Status; currentPeriodEnd: number; cancelAtPeriodEnd: boolean; features: string[] };
  usage: { period: string; exportsUsed: number; exportsLimit: number; resetAt: number };
  invoices: Array<Record<string, unknown>>; exportHistory: Array<Record<string, unknown>>; createdAt: number; updatedAt: number;
}
const memoryAccounts = new Map<string, AccountState>();
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function featuresFor(plan: Plan) { return plan === 'free' ? ['standard_16bit_export', 'baseline_dsp', 'max_5_exports_monthly'] : ['high_res_24bit_32bit_export', 'advanced_presets', 'lufs_targeting', 'true_peak_calibration', 'unlimited_exports', 'commercial_license', 'version_history']; }
function defaultAccount(uid: string, email = ''): AccountState { const now = Date.now(); return { email, name: email ? email.split('@')[0] : 'Mastering Engineer', tier: 'FREE', subscription: { id: `sub_free_${uid.slice(0, 12)}`, plan: 'free', status: 'FREE', currentPeriodEnd: now + 30 * 86400000, cancelAtPeriodEnd: false, features: featuresFor('free') }, usage: { period: new Date().toISOString().slice(0, 7), exportsUsed: 0, exportsLimit: 5, resetAt: now + 30 * 86400000 }, invoices: [], exportHistory: [], createdAt: now, updatedAt: now }; }
async function getAccount(uid: string, email = ''): Promise<AccountState> { if (!db) { let a = memoryAccounts.get(uid); if (!a) { a = defaultAccount(uid, email); memoryAccounts.set(uid, a); } return a; } const ref = db.collection('accounts').doc(uid); const snap = await ref.get(); if (!snap.exists) { const a = defaultAccount(uid, email); await ref.create(a); return a; } return snap.data() as AccountState; }
async function saveAccount(uid: string, patch: Partial<AccountState>) { const updatedAt = Date.now(); if (!db) { const a = await getAccount(uid); const next = { ...a, ...patch, updatedAt } as AccountState; memoryAccounts.set(uid, next); return next; } await db.collection('accounts').doc(uid).set({ ...patch, updatedAt }, { merge: true }); return getAccount(uid); }
function clientIp(req: Request) { return (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', ''); }
function rateLimit(key: string, limit: number, windowMs: number) { const now = Date.now(); const b = rateBuckets.get(key); if (!b || b.resetAt <= now) { rateBuckets.set(key, { count: 1, resetAt: now + windowMs }); return true; } if (b.count >= limit) return false; b.count += 1; return true; }
function limiter(limit: number, windowMs: number) { return (req: Request, res: Response, next: NextFunction) => rateLimit(`${req.path}:${clientIp(req)}`, limit, windowMs) ? next() : res.status(429).json({ error: 'Too many requests. Please retry later.' }); }
async function auth(req: Request, res: Response, next: NextFunction) { if (req.path === '/health' || req.path === '/legal-config') return next(); const header = req.headers.authorization; const token = header?.startsWith('Bearer ') ? header.slice(7) : ''; if (!token) return res.status(401).json({ error: 'Authentication required.' }); if (!adminAuth) return res.status(503).json({ error: 'Authentication service is unavailable.' }); try { const decoded = await adminAuth.verifyIdToken(token, true); (req as any).user = { uid: decoded.uid, email: decoded.email || '' }; return next(); } catch { return res.status(401).json({ error: 'Invalid or expired authentication token.' }); } }
function userOf(req: Request) { return (req as any).user as { uid: string; email: string }; }
function origin(req: Request) { const o = req.headers.origin; return o && ALLOWED_ORIGINS.includes(o) ? o : APP_URL; }

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); next(); });
app.use(cors({ origin: (o, cb) => !o || ALLOWED_ORIGINS.includes(o) ? cb(null, true) : cb(new Error('Origin not allowed')), credentials: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'] }));

// Stripe webhook must receive the raw body before express.json().
app.post(['/stripe/webhook', '/webhooks/stripe', '/webhooks/payment'], express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook is not configured.' });
  const signature = req.headers['stripe-signature']; if (typeof signature !== 'string') return res.status(400).json({ error: 'Missing Stripe-Signature header.' });
  let event: Stripe.Event; try { event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return res.status(400).json({ error: 'Invalid Stripe webhook signature.' }); }
  if (db) { const ref = db.collection('stripe_webhook_events').doc(event.id); if ((await ref.get()).exists) return res.json({ received: true, duplicate: true }); await ref.create({ type: event.type, created: Date.now() }); }
  const object = event.data.object as Record<string, any>; const metadata = object.metadata || {}; const uid = typeof metadata.userId === 'string' ? metadata.userId : ''; if (!uid) return res.json({ received: true, ignored: true });
  const account = await getAccount(uid); const subscription = { ...account.subscription }; const usage = { ...account.usage };
  if (event.type === 'checkout.session.completed') { const s = object as Stripe.Checkout.Session; const sid = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id; const cid = typeof s.customer === 'string' ? s.customer : s.customer?.id; const plan: Plan = metadata.plan === 'yearly' || metadata.planId === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly'; Object.assign(subscription, { id: sid || `sub_${event.id}`, stripeSubscriptionId: sid, stripeCustomerId: cid, plan, status: 'PRO' as Status, features: featuresFor(plan) }); usage.exportsLimit = -1; }
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') { const s = object as Stripe.Subscription; const plan: Plan = metadata.plan === 'yearly' ? 'pro_yearly' : 'pro_monthly'; subscription.id = s.id; subscription.stripeSubscriptionId = s.id; subscription.stripeCustomerId = typeof s.customer === 'string' ? s.customer : s.customer.id; subscription.plan = plan; subscription.status = s.status === 'trialing' ? 'TRIAL' : s.status === 'past_due' ? 'PAST_DUE' : s.status === 'canceled' ? 'CANCELED' : 'PRO'; subscription.currentPeriodEnd = Number((s as any).current_period_end || 0) * 1000 || subscription.currentPeriodEnd; subscription.cancelAtPeriodEnd = Boolean((s as any).cancel_at_period_end); subscription.features = subscription.status === 'PRO' || subscription.status === 'TRIAL' ? featuresFor(plan) : featuresFor('free'); usage.exportsLimit = subscription.status === 'PRO' || subscription.status === 'TRIAL' ? -1 : 5; }
  if (event.type === 'customer.subscription.deleted') { subscription.status = 'CANCELED'; subscription.plan = 'free'; subscription.features = featuresFor('free'); usage.exportsLimit = 5; }
  if (event.type === 'invoice.payment_failed') { subscription.status = 'PAST_DUE'; subscription.features = featuresFor('free'); usage.exportsLimit = 5; }
  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') { if (subscription.plan !== 'free') { subscription.status = 'PRO'; subscription.features = featuresFor(subscription.plan); usage.exportsLimit = -1; } }
  const invoices = [...account.invoices]; if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') invoices.unshift({ id: object.id, number: object.number || object.id, amount: Number(object.amount_paid || object.amount_due || 0) / 100, currency: object.currency || 'eur', status: 'paid', created: Number(object.created || Math.floor(Date.now() / 1000)) * 1000, pdfUrl: object.invoice_pdf || undefined, interval: subscription.plan === 'pro_yearly' ? 'year' : 'month' });
  await saveAccount(uid, { tier: subscription.status === 'PRO' || subscription.status === 'TRIAL' ? 'PRO' : 'FREE', subscription, usage, invoices: invoices.slice(0, 100) });
  return res.json({ received: true });
});

app.use(express.json({ limit: '256kb' }));
app.use(auth);
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.1.0-netlify', service: 'MasteringLocal.Pro Netlify Gateway', timestamp: Date.now(), environment: NODE_ENV, checks: { firebase: firebaseReady, firestoreDatabase: FIRESTORE_DATABASE_ID, stripe: Boolean(stripe), gemini: Boolean(process.env.GEMINI_API_KEY), legal: Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_VAT_ID) } }));
app.get('/me', async (req, res) => { const u = userOf(req); const a = await getAccount(u.uid, u.email); res.json({ user: { id: u.uid, email: a.email || u.email, name: a.name }, subscription: a.subscription, usage: a.usage }); });
app.get(['/entitlements', '/entitlement'], async (req, res) => { const u = userOf(req); const a = await getAccount(u.uid, u.email); const pro = a.subscription.status === 'PRO' || a.subscription.status === 'TRIAL'; res.json({ entitlement: { plan: a.subscription.plan, status: a.subscription.status, customerId: u.uid, subscriptionId: a.subscription.stripeSubscriptionId || a.subscription.id, currentPeriodEnd: a.subscription.currentPeriodEnd, cancelAtPeriodEnd: a.subscription.cancelAtPeriodEnd, features: a.subscription.features, lastVerifiedAt: Date.now() }, usage: a.usage, user: { id: u.uid, email: a.email || u.email, name: a.name }, tier: pro ? 'PRO' : 'FREE', limits: { maxBitDepth: pro ? 32 : 16, allowFloatingPoint: pro, allowUnlimitedExports: pro, monthlyExportsLimit: pro ? -1 : 5, exportsRemaining: pro ? -1 : Math.max(0, a.usage.exportsLimit - a.usage.exportsUsed), advancedPresets: pro, lufsAnalysis: true, truePeakLimiting: true, commercialLicense: pro } }); });
app.get('/subscription', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ subscription: a.subscription, usage: a.usage }); });
app.get('/usage', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ usage: a.usage }); });
app.get('/billing/invoices', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ invoices: a.invoices }); });
app.get('/account/exports', async (req, res) => { const a = await getAccount(userOf(req).uid); res.json({ exports: a.exportHistory }); });
app.get('/legal-config', (_req, res) => { const configured = Boolean(process.env.LEGAL_BUSINESS_NAME && process.env.LEGAL_BUSINESS_ADDRESS && process.env.LEGAL_BUSINESS_COUNTRY && process.env.LEGAL_REGISTRATION_NUMBER && process.env.LEGAL_VAT_ID && process.env.LEGAL_SUPPORT_EMAIL && process.env.LEGAL_PRIVACY_EMAIL && process.env.LEGAL_GOVERNING_LAW); res.json({ businessName: process.env.LEGAL_BUSINESS_NAME || '', tradingName: 'MasteringLocal.Pro', registeredAddress: process.env.LEGAL_BUSINESS_ADDRESS || '', country: process.env.LEGAL_BUSINESS_COUNTRY || '', registrationNumber: process.env.LEGAL_REGISTRATION_NUMBER || '', vatId: process.env.LEGAL_VAT_ID || '', supportEmail: process.env.LEGAL_SUPPORT_EMAIL || '', privacyEmail: process.env.LEGAL_PRIVACY_EMAIL || '', governingLaw: process.env.LEGAL_GOVERNING_LAW || '', isConfigured: configured }); });

app.post(['/stripe/checkout', '/checkout'], limiter(10, 60000), async (req, res) => { if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' }); const raw = req.body?.plan || req.body?.planId; if (!['monthly', 'yearly', 'pro_monthly', 'pro_yearly'].includes(raw)) return res.status(400).json({ error: 'Invalid plan selected.' }); const yearly = raw === 'yearly' || raw === 'pro_yearly'; const plan: Plan = yearly ? 'pro_yearly' : 'pro_monthly'; const priceId = yearly ? process.env.STRIPE_PRO_YEARLY_PRICE_ID : process.env.STRIPE_PRO_MONTHLY_PRICE_ID; if (!priceId) return res.status(503).json({ error: 'Stripe price is not configured.' }); const u = userOf(req); const a = await getAccount(u.uid, u.email); let customerId = a.subscription.stripeCustomerId; if (!customerId) { const customer = await stripe.customers.create({ email: a.email || u.email, metadata: { userId: u.uid } }); customerId = customer.id; } const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer: customerId, line_items: [{ price: priceId, quantity: 1 }], success_url: `${origin(req)}/?checkout=success`, cancel_url: `${origin(req)}/?checkout=cancelled`, allow_promotion_codes: true, metadata: { userId: u.uid, plan, planId: plan }, subscription_data: { metadata: { userId: u.uid, plan, planId: plan } } }); await saveAccount(u.uid, { subscription: { ...a.subscription, stripeCustomerId: customerId } }); return res.json({ url: session.url, sessionId: session.id }); });
app.post('/stripe/portal', async (req, res) => { if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' }); const a = await getAccount(userOf(req).uid); if (!a.subscription.stripeCustomerId) return res.status(409).json({ error: 'No Stripe customer found.' }); const session = await stripe.billingPortal.sessions.create({ customer: a.subscription.stripeCustomerId, return_url: origin(req) }); res.json({ url: session.url }); });
app.post('/subscription/cancel', async (req, res) => { if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' }); const u = userOf(req); const a = await getAccount(u.uid); const sid = a.subscription.stripeSubscriptionId; if (!sid) return res.status(409).json({ error: 'No active Stripe subscription.' }); const updated = req.body?.immediately ? await stripe.subscriptions.cancel(sid) : await stripe.subscriptions.update(sid, { cancel_at_period_end: true }); const subscription = { ...a.subscription, cancelAtPeriodEnd: Boolean((updated as any).cancel_at_period_end), currentPeriodEnd: Number((updated as any).current_period_end || 0) * 1000 || a.subscription.currentPeriodEnd }; await saveAccount(u.uid, { subscription }); res.json({ subscription }); });

app.post('/privacy/data-request', limiter(5, 3600000), async (req, res) => { const u = userOf(req); const type = req.body?.type; if (!['access', 'rectification', 'erasure', 'portability', 'objection'].includes(type)) return res.status(400).json({ error: 'Invalid data request type.' }); const requestId = `dsar_${crypto.randomUUID()}`; if (db) await db.collection('privacy_requests').doc(requestId).set({ requestId, userId: u.uid, email: u.email, type, details: req.body?.details || '', createdAt: FieldValue.serverTimestamp(), status: 'received' }); res.json({ requestId, message: 'Your data request has been recorded.' }); });
app.post('/account/delete', async (req, res) => { const u = userOf(req); if (db) await db.collection('accounts').doc(u.uid).set({ tier: 'FREE', subscription: { ...defaultAccount(u.uid).subscription, status: 'CANCELED' }, usage: { ...defaultAccount(u.uid).usage }, exportHistory: [], updatedAt: Date.now(), deletedAt: FieldValue.serverTimestamp() }, { merge: true }); try { await adminAuth?.deleteUser(u.uid); } catch (error) { console.warn('[Account delete] auth deletion failed', error); } res.json({ success: true, message: 'Account deleted. Financial records are retained only where legally required.' }); });

app.post('/ai/mastering', limiter(20, 60000), (req, res) => { req.url = '/api/ai/mastering'; void aiHandler(req, res); });
app.post('/ai/release', limiter(20, 60000), (req, res) => { req.url = '/api/ai/release'; void aiHandler(req, res); });

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error('[API]', error); if (!res.headersSent) res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error.' }); });

export const handler = serverless(app, { requestId: false });
