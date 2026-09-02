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
  private entitlement: UserEntitlement = {
    plan: 'free',
    status: 'FREE',
    customerId: '',
    subscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    features: [
      'basic_mastering',
      'waveform',
      'spectrum',
      '16bit_export',
      '24bit_export',
      '32bit_float_export',
      'advanced_presets',
      'loudness_analysis',
      'true_peak_analysis',
      'version_history',
      'commercial_use',
    ],
    lastVerifiedAt: Date.now(),
  };
  private usage: UserUsage = {
    period: new Date().toISOString().slice(0, 7),
    exportsUsed: 0,
    exportsLimit: -1,
    resetAt: Date.now() + 30 * 86400000,
  };
  private user: UserAccount = { id: '', email: '', name: '' };
  private listeners = new Set<EntitlementListener>();
  private isFetching = false;

  constructor() { void this.fetchServerEntitlements(); }
  public getEntitlement() { return { ...this.entitlement, features: [...this.entitlement.features] }; }
  public getUsage() { return { ...this.usage }; }
  public getUser() { return { ...this.user }; }
  public subscribe(listener: EntitlementListener) { this.listeners.add(listener); listener(this.entitlement, this.usage); return () => this.listeners.delete(listener); }
  private notify() { this.listeners.forEach((listener) => listener(this.entitlement, this.usage)); }

  public canExport() {
    return { allowed: true, reason: undefined as string | undefined };
  }

  public async fetchServerEntitlements(): Promise<UserEntitlement> {
    if (this.isFetching) return this.entitlement;
    this.isFetching = true;
    try {
      const res = await fetch('/api/entitlements', { headers: await getApiAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.entitlement) {
          this.entitlement = {
            ...data.entitlement,
            plan: 'free',
            status: 'FREE',
            features: Array.from(new Set([
              ...(Array.isArray(data.entitlement.features) ? data.entitlement.features : []),
              'basic_mastering',
              'waveform',
              'spectrum',
              '16bit_export',
              '24bit_export',
              '32bit_float_export',
              'advanced_presets',
              'loudness_analysis',
              'true_peak_analysis',
              'version_history',
              'commercial_use',
            ])),
            lastVerifiedAt: Date.now(),
          };
        }
        if (data.usage) this.usage = { ...data.usage, exportsLimit: -1 };
        if (data.user) this.user = data.user;
        this.notify();
      }
    } catch { /* offline */ } finally { this.isFetching = false; }
    return this.entitlement;
  }

  public setEntitlementFromServer(entitlement: UserEntitlement, usage?: UserUsage) {
    this.entitlement = {
      ...entitlement,
      plan: 'free',
      status: 'FREE',
      features: [...entitlement.features],
      lastVerifiedAt: Date.now(),
    };
    if (usage) this.usage = { ...usage, exportsLimit: -1 };
    this.notify();
    analytics.track('subscription_synchronized', { plan: 'free', status: 'FREE' });
  }

  public async recordExport(paramsOrFormat: string | ExportLogParams, trackName?: string, duration?: number, sampleRate?: number): Promise<{ allowed: boolean; remaining: number }> {
    const payload: ExportLogParams = typeof paramsOrFormat === 'object'
      ? paramsOrFormat
      : { format: paramsOrFormat, trackName: trackName || 'Master Track.wav', duration: duration || 0, sampleRate: sampleRate || 48000 };

    try {
      const res = await fetch('/api/exports/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getApiAuthHeaders()) },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return { allowed: false, remaining: 0 };
      if (result.usage) {
        this.usage = { ...result.usage, exportsLimit: -1 };
        this.notify();
      } else {
        this.usage = { ...this.usage, exportsUsed: this.usage.exportsUsed + 1, exportsLimit: -1 };
        this.notify();
      }
      return { allowed: result.allowed !== false, remaining: Infinity };
    } catch {
      return { allowed: true, remaining: Infinity };
    }
  }
}

export const entitlementService = new EntitlementService();
