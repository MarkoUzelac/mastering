# MasteringLocal Studio AI

Professional browser-based music mastering and release-preparation studio with browser DSP, structured AI assistance, Firebase-backed accounts, and Stripe subscriptions.

> **Public-release status — 2 September 2026:** the application and Cloudflare Containers deployment path are implemented, but it is **not ready to accept paid public customers** until every required release gate below is completed and recorded.

## Architecture

- **Client:** React 19, TypeScript, Vite, Tailwind, browser audio/DSP workers and audio worklets.
- **Gateway:** Node 22 / Express in `server.ts`; serves the built client and exposes account, billing, export, legal, and AI APIs.
- **Identity and data:** Firebase Auth tokens are verified server-side; Firestore is the intended durable production store.
- **Payments:** Stripe Checkout, Customer Portal, and signature-verified webhook routes.
- **AI:** server-side Gemini calls only; browser code does not receive the provider secret.
- **Production host:** Cloudflare Worker + Container + Durable Object, configured by `wrangler.jsonc`. See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md).

## Run locally

```bash
npm ci
npm run dev
npm run lint
npm run build
npm test
```

Use a local `.env` based on `.env.example`. Never commit it.

## What must be completed before a paid public release

All items in this section are release blockers unless explicitly accepted as a documented, time-bound exception by the business owner.

### 1. Production infrastructure and domain

- [ ] Merge the Cloudflare Containers deployment PR only after its GitHub Actions checks pass.
- [ ] Create the Cloudflare Worker/Container deployment and attach the production custom domain.
- [ ] Configure the DNS, TLS, canonical URL, `APP_URL`, and `ALLOWED_ORIGINS` for the exact public HTTPS domain.
- [ ] Store every production setting as a Cloudflare Worker secret; do not store secrets in Git, Docker images, or Wrangler config.
- [ ] Verify container startup, `GET /api/health`, static assets, Worker logs, and a rollback procedure.
- [ ] Configure uptime/error monitoring and alerts before inviting customers.

### 2. Firebase authentication and durable data

- [ ] Create/select the real production Firebase project and production Firestore database.
- [ ] Deploy and review Firestore rules and required indexes.
- [ ] Configure Firebase Admin credentials as a runtime secret and verify they work in the Cloudflare container.
- [ ] Verify sign-up, sign-in, sign-out, expired-token handling, account deletion, data export, and authorization boundaries with real test accounts.
- [ ] Confirm that no production request falls back to the server's in-memory account store.
- [ ] Test backup, restore, retention, and deletion procedures for customer and billing-related data.

### 3. Stripe and paid entitlements

- [ ] Create live Stripe products and monthly/yearly prices, then set the matching price IDs.
- [ ] Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as production secrets.
- [ ] Register the production `/api/stripe/webhook` endpoint in Stripe and verify its signature using Stripe test events.
- [ ] Test Checkout, return URLs, Customer Portal, cancellation, resume, payment failure, renewal, refund, and webhook idempotency.
- [ ] Verify that Firestore records are the authoritative persisted entitlement state after every relevant Stripe event.
- [ ] Run a controlled live-mode purchase only after all test-mode flows pass and finance/legal approval is in place.

### 4. AI safety, cost control, and service quality

- [ ] Set the production Gemini key and model; verify it is never delivered in a browser bundle or log.
- [ ] Test invalid, oversized, and concurrent AI requests plus provider timeouts and malformed responses.
- [ ] Establish request quotas, cost alerts, abuse monitoring, and an incident response process appropriate to expected traffic.
- [ ] Confirm AI advice clearly distinguishes provided audio measurements from interpretation and does not invent analysis values.

### 5. Product and audio quality assurance

- [ ] Run the complete audio regression suite on representative mono/stereo files, common sample rates, bit depths, silence, clipped material, long files, and repeated import/export cycles.
- [ ] Validate LUFS, true-peak, waveform, playback, DSP, worker/worklet lifecycle, and exported-file correctness against reference tools where applicable.
- [ ] Test every primary journey on current desktop and mobile browsers: upload, analyse, master, preview, export, account, billing, and legal pages.
- [ ] Complete accessibility, keyboard, responsive-layout, and error-state testing.
- [ ] Add or complete automated tests for billing/entitlements, webhook behavior, authentication boundaries, and API contracts.

### 6. Security, privacy, and legal readiness

- [ ] Run dependency audit and a targeted security review; remediate or formally accept findings before launch.
- [ ] Verify CORS, security headers, rate limits, payload limits, logging redaction, and secret-rotation procedures in the deployed environment.
- [ ] Complete the public Terms, Privacy Policy, cookie disclosure/consent flow, data-subject request process, and retention policy.
- [ ] Replace every placeholder legal value with the registered business identity, address, contact details, VAT/OIB, and governing law.
- [ ] Confirm the actual product behavior, data processors, Stripe use, Firebase use, and AI-provider use match the published legal documents.

### 7. Release operations

- [ ] Require green CI for pull requests and the protected `main` branch.
- [ ] Make `npm ci`, lint, build, tests, audit, and Cloudflare deployment validation pass from a clean runner.
- [ ] Create a staging deployment with test Stripe configuration and run the API smoke test.
- [ ] Record the release commit SHA, version, owner, deployment URL, monitoring links, and rollback version.
- [ ] Publish release notes and establish a support contact and incident-handling process.

## Staging smoke test

With a Firebase test user and Stripe test mode, verify:

```text
GET  /api/health
GET  /api/me
GET  /api/entitlements
GET  /api/usage
POST /api/ai/mastering
POST /api/ai/release
POST /api/stripe/checkout
POST /api/stripe/portal
POST /api/subscription/cancel
POST /api/subscription/resume
POST /api/stripe/webhook
```

## Definition of done

The product may be announced as a paid public release only when:

- all seven release areas above are checked off with evidence;
- the production domain, monitoring, backup/restore, and rollback path have been tested;
- a real end-to-end customer flow succeeds without manual database intervention;
- the business owner approves the final release record.

## Useful links

- Repository: https://github.com/MarkoUzelac/mastering
- Deployment instructions: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- Intended public domain: https://masteringlocal.pro
