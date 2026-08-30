import { PlanId } from './billing-config';
import { entitlementService, UserEntitlement } from './entitlement-service';
import { analytics } from './analytics';
import { getApiAuthHeaders } from '../lib/firebase';

export interface Invoice { id: string; number: string; amount: number; currency: string; status: 'paid' | 'open' | 'void'; created: number; pdfUrl?: string; interval: string; }
export interface ExportHistoryRecord { id: string; filename: string; format: string; sampleRate: number; channels: number; duration: number; profileName: string; createdAt: number; tier: string; }

class SubscriptionService {
  private async authHeaders(contentType = false) {
    return { ...(contentType ? { 'Content-Type': 'application/json' } : {}), ...(await getApiAuthHeaders()) };
  }

  public async createCheckoutSession(planId: PlanId) {
    analytics.track('checkout_started', { planId });
    const plan = planId === 'pro_yearly' ? 'yearly' : 'monthly';
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: await this.authHeaders(true), body: JSON.stringify({ plan, planId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || 'Payment provider session could not be created' };
      return data;
    } catch { return { error: 'Network error communicating with billing service.' }; }
  }

  public async openCustomerPortal() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: await this.authHeaders(true), body: '{}' });
      const data = await res.json().catch(() => ({}));
      return res.ok ? data : { error: data.error || 'Failed to initialize Customer Portal' };
    } catch { return { error: 'Network error connecting to Customer Portal.' }; }
  }

  /** Stripe webhooks are authoritative. This method only refreshes state after returning from Checkout. */
  public async confirmSubscription(_sessionId: string, _planId: PlanId): Promise<UserEntitlement> {
    return entitlementService.fetchServerEntitlements();
  }

  public async cancelSubscription(immediately = false) {
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST', headers: await this.authHeaders(true), body: JSON.stringify({ immediately }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.entitlement) { entitlementService.setEntitlementFromServer(data.entitlement); analytics.track('subscription_canceled', { immediately }); return { success: true, message: data.message || 'Subscription successfully scheduled for cancellation.' }; }
      return { success: false, message: data.error || 'Failed to cancel subscription.' };
    } catch { return { success: false, message: 'Network connection failed.' }; }
  }

  public async resumeSubscription() {
    try {
      const res = await fetch('/api/subscription/resume', { method: 'POST', headers: await this.authHeaders(true), body: '{}' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.entitlement) { entitlementService.setEntitlementFromServer(data.entitlement); return { success: true, message: 'Subscription successfully resumed.' }; }
      return { success: false, message: data.error || 'Failed to resume subscription.' };
    } catch { return { success: false, message: 'Network connection failed.' }; }
  }

  public async getInvoices(): Promise<Invoice[]> {
    try { const res = await fetch('/api/billing/invoices', { headers: await getApiAuthHeaders() }); if (res.ok) return (await res.json()).invoices || []; } catch {}
    return [];
  }
  public async getExportHistory(): Promise<ExportHistoryRecord[]> {
    try { const res = await fetch('/api/account/exports', { headers: await getApiAuthHeaders() }); if (res.ok) return (await res.json()).exports || []; } catch {}
    return [];
  }
}

export const subscriptionService = new SubscriptionService();
