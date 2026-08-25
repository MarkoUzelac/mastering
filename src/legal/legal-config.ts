/**
 * Centralized Legal & Compliance Configuration for MasteringLocal.Pro
 * Provides verified metadata placeholders for EU / Consumer Protection compliance.
 * 
 * IMPORTANT: Placeholders marked with 'REQUIRED_CONFIGURATION' must be populated
 * with real business entity details before public deployment.
 */

export interface LegalEntityConfig {
  businessName: string;
  tradingName: string;
  registeredAddress: string;
  country: string;
  registrationNumber: string;
  vatId: string;
  supportEmail: string;
  privacyEmail: string;
  legalRepresentative: string;
  governingLaw: string;
  jurisdictionCourts: string;
  isConfigurationComplete: boolean;
}

export const LEGAL_CONFIG: LegalEntityConfig = {
  businessName: (typeof process !== 'undefined' && process.env?.LEGAL_BUSINESS_NAME) || 'REQUIRED_CONFIGURATION [Legal Entity Name]',
  tradingName: 'MasteringLocal.Pro',
  registeredAddress: (typeof process !== 'undefined' && process.env?.LEGAL_BUSINESS_ADDRESS) || 'REQUIRED_CONFIGURATION [Registered Office Address]',
  country: (typeof process !== 'undefined' && process.env?.LEGAL_BUSINESS_COUNTRY) || 'REQUIRED_CONFIGURATION [e.g. Croatia, European Union]',
  registrationNumber: (typeof process !== 'undefined' && process.env?.LEGAL_REGISTRATION_NUMBER) || 'REQUIRED_CONFIGURATION [Court / Commercial Registry Number]',
  vatId: (typeof process !== 'undefined' && process.env?.LEGAL_VAT_ID) || 'REQUIRED_CONFIGURATION [VAT ID / OIB]',
  supportEmail: (typeof process !== 'undefined' && process.env?.LEGAL_SUPPORT_EMAIL) || 'info@markouzelacuzy.com',
  privacyEmail: (typeof process !== 'undefined' && process.env?.LEGAL_PRIVACY_EMAIL) || 'info@markouzelacuzy.com',
  legalRepresentative: 'REQUIRED_CONFIGURATION [Managing Director / Authorized Representative]',
  governingLaw: (typeof process !== 'undefined' && process.env?.LEGAL_GOVERNING_LAW) || 'REQUIRED_CONFIGURATION [e.g. Laws of the Republic of Croatia and European Union consumer directives]',
  jurisdictionCourts: 'REQUIRED_CONFIGURATION [Competent Court of Jurisdiction]',
  isConfigurationComplete: false,
};

/**
 * Cookie Inventory - Real inventory of cookies and local storage keys actually used in the codebase.
 */
export interface CookieItem {
  name: string;
  category: 'necessary' | 'preferences' | 'analytics' | 'marketing';
  purpose: string;
  provider: string;
  storageType: 'localStorage' | 'sessionStorage' | 'cookie';
  duration: string;
  legalBasis: string;
}

export const ACTUAL_COOKIE_INVENTORY: CookieItem[] = [
  {
    name: 'mastering_cookie_consent_v1',
    category: 'necessary',
    purpose: 'Stores your granular cookie consent preferences (categories approved/rejected).',
    provider: 'MasteringLocal.Pro (First-Party)',
    storageType: 'localStorage',
    duration: '12 months',
    legalBasis: 'Legitimate Interest / Legal Obligation (GDPR Art. 6(1)(c))',
  },
  {
    name: 'mastering_user_entitlement',
    category: 'necessary',
    purpose: 'Caches user subscription plan and entitlement token for audio export gating.',
    provider: 'MasteringLocal.Pro (First-Party)',
    storageType: 'localStorage',
    duration: 'Session / 30 days',
    legalBasis: 'Contractual Performance (GDPR Art. 6(1)(b))',
  },
  {
    name: 'mastering_user_usage',
    category: 'necessary',
    purpose: 'Tracks client-side monthly export count against current tier quota.',
    provider: 'MasteringLocal.Pro (First-Party)',
    storageType: 'localStorage',
    duration: 'Monthly reset cycle',
    legalBasis: 'Contractual Performance (GDPR Art. 6(1)(b))',
  },
  {
    name: 'mastering_custom_presets',
    category: 'preferences',
    purpose: 'Persists user-saved custom mastering EQ and compressor parameter profiles locally.',
    provider: 'MasteringLocal.Pro (First-Party)',
    storageType: 'localStorage',
    duration: 'Persistent until cleared by user',
    legalBasis: 'Consent (GDPR Art. 6(1)(a))',
  },
  {
    name: 'mastering_analytics_funnel',
    category: 'analytics',
    purpose: 'Gathers anonymous client-side interaction events (e.g. master button clicked, export format selected) to improve UI performance. Zero audio data is logged.',
    provider: 'MasteringLocal.Pro (First-Party)',
    storageType: 'localStorage',
    duration: 'Session',
    legalBasis: 'Explicit Consent (GDPR Art. 6(1)(a))',
  },
];
