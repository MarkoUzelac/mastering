# Cloudflare Containers deployment

This deployment keeps the existing Node 22 / Express gateway in a Linux container. The Cloudflare Worker is the public endpoint and forwards each request to one stable container instance on port 3000.

## Prerequisites

- A Cloudflare account with Workers and Containers enabled.
- Docker running locally (or a configured remote container image).
- Node 22 and npm.
- Firebase, Stripe, Gemini, and legal production values.

## Install and validate

```bash
npm ci
npx wrangler whoami
npx wrangler deploy --dry-run
```

The first real deployment builds the Docker image and may take a few minutes to provision the container:

```bash
npx wrangler deploy
npx wrangler containers list
```

After the Worker is healthy, attach the intended custom domain in Cloudflare Workers routes/custom domains and update `APP_URL` and `ALLOWED_ORIGINS` to that exact HTTPS origin.

## Required Worker secrets

The Worker injects these secret bindings into the container at startup. Create them interactively with `npx wrangler secret put NAME`; do not commit a values file.

```text
APP_URL
ALLOWED_ORIGINS
FIRESTORE_DATABASE_ID
FIREBASE_SERVICE_ACCOUNT_JSON
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
GEMINI_API_KEY
GEMINI_MODEL
LEGAL_BUSINESS_ADDRESS
LEGAL_BUSINESS_COUNTRY
LEGAL_BUSINESS_NAME
LEGAL_GOVERNING_LAW
LEGAL_PRIVACY_EMAIL
LEGAL_REGISTRATION_NUMBER
LEGAL_SUPPORT_EMAIL
LEGAL_VAT_ID
```

`FIREBASE_SERVICE_ACCOUNT_JSON`, Stripe credentials, webhook secret, and Gemini key are sensitive. The price IDs and legal configuration are passed as secret bindings too so no deployment-specific data is committed.

## Production checks

1. `GET /api/health` returns `status: ok`.
2. Verify Firebase authentication and Firestore persistence; the application falls back to in-memory state only if Firebase is unavailable.
3. Configure the Stripe webhook to the public `/api/stripe/webhook` endpoint, then send a Stripe test event.
4. Verify the AI routes with an authenticated test user.
5. Run `npx wrangler tail masteringlocal-pro` while performing the smoke test.

## Vercel

The connected Vercel account has no project linked to this repository. Do not use an unrelated Vercel project for this production backend. If Vercel is needed as an alternative Node host, first create and link a dedicated `mastering` project, then configure the same secrets there.
