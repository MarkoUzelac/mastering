/**
 * Privacy-First Analytics and Monetization Funnel Tracker
 * Collects zero audio data - only high-level UI conversion and mastering state events.
 * Strictly gated behind Cookie Consent (analytics category).
 */
import { cookieConsent } from '../legal/cookie-consent';

export type FunnelEventName =
  | 'page_view'
  | 'pricing_view'
  | 'audio_uploaded'
  | 'analysis_completed'
  | 'mastering_started'
  | 'mastering_completed'
  | 'preview_started'
  | 'export_started'
  | 'export_completed'
  | 'pro_feature_clicked'
  | 'pro_paywall_viewed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'subscription_activated'
  | 'subscription_synchronized'
  | 'subscription_canceled'
  | 'payment_failed';

export interface AnalyticsEvent {
  event: FunnelEventName;
  timestamp: number;
  properties?: Record<string, unknown>;
}

class AnalyticsService {
  private eventsLog: AnalyticsEvent[] = [];

  public track(event: FunnelEventName, properties?: Record<string, unknown>) {
    if (!cookieConsent.isAllowed('analytics')) return;

    const record: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      properties,
    };
    this.eventsLog.push(record);

    if (this.eventsLog.length > 200) this.eventsLog.shift();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ANALYTICS] ${event}`, properties || '');
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    if (!cookieConsent.isAllowed('analytics')) return [];
    return [...this.eventsLog];
  }
}

export const analytics = new AnalyticsService();
