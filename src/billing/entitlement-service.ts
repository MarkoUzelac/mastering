import { EntitlementStatus, PlanId } from './billing-config';
import { analytics } from './analytics';

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

export interface UserUsage {
  period: string;
  exportsUsed: number;
  exportsLimit: number;
  resetAt: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  paymentMethod?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export type EntitlementListener = (entitlement: UserEntitlement, usage: UserUsage) => void;

export interface ExportLogParams {
  format: string;
  trackName: string;
  duration: number;
  sampleRate: number;
}

class EntitlementService {
  private entitlement: UserEntitlement = {
    plan: 'free',
    status: 'FREE',
    customerId: 'cust_anon_' + Math.random().toString(36).substring(2, 9),
    subscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    features: ['basic_mastering', 'waveform', 'spectrum', '16bit_export'],
    lastVerifiedAt: Date.now(),
  };

  private usage: UserUsage = {
    period: new Date().toISOString().substring(0, 7), // YYYY-MM
    exportsUsed: 1,
    exportsLimit: 5,
    resetAt: new Date(Date.now() + 30 * 86400000).getTime(),
  };

  private user: UserAccount = {
    id: 'usr_mastering_local',
    email: 'producer@studio.local',
    name: 'Mastering Engineer',
    paymentMethod: {
      brand: 'Mastercard',
      last4: '8842',
      expMonth: 12,
      expYear: 2028,
    },
  };

  private listeners: Set<EntitlementListener> = new Set();
  private isFetching = false;

  constructor() {
    this.fetchServerEntitlements();
  }

  public getEntitlement(): UserEntitlement {
    return { ...this.entitlement };
  }

  public getUsage(): UserUsage {
    return { ...this.usage };
  }

  public getUser(): UserAccount {
    return { ...this.user };
  }

  public subscribe(listener: EntitlementListener): () => void {
    this.listeners.add(listener);
    listener(this.entitlement, this.usage);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.entitlement, this.usage));
  }

  public canExport(): { allowed: boolean; reason?: string } {
    const isPro = this.entitlement.status === 'PRO' || this.entitlement.status === 'TRIAL';
    if (isPro) return { allowed: true };

    if (this.usage.exportsLimit !== -1 && this.usage.exportsUsed >= this.usage.exportsLimit) {
      return {
        allowed: false,
        reason: `Monthly export limit of ${this.usage.exportsLimit} reached for Free Tier. Upgrade to Pro for unlimited exports.`,
      };
    }
    return { allowed: true };
  }

  /**
   * Fetches the server-authoritative entitlement state from /api/entitlements
   */
  public async fetchServerEntitlements(): Promise<UserEntitlement> {
    if (this.isFetching) return this.entitlement;
    this.isFetching = true;

    try {
      const res = await fetch('/api/entitlements');
      if (res.ok) {
        const data = await res.json();
        if (data.entitlement) {
          this.entitlement = {
            ...data.entitlement,
            lastVerifiedAt: Date.now(),
          };
          if (data.usage) {
            this.usage = data.usage;
          }
          if (data.user) {
            this.user = data.user;
          }
          this.notify();
        }
      }
    } catch {
      // Backend not yet reached or offline fallback
    } finally {
      this.isFetching = false;
    }
    return this.entitlement;
  }

  /**
   * Updates entitlement upon verified checkout / webhook simulation
   */
  public setEntitlementFromServer(entitlement: UserEntitlement, usage?: UserUsage) {
    this.entitlement = {
      ...entitlement,
      lastVerifiedAt: Date.now(),
    };
    if (usage) {
      this.usage = usage;
    }
    this.notify();
    analytics.track('subscription_activated', { plan: entitlement.plan, status: entitlement.status });
  }

  /**
   * Increments the export counter on the server
   */
  public async recordExport(
    paramsOrFormat: string | ExportLogParams,
    trackName?: string,
    duration?: number,
    sampleRate?: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    let payload: ExportLogParams;

    if (typeof paramsOrFormat === 'object') {
      payload = paramsOrFormat;
    } else {
      payload = {
        format: paramsOrFormat,
        trackName: trackName || 'Master Track.wav',
        duration: duration || 0,
        sampleRate: sampleRate || 48000,
      };
    }

    try {
      const res = await fetch('/api/exports/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.usage) {
          this.usage = result.usage;
          this.notify();
        }
        return {
          allowed: result.allowed !== false,
          remaining: result.usage
            ? result.usage.exportsLimit === -1
              ? Infinity
              : result.usage.exportsLimit - result.usage.exportsUsed
            : 5,
        };
      }
    } catch {
      // Offline fallback
      if (this.entitlement.status === 'PRO') {
        return { allowed: true, remaining: Infinity };
      }
      this.usage.exportsUsed += 1;
      this.notify();
      return {
        allowed: this.usage.exportsUsed <= this.usage.exportsLimit,
        remaining: Math.max(0, this.usage.exportsLimit - this.usage.exportsUsed),
      };
    }
    return { allowed: true, remaining: 5 };
  }
}

export const entitlementService = new EntitlementService();
