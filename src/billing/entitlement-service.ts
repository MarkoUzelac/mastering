import { EntitlementStatus, PlanId } from './billing-config';
import { analytics } from './analytics';
import { getApiAuthHeaders } from '../lib/firebase';

export interface UserEntitlement {
  plan: PlanId;
  status: EntitlementStatus;
  customerId: string;
  subscriptionId: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  features: string[];
  lastVerifiedAt: number;
}
export interface UserUsage { period: string; exportsUsed: number; exportsLimit: number; resetAt: number; }
export interface UserAccount { id: string; email: string; name: string; avatarUrl?: string; paymentMethod?: { brand: string; last4: string; expMonth: number; expYear: number; }; }
export type EntitlementListener = (entitlement: UserEntitlement, usage: UserUsage) => void;
export interface ExportLogParams { format: string; trackName: string; duration: number; sampleRate: number; }

class EntitlementService {
  private entitlement: UserEntitlement = { plan: 'free', status: 'FREE', customerId: '', subscriptionId: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, features: ['basic_mastering', 'waveform', 'spectrum', '16bit_export'], lastVerifiedAt: Date.now() };
  private usage: UserUsage = { period: new Date().toISOString().slice(0, 7), exportsUsed: 0, exportsLimit: 5, resetAt: Date.now() + 30 * 86400000 };
  private user: UserAccount = { id: '', email: '', name: '' };
  private listeners = new Set<EntitlementListener>();
  private isFetching = false;

  constructor() { void this.fetchServerEntitlements(); }
  public getEntitlement() { return { ...this.entitlement }; }
  public getUsage() { return { ...this.usage }; }
  public getUser() { return { ...this.user }; }
  public subscribe(listener: EntitlementListener) { this.listeners.add(listener); listener(this.entitlement, this.usage); return () => this.listeners.delete(listener); }
  private notify() { this.listeners.forEach((listener) => listener(this.entitlement, this.usage)); }
  public canExport() { const pro = this.entitlement.status === 'PRO' || this.entitlement.status === 'TRIAL'; if (pro) return { allowed: true }; if (this.usage.exportsLimit !== -1 && this.usage.exportsUsed >= this.usage.exportsLimit) return { allowed: false, reason: `Monthly export limit of ${this.usage.exportsLimit} reached for Free Tier.` }; return { allowed: true }; }

  public async fetchServerEntitlements(): Promise<UserEntitlement> {
    if (this.isFetching) return this.entitlement;
    this.isFetching = true;
    try {
      const res = await fetch('/api/entitlements', { headers: await getApiAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.entitlement) this.entitlement = { ...data.entitlement, lastVerifiedAt: Date.now() };
        if (data.usage) this.usage = data.usage;
        if (data.user) this.user = data.user;
        this.notify();
      }
    } catch { /* offline */ } finally { this.isFetching = false; }
    return this.entitlement;
  }

  public setEntitlementFromServer(entitlement: UserEntitlement, usage?: UserUsage) { this.entitlement = { ...entitlement, lastVerifiedAt: Date.now() }; if (usage) this.usage = usage; this.notify(); analytics.track('subscription_synchronized', { plan: entitlement.plan, status: entitlement.status }); }

  public async recordExport(paramsOrFormat: string | ExportLogParams, trackName?: string, duration?: number, sampleRate?: number): Promise<{ allowed: boolean; remaining: number }> {
    const payload: ExportLogParams = typeof paramsOrFormat === 'object' ? paramsOrFormat : { format: paramsOrFormat, trackName: trackName || 'Master Track.wav', duration: duration || 0, sampleRate: sampleRate || 48000 };
    try {
      const res = await fetch('/api/exports/log', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getApiAuthHeaders()) }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return { allowed: false, remaining: Math.max(0, this.usage.exportsLimit - this.usage.exportsUsed) };
      if (result.usage) { this.usage = result.usage; this.notify(); }
      return { allowed: result.allowed !== false, remaining: result.usage?.exportsLimit === -1 ? Infinity : Math.max(0, (result.usage?.exportsLimit || 5) - (result.usage?.exportsUsed || 0)) };
    } catch { return { allowed: false, remaining: 0 }; }
  }
}

export const entitlementService = new EntitlementService();
