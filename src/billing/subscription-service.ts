import { PlanId } from './billing-config';
import { entitlementService, UserEntitlement } from './entitlement-service';
import { analytics } from './analytics';

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  created: number;
  pdfUrl?: string;
  interval: string;
}

export interface ExportHistoryRecord {
  id: string;
  filename: string;
  format: string;
  sampleRate: number;
  channels: number;
  duration: number;
  profileName: string;
  createdAt: number;
  tier: string;
}

class SubscriptionService {
  /**
   * Initiates a verified checkout session with the payment provider backend
   */
  public async createCheckoutSession(planId: PlanId): Promise<{ url?: string; sessionId?: string; success?: boolean; error?: string; provider?: string }> {
    analytics.track('checkout_started', { planId });

    const isYearly = planId === 'pro_yearly';
    const plan = isYearly ? 'yearly' : 'monthly';

    try {
      // First attempt Cloudflare Worker Stripe Checkout endpoint, then standard endpoint
      let res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, planId }),
      });

      if (res.status === 404) {
        res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, planId }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        analytics.track('payment_failed', { error: err.message || err.error });
        return { error: err.message || err.error || 'Payment provider session could not be created' };
      }

      const data = await res.json();
      return data;
    } catch {
      return { error: 'Network error communicating with billing service.' };
    }
  }

  /**
   * Opens the Stripe Customer Portal for self-service subscription and billing management
   */
  public async openCustomerPortal(customerId?: string): Promise<{ url?: string; error?: string }> {
    try {
      let res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      if (res.status === 404) {
        res = await fetch('/api/billing/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.error || err.message || 'Failed to initialize Customer Portal' };
      }

      const data = await res.json();
      return data;
    } catch {
      return { error: 'Network error connecting to Customer Portal.' };
    }
  }

  /**
   * Confirms payment / simulated webhook activation and synchronizes server entitlements
   */
  public async confirmSubscription(sessionId: string, planId: PlanId): Promise<UserEntitlement> {
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, planId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entitlement) {
          entitlementService.setEntitlementFromServer(data.entitlement, data.usage);
          analytics.track('checkout_completed', { planId, sessionId });
          return data.entitlement;
        }
      }
    } catch {
      // Fallback
    }

    // Default optimistic refresh
    const refreshed = await entitlementService.fetchServerEntitlements();
    return refreshed;
  }

  /**
   * Cancels the subscription at period end or immediately
   */
  public async cancelSubscription(immediately = false): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately }),
      });

      const data = await res.json();
      if (res.ok && data.entitlement) {
        entitlementService.setEntitlementFromServer(data.entitlement);
        analytics.track('subscription_canceled', { immediately });
        return { success: true, message: data.message || 'Subscription successfully scheduled for cancellation.' };
      }
      return { success: false, message: data.error || 'Failed to cancel subscription.' };
    } catch {
      return { success: false, message: 'Network connection failed.' };
    }
  }

  /**
   * Resumes a subscription that was marked to cancel at period end
   */
  public async resumeSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/subscription/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok && data.entitlement) {
        entitlementService.setEntitlementFromServer(data.entitlement);
        return { success: true, message: 'Subscription successfully resumed.' };
      }
      return { success: false, message: data.error || 'Failed to resume subscription.' };
    } catch {
      return { success: false, message: 'Network connection failed.' };
    }
  }

  /**
   * Fetches billing history and invoices
   */
  public async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch('/api/billing/invoices');
      if (res.ok) {
        const data = await res.json();
        return data.invoices || [];
      }
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Fetches export history
   */
  public async getExportHistory(): Promise<ExportHistoryRecord[]> {
    try {
      const res = await fetch('/api/account/exports');
      if (res.ok) {
        const data = await res.json();
        return data.exports || [];
      }
    } catch {
      // Fallback
    }
    return [];
  }
}

export const subscriptionService = new SubscriptionService();
