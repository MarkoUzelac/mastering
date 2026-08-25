-- D1 Database Schema for MasteringLocal.Pro Entitlement Layer
-- Issue #53: Cloudflare Worker Checkout + Stripe Webhook + D1 Entitlements

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 3. Stripe Events Table (Idempotency ledger)
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);

-- 4. Indexes for rapid lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_users_customer
  ON users(stripe_customer_id);
