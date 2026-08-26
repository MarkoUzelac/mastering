const fs = require('fs');
let code = fs.readFileSync('src/billing/billing-config.ts', 'utf8');

const updatedBilling = `
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
`;

code = code.replace(/export const BILLING_PLANS: Record<PlanId, PlanConfig> = \{[\s\S]*?\};\n/g, updatedBilling);
fs.writeFileSync('src/billing/billing-config.ts', code);
console.log('patched billing');
