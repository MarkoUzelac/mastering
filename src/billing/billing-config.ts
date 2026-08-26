/**
 * Centralized Billing & Monetization Configuration
 * Source of truth for plans, pricing, feature definitions, and quotas.
 */

export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly';
export type EntitlementStatus = 'FREE' | 'PRO' | 'TRIAL' | 'EXPIRED' | 'CANCELED' | 'PAST_DUE';
export type BillingInterval = 'month' | 'year';

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
}

export interface PlanConfig {
  id: PlanId;
  tier: 'FREE' | 'PRO';
  name: string;
  badge?: string;
  price: number;
  currency: string;
  currencySymbol: string;
  interval: BillingInterval | null;
  periodLabel: string;
  savingsLabel?: string;
  description: string;
  exportsLimit: number; // monthly export quota (-1 for unlimited)
  features: string[];
  ctaLabel: string;
  isPopular?: boolean;
}


export const BILLING_PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    tier: 'FREE',
    name: 'MasteringPro Free',
    badge: 'ACTIVE',
    price: 0,
    currency: 'EUR',
    currencySymbol: '€',
    interval: null,
    periodLabel: '/ forever',
    description: 'Start mastering for free. 5 standard 16-bit master exports / month.',
    exportsLimit: 5,
    features: [
      'Zero-latency browser audio mastering engine',
      '3-Band RBJ Biquad Parametric EQ',
      'Stereo-linked RMS Feedback Compressor',
      'Peak Limiter (-1.0 dBFS safety ceiling)',
      'Dual-channel waveform scrubber & CRT spectrum',
      '5 standard 16-bit Master exports per month',
      '100% Client-side privacy guarantee (audio stays in browser)'
    ],
    ctaLabel: 'Current Plan',
  },
  pro_monthly: {
    id: 'pro_monthly',
    tier: 'PRO',
    name: 'MasteringPro Pro',
    badge: 'MONTHLY',
    price: 19,
    currency: 'EUR',
    currencySymbol: '€',
    interval: 'month',
    periodLabel: '/ month',
    description: 'Release-ready mastering without limits. Unlimited high-res exports.',
    exportsLimit: -1, // Unlimited
    features: [
      'Everything in Free tier',
      'Studio-grade 24-bit PCM & 32-bit Float WAV export',
      'Advanced Mastering Profiles & Custom Preset saving',
      'ITU-R BS.1770 Integrated & Momentary LUFS loudness target analyzer',
      'True Peak precision ceiling & headroom calibration'
    ],
    ctaLabel: 'Subscribe for €19/month',
  },
  pro_yearly: {
    id: 'pro_yearly',
    tier: 'PRO',
    name: 'MasteringPro Pro Annual',
    badge: 'BEST VALUE',
    price: 169,
    currency: 'EUR',
    currencySymbol: '€',
    interval: 'year',
    periodLabel: '/ year',
    savingsLabel: 'Equivalent to €14.08/month · Save €59/year',
    description: 'Professional mastering for active artists and producers.',
    exportsLimit: -1, // Unlimited
    features: [
      'Everything in Pro Monthly',
      'Full annual commercial release rights',
      'Priority feature updates & beta DSP access',
      'Uncapped 24-bit/32-bit float master exports',
      'Save over 25% compared to monthly billing'
    ],
    ctaLabel: 'Subscribe for €169/year',
    isPopular: true,
  },
};

export const PRO_FEATURES_REGISTRY = {
  HIGH_RES_EXPORT: {
    id: 'high_res_export',
    name: '24-bit / 32-bit Master WAV Export',
    description: 'Lossless studio master rendering with 24-bit integer and 32-bit float dithering.',
    isPro: true,
  },
  ADVANCED_PRESETS: {
    id: 'advanced_presets',
    name: 'Advanced Mastering Profiles & Custom Presets',
    description: 'Access curated genre mastering curves and save infinite custom presets.',
    isPro: true,
  },
  LUFS_TARGETING: {
    id: 'lufs_targeting',
    name: 'ITU-R BS.1770 LUFS Loudness Target Engine',
    description: 'Calibrated integrated loudness matching for Spotify (-14 LUFS), Apple Music (-16 LUFS), and Club (-9 LUFS).',
    isPro: true,
  },
  TRUE_PEAK_CALIBRATION: {
    id: 'true_peak_calibration',
    name: 'True Peak Precision Calibration',
    description: 'Inter-sample peak detection and adjustable brickwall safety ceiling (-0.1 to -2.0 dBFS).',
    isPro: true,
  },
  VERSION_HISTORY: {
    id: 'version_history',
    name: 'A/B Version History Snapshots',
    description: 'Store and instantly switch between multiple candidate master revisions.',
    isPro: true,
  },
  COMMERCIAL_LICENSE: {
    id: 'commercial_license',
    name: 'Commercial Mastering License',
    description: 'Certificate for commercial distribution across all digital streaming platforms and physical media.',
    isPro: true,
  },
  UNLIMITED_EXPORTS: {
    id: 'unlimited_exports',
    name: 'Unlimited High-Resolution Exports',
    description: 'No monthly rate limiting or export throttle constraints.',
    isPro: true,
  },
} as const;

export type FeatureKey = keyof typeof PRO_FEATURES_REGISTRY;
