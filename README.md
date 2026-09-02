# MasteringLocal.Pro Studio 🎛️

**Professional browser-based audio mastering workstation.**
Built for producers and engineers, with browser-native mastering DSP, stem control, structured audio analysis, account/billing infrastructure, and release-oriented CI/CD.

## 🚀 Current Architecture & Status

* **Premium studio UI:** Core mastering and stem-mixing controls are exposed through the studio interface, with responsive layouts and touch-friendly controls.
* **Loudness & telemetry:** The application includes EBU/ITU-style loudness and true-peak telemetry. The normative ITU-R BS.1770-5 hardening and deterministic compliance vectors are tracked in the dedicated DSP gate PR before merge to `main`.
* **Stem Mixer:** Four control channels provide independent gain, L/R panning, mute, and solo routing through the Web Audio graph. Pan is a React-controlled UI value and supports center reset.
* **Responsive UI:** The interface is designed around accessible touch targets, responsive layouts, keyboard interaction, and reflow-friendly mobile presentation.
* **Cloudflare deployment path:** Production deployment is configured for Cloudflare Worker + Container using Wrangler and explicit `wrangler.jsonc` configuration. Production deployment remains subject to the documented release gates below.

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand.
* **Audio Engine:** Web Audio API, `AudioWorklet`, Web Workers for offline rendering and heavier audio analysis.
* **Backend/Edge:** Node.js / Express in `server.ts` plus Cloudflare Worker/Container infrastructure.
* **Identity & data:** Firebase Auth / Firestore integration.
* **Payments:** Stripe Checkout, Customer Portal, and webhook verification.
* **AI:** Server-side provider integration; provider secrets are not exposed to the browser.
* **CI/CD:** GitHub Actions for typecheck, lint, tests, build, audit, secret checks, and release validation.

## 💻 Local Development

```bash
npm ci
npm run dev
npm run lint
npm run build
npm test
```

Use a local `.env` based on `.env.example`. Never commit it.

## 🔒 Engineering & Security Principles

* **Zero fake functionality:** UI controls must map to real application state and DSP routing; displayed measurements must come from measured audio paths rather than hard-coded values.
* **Deterministic DSP:** Standards-based DSP changes require reproducible unit tests and explicit sample-rate assumptions.
* **Client-side audio privacy:** Browser audio processing is designed to remain local unless an explicit server API is used for a separate product function.
* **Secrets stay out of source:** Production credentials belong in the runtime secret store, not Git, Docker images, or committed configuration.
* **Green CI before merge:** Pull requests must pass the repository's required validation gates before entering `main`.

## What must be completed before a paid public release

All items in this section are release blockers unless explicitly accepted as a documented, time-bound exception by the business owner.

### 1. Production infrastructure and domain

- [ ] Merge the Cloudflare deployment changes only after required GitHub Actions checks pass.
- [ ] Create the production Worker/Container deployment and attach the production custom domain.
- [ ] Configure DNS, TLS, canonical URL, `APP_URL`, and `ALLOWED_ORIGINS` for the exact public HTTPS domain.
- [ ] Store every production setting as a runtime secret where applicable; do not store secrets in Git, images, or Wrangler config.
- [ ] Verify container startup, `GET /api/health`, static assets, Worker logs, and rollback procedure.
- [ ] Configure uptime/error monitoring and alerts before inviting customers.

### 2. Firebase authentication and durable data

- [ ] Create/select the real production Firebase project and Firestore database.
- [ ] Deploy and review Firestore rules and required indexes.
- [ ] Configure Firebase Admin credentials as runtime secrets and verify them in production.
- [ ] Verify sign-up, sign-in, sign-out, expired-token handling, account deletion, data export, and authorization boundaries.
- [ ] Confirm no production request falls back to an in-memory account store.
- [ ] Test backup, restore, retention, and deletion procedures.

### 3. Stripe and paid entitlements

- [ ] Create live Stripe products and monthly/yearly prices, then configure the matching price IDs.
- [ ] Configure Stripe secret and webhook credentials as production secrets.
- [ ] Register the production webhook endpoint and verify signatures using controlled test events.
- [ ] Test Checkout, Customer Portal, cancellation, resume, payment failure, renewal, refund, and webhook idempotency.
- [ ] Verify persisted entitlement state after every relevant billing event.

### 4. AI safety, cost control, and service quality

- [ ] Set the production AI key/model and verify the secret is never delivered to a browser bundle or logs.
- [ ] Test invalid, oversized, concurrent, timed-out, and malformed AI requests.
- [ ] Establish quotas, cost alerts, abuse monitoring, and incident response.
- [ ] Ensure AI advice distinguishes measured audio facts from interpretation and never invents analysis values.

### 5. Product and audio quality assurance

- [ ] Run the complete audio regression suite on representative mono/stereo files, common sample rates, bit depths, silence, clipped material, long files, and repeated import/export cycles.
- [ ] Validate LUFS, true peak, waveform, playback, DSP, worker/worklet lifecycle, and exported-file correctness against reference tools where applicable.
- [ ] Test primary journeys on current desktop and mobile browsers: upload, analyse, master, preview, export, account, billing, and legal pages.
- [ ] Complete accessibility, keyboard, responsive-layout, and error-state testing.
- [ ] Maintain automated tests for billing, authentication, webhooks, API contracts, and DSP measurement behavior.

### 6. Security, privacy, and legal readiness

- [ ] Run dependency audit and targeted security review; remediate or formally accept findings.
- [ ] Verify CORS, security headers, rate limits, payload limits, logging redaction, and secret rotation.
- [ ] Complete public Terms, Privacy Policy, cookie disclosure/consent flow, data-subject request process, and retention policy.
- [ ] Replace placeholder legal values with the registered business identity and governing details.

### 7. Release operations

- [ ] Require green CI for pull requests and the protected `main` branch.
- [ ] Make `npm ci`, lint, build, tests, audit, and deployment validation pass from a clean runner.
- [ ] Create a staging deployment with test billing configuration and run the API smoke test.
- [ ] Record release commit SHA, version, owner, deployment URL, monitoring links, and rollback version.
- [ ] Publish release notes and establish support and incident-handling procedures.

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
