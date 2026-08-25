/**
 * Granular GDPR / ePrivacy Cookie Consent Manager
 * Controls activation of optional preferences, analytics, and marketing categories.
 */

export interface CookieConsentCategories {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface StoredConsentPayload {
  version: number;
  timestamp: number;
  categories: CookieConsentCategories;
}

const STORAGE_KEY = 'mastering_cookie_consent_v1';
const CONSENT_VERSION = 1;

class CookieConsentService {
  private consent: CookieConsentCategories = {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };

  private hasUserAnswered = false;
  private listeners: Array<(consent: CookieConsentCategories) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredConsentPayload = JSON.parse(stored);
        if (parsed && parsed.version === CONSENT_VERSION && parsed.categories) {
          this.consent = {
            necessary: true, // always true
            preferences: Boolean(parsed.categories.preferences),
            analytics: Boolean(parsed.categories.analytics),
            marketing: Boolean(parsed.categories.marketing),
          };
          this.hasUserAnswered = true;
        }
      }
    } catch {
      // Fallback to strict defaults on parse error
      this.hasUserAnswered = false;
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const payload: StoredConsentPayload = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        categories: { ...this.consent, necessary: true },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[CookieConsent] Failed to write consent to storage:', e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getConsent());
      } catch (err) {
        console.error('[CookieConsent] Error in listener:', err);
      }
    });
  }

  public hasConsented(): boolean {
    return this.hasUserAnswered;
  }

  public getConsent(): CookieConsentCategories {
    return { ...this.consent, necessary: true };
  }

  public isAllowed(category: keyof CookieConsentCategories): boolean {
    if (category === 'necessary') return true;
    return Boolean(this.consent[category]);
  }

  public setConsent(categories: Partial<CookieConsentCategories>) {
    this.consent = {
      necessary: true,
      preferences: Boolean(categories.preferences),
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
    };
    this.hasUserAnswered = true;
    this.saveToStorage();
    this.notify();
  }

  public acceptAll() {
    this.setConsent({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  }

  public rejectNonEssential() {
    this.setConsent({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  }

  public resetConsent() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    this.consent = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };
    this.hasUserAnswered = false;
    this.notify();
  }

  public subscribe(listener: (consent: CookieConsentCategories) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const cookieConsent = new CookieConsentService();
