import { Container } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

/**
 * Keeps the existing Node/Express application intact inside a Cloudflare
 * Container while this Worker provides the public edge endpoint.
 */
export class MasteringContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "15m";

  // Secrets are Worker bindings. They are injected only when the container
  // starts and are never committed to the Wrangler configuration.
  envVars = {
    NODE_ENV: "production",
    PORT: "3000",
    APP_URL: env.APP_URL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    FIRESTORE_DATABASE_ID: env.FIRESTORE_DATABASE_ID,
    FIREBASE_SERVICE_ACCOUNT_JSON: env.FIREBASE_SERVICE_ACCOUNT_JSON,
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: env.STRIPE_PRO_YEARLY_PRICE_ID,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    GEMINI_MODEL: env.GEMINI_MODEL,
    LEGAL_BUSINESS_ADDRESS: env.LEGAL_BUSINESS_ADDRESS,
    LEGAL_BUSINESS_COUNTRY: env.LEGAL_BUSINESS_COUNTRY,
    LEGAL_BUSINESS_NAME: env.LEGAL_BUSINESS_NAME,
    LEGAL_GOVERNING_LAW: env.LEGAL_GOVERNING_LAW,
    LEGAL_PRIVACY_EMAIL: env.LEGAL_PRIVACY_EMAIL,
    LEGAL_REGISTRATION_NUMBER: env.LEGAL_REGISTRATION_NUMBER,
    LEGAL_SUPPORT_EMAIL: env.LEGAL_SUPPORT_EMAIL,
    LEGAL_VAT_ID: env.LEGAL_VAT_ID,
  };
}

export default {
  async fetch(request: Request, bindings: Env): Promise<Response> {
    // The app relies on Firebase/Firestore for durable production state, so a
    // single stable container avoids using its in-memory fallback across nodes.
    const container = bindings.MASTERING_CONTAINER.getByName("primary");
    return container.fetch(request);
  },
};

interface Env {
  MASTERING_CONTAINER: DurableObjectNamespace<MasteringContainer>;
}
