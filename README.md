# MasteringLocal Studio AI

Professional browser-based music mastering and release-preparation studio built around local/browser DSP, structured audio analysis, server-side AI assistance, and Stripe billing.

> **Release status — 26 August 2026:** Production hardening is still required before declaring a fully production-ready release. This README documents the verified architecture, the required release path, known blockers, deployment options, validation gates, and operational checklist so the remaining work is explicit rather than hidden.

## Product scope

MasteringLocal Studio AI combines:

- browser-side audio processing and analysis;
- waveform/loudness/true-peak oriented mastering workflows;
- structured AI assistance for mastering interpretation and release metadata;
- subscription and entitlement logic with Stripe integration;
- account, export-history, usage and legal-data surfaces;
- Firebase configuration/rules present in the repository;
- a Node/Express production gateway and Vite/React client;
- a Docker packaging path.

## Verified repository architecture

The repository currently contains a Vite + React application, a Node/Express server, AI route handlers, audio/DSP modules, billing services, learning/legal areas, workers and Firebase configuration. The root includes `package.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`, `.env.example`, `server.ts`, `api/ai.ts`, and the `src/` application tree.

### Frontend

- React 19 + TypeScript.
- Vite build pipeline.
- Tailwind CSS 4 tooling.
- `src/main.tsx` bootstraps the application.
- `src/App.tsx` is the principal application shell.
- `src/components/` contains the studio UI, billing, account, analysis and module views.
- `src/audio/`, `src/dsp/`, `src/utils/` contain audio/DSP and engine integration logic.
- `src/workers/` and `public/dsp-worklet.js` support background/audio-worklet processing.

### Backend / gateway

`server.ts` exposes the application API and handles:

- health reporting;
- account/subscription/usage views;
- entitlement calculation;
- billing and invoice surfaces;
- Stripe checkout and customer portal routes;
- subscription cancellation/resume actions;
- legal configuration exposure;
- application serving in production/development.

The current implementation uses in-memory user/subscription/usage/export state, so it is suitable for a single-process preview/demo architecture but **must not be treated as durable multi-user production persistence** without replacing that state with a real datastore.

### AI layer

`src/ai/client.ts` calls server endpoints rather than exposing provider credentials in browser code. `api/ai.ts` currently implements two structured server-side AI routes:

- `POST /api/ai/mastering`
- `POST /api/ai/release`

The AI handler sends requests to Google's Gemini API using `GEMINI_API_KEY`, applies explicit JSON schemas, and instructs the model not to invent audio measurements.

### Billing

Billing logic is split across `server.ts` and `src/billing/` services. The repository contains Stripe price-ID environment variables and checkout/portal/webhook-related routes.

**Important production rule:** client-side or simulated checkout confirmation must never be the authority for paid entitlements. Production entitlement state must be derived from verified Stripe events / Stripe API state and persisted server-side.

### Firebase

The repository includes `firebase-applet-config.json`, `firebase-blueprint.json`, and `firestore.rules`. Validate the Firebase project, authentication model, database indexes, rules deployment and production project selection before release.

## Build system

The current `package.json` defines:

```text
npm run dev     -> tsx server.ts
npm run build   -> tsc && vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
npm start       -> node dist/server.cjs
npm run lint    -> tsc --noEmit
npm run preview -> vite preview
```

TypeScript is configured with strict mode, ES2022 targeting and Vite/bundler module resolution.

Vite production output uses Terser with `drop_console` and manual vendor chunking for React, Lucide and Firebase.

## Environment contract

`.env.example` currently defines the following deployment inputs:

```text
LEGAL_BUSINESS_ADDRESS
LEGAL_BUSINESS_COUNTRY
LEGAL_BUSINESS_NAME
LEGAL_GOVERNING_LAW
LEGAL_PRIVACY_EMAIL
LEGAL_REGISTRATION_NUMBER
LEGAL_SUPPORT_EMAIL
LEGAL_VAT_ID
PAYMENT_MODE
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GEMINI_API_KEY
GEMINI_MODEL
```

### Secret-handling requirements

- Never commit `.env` or provider secrets.
- Keep Gemini and Stripe secret keys server-side only.
- Store production values in the deployment platform's secret/environment-variable store.
- Use test Stripe keys and test prices in staging.
- Rotate any credential that may have been exposed during development.
- Treat legal entity data as required configuration, not a fallback string.

## Google AI Studio

The project currently uses Gemini from a server-side API handler. Google AI Studio is the appropriate place to create/manage Gemini API access and prototype prompts.

**Google AI Studio:** https://aistudio.google.com/

Production deployment should keep the API key out of frontend bundles and set `GEMINI_API_KEY` only on the server/runtime.

## Production deployment paths

### Vercel / Node runtime

Recommended when the project is deployed as a web app with server-side routes.

1. Connect the GitHub repository.
2. Set the production framework/build configuration to match the repository.
3. Install dependencies.
4. Run the verified build command: `npm run build`.
5. Start with `npm start` where a long-running Node server is supported.
6. Configure all required environment variables.
7. Set the canonical public URL, including any Stripe success/cancel URLs and legal/public metadata.
8. Verify `/api/health`, AI routes, authentication, billing and static assets after deployment.

### Docker

The repository contains a Dockerfile intended to package the Node server and built frontend. Before using it for production, verify the dependency lockfile and package-manager assumptions on the release commit. The current Dockerfile references `bun.lock` while the repository root inspected for this release did not expose that file; this is a **release blocker until resolved**.

A production container should additionally use:

- deterministic dependency installation from a committed lockfile;
- a non-root runtime user where practical;
- health checking;
- minimal runtime image contents;
- explicit `NODE_ENV=production`;
- secret injection at runtime, never at build time.

## Release workflow — complete sequence

### Phase 0 — Repository integrity

- Confirm the intended production branch is `main`.
- Confirm the working tree/repository contains the latest intended application changes.
- Confirm no secrets, `.env`, credentials, private certificates or generated artifacts are committed.
- Confirm README, license, legal pages and release notes describe the actual product.

### Phase 1 — Dependency and build verification

Run locally or in CI:

```bash
npm install
npm run lint
npm run build
```

The release gate is **zero TypeScript errors and a successful Vite + server bundle**.

Add dependency-audit and vulnerability scanning to CI before a public production release.

### Phase 2 — Frontend verification

Validate at desktop and mobile breakpoints:

- application boot;
- navigation and all primary views;
- audio file import;
- playback controls;
- waveform rendering;
- meters and analysis values;
- DSP/mastering modules;
- preset/module changes;
- export flow;
- account modal and subscription UI;
- checkout UI;
- legal/cookie surfaces;
- accessibility/focus states;
- responsive layout;
- no console/runtime errors in production build.

### Phase 3 — Audio/DSP verification

Test representative files covering:

- mono and stereo;
- short and long tracks;
- common sample rates;
- 16-bit, 24-bit and 32-bit workflows where supported;
- silence/near-silence;
- clipped material;
- very low/high peak levels;
- repeated play/stop/reload;
- worker/worklet initialization and teardown;
- export correctness and metadata.

Confirm that measured LUFS/peak values shown in the UI are consistent with the browser engine and that AI output never substitutes invented measurements.

### Phase 4 — AI verification

For `POST /api/ai/mastering`:

- reject missing questions;
- reject malformed/oversized JSON;
- verify provider credentials are server-side;
- verify structured JSON response parsing;
- verify measured data is clearly distinguished from interpretation/advice;
- verify provider failures become safe, concise API errors.

For `POST /api/ai/release`:

- require artist + title;
- validate optional metadata;
- verify structured JSON schema;
- verify generated text is original and factual to supplied inputs.

Add rate limiting, abuse controls, request-cost controls and observability before exposing AI endpoints to unrestricted public traffic.

### Phase 5 — Authentication and data

Before multi-user production:

- establish a real authentication model;
- persist users/subscriptions/usage/export history in a durable datastore;
- enforce authorization server-side on every user-specific route;
- remove demo/single-tenant state;
- prevent IDOR-style access to another user's data;
- define deletion, export and rectification semantics;
- back up production data and test restore procedures.

### Phase 6 — Stripe production readiness

Configure:

- live products and price IDs;
- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- webhook endpoint for subscription lifecycle events;
- customer/subscription identifiers stored durably;
- idempotent webhook processing;
- cancellation and past-due handling;
- failed-payment recovery;
- entitlement reconciliation.

The current code includes a simulated checkout fallback. That is useful for preview, but **must be explicitly disabled or isolated from the production payment path**.

### Phase 7 — Security hardening

At minimum:

- strict CORS allowlist for the production origin;
- secure headers / CSP appropriate to deployed assets;
- rate limiting for AI, checkout and data-request routes;
- request size limits;
- input validation and schema validation;
- structured server logging without secrets or payment data;
- webhook signature verification;
- secret rotation procedure;
- dependency vulnerability scanning;
- least-privilege provider credentials.

The current server uses permissive `cors()` configuration and therefore needs tightening for a hardened production release.

### Phase 8 — Legal/compliance

Production values must replace placeholder legal configuration for:

- legal business name;
- registered address;
- country;
- registration number;
- VAT/OIB where applicable;
- support/privacy email;
- governing law/jurisdiction.

Ensure privacy policy, terms, cookie consent and data-subject workflows match the real backend behavior. Do not publish placeholder `REQUIRED_CONFIGURATION` strings.

### Phase 9 — CI/CD

Create a GitHub Actions pipeline with at least:

1. checkout;
2. Node setup;
3. deterministic dependency install;
4. type-check/lint;
5. build;
6. security/dependency audit;
7. optional unit/integration tests;
8. deploy only from the protected production branch after required checks pass.

A successful deployment should expose an artifact/version identifier and a post-deploy smoke-test result.

### Phase 10 — Staging smoke test

Run a staging deployment before production and verify:

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
```

Use test Stripe mode for staging. Confirm that webhook events update durable subscription state correctly.

### Phase 11 — Production cutover

- freeze release branch;
- record commit SHA;
- build production artifact;
- deploy;
- run smoke tests;
- verify domain/TLS;
- verify analytics/monitoring;
- verify Stripe webhooks;
- verify AI health and error rates;
- verify a real non-destructive export;
- monitor immediately after cutover;
- keep rollback path ready.

### Phase 12 — Post-release operations

Maintain:

- error monitoring;
- uptime monitoring;
- API latency/error dashboards;
- AI usage/cost monitoring;
- Stripe webhook monitoring;
- database backups;
- dependency update cadence;
- security disclosure process;
- release notes/changelog;
- documented rollback procedure.

## Current audit findings

### P0 / release blockers

**1. Durable persistence is missing.** `server.ts` stores account, subscription, usage, invoices and export history in process memory. A restart or multi-instance deployment loses state and cannot safely support multiple users.

**2. Production entitlement authority is incomplete.** A client-callable checkout confirmation path currently activates a PRO subscription in memory. Paid access must be based on server-verified Stripe state and persisted records, not a browser-controlled confirmation request.

**3. Docker dependency contract is inconsistent.** The Dockerfile copies `bun.lock`, but that lockfile was not present in the repository root listing inspected during this release audit. The Docker build is therefore not a verified reproducible build until the dependency strategy is corrected.

**4. CI/CD workflow is not present.** No GitHub Actions workflow was found in the repository tree inspection. Production release gates therefore are not automated yet.

### P1 / high priority hardening

**5. CORS is permissive.** `server.ts` currently calls `cors()` without an origin allowlist. Restrict this to approved production origins.

**6. Simulated billing fallback exists.** The checkout handler can fall back to simulated checkout. Keep this behind an explicit non-production mode and make live production fail closed when Stripe configuration is invalid.

**7. Placeholder legal configuration exists.** Legal endpoints intentionally return `REQUIRED_CONFIGURATION [...]` placeholders when environment variables are absent. Production must fail validation rather than publish incomplete legal identity data.

**8. AI route needs production abuse controls.** The current AI handler includes a body-size limit and structured responses, but there is no demonstrated rate limiting, quota enforcement, authentication/authorization or cost guardrail at the route layer.

### P2 / quality improvements

**9. Add automated tests.** There is no verified test script in `package.json`. Establish unit tests for billing/entitlements and integration tests for API contracts before production sign-off.

**10. Add a committed lockfile.** Use one package manager consistently and commit the corresponding lockfile so local, CI and Docker installations resolve identical dependency versions.

## Definition of Done — production release

The release is ready to declare production only when all of the following are true:

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] production deployment passes health and smoke checks.
- [ ] CI runs automatically on pull requests and the protected production branch.
- [ ] dependency installation is deterministic from a committed lockfile.
- [ ] authentication and authorization are enforced server-side.
- [ ] user/account/subscription/usage/export data is durable.
- [ ] Stripe webhooks are verified, idempotent and authoritative.
- [ ] simulated checkout is disabled in production.
- [ ] CORS and security headers are hardened.
- [ ] AI routes are rate-limited and monitored.
- [ ] no secrets are present in Git history or client bundles.
- [ ] legal entity configuration is complete.
- [ ] privacy/cookie/terms flows match actual behavior.
- [ ] audio import/playback/DSP/export flows pass regression testing.
- [ ] rollback procedure is tested.
- [ ] monitoring and alerting are active.

## Release checklist

- [ ] Version/tag chosen.
- [ ] Commit SHA recorded.
- [ ] CI green.
- [ ] Security scan green or documented exceptions approved.
- [ ] Staging smoke test green.
- [ ] Production environment variables verified.
- [ ] Stripe live configuration verified.
- [ ] Gemini production configuration verified.
- [ ] Database backup/restore verified.
- [ ] Production deploy green.
- [ ] `/api/health` green.
- [ ] Critical user journey green.
- [ ] Rollback path confirmed.
- [ ] Release notes published.

## Useful URLs

- Repository: https://github.com/MarkoUzelac/mastering
- Production target currently referenced by the HTML canonical metadata: https://masteringlocal.pro
- Google AI Studio: https://aistudio.google.com/

## Important caveat

This README is intentionally evidence-based. It documents what is currently present plus the exact gates required for a genuine production release. It does **not** claim that unresolved blockers are already fixed merely because the application builds or a deployment exists.
