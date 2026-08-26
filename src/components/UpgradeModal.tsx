import React from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { FeatureKey, PRO_FEATURES_REGISTRY } from '../billing/billing-config';
import { analytics } from '../billing/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey?: FeatureKey;
  onUpgradeClick: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureKey = 'HIGH_RES_EXPORT',
  onUpgradeClick,
}) => {
  if (!isOpen) return null;

  const featureInfo = PRO_FEATURES_REGISTRY[featureKey] || PRO_FEATURES_REGISTRY.HIGH_RES_EXPORT;

  const handleUpgrade = () => {
    analytics.track('pro_paywall_viewed', { feature: featureKey });
    onUpgradeClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--accent-lime)] rounded-sm w-full max-w-lg shadow-[0_0_30px_rgba(214,175,98,0.15)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[var(--accent-lime)] border border-[var(--accent-lime)]/40 font-mono text-[10px] font-semibold">
              PRO STUDIO FEATURE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-sm hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-sm bg-[#1C170E] border border-[var(--accent-lime)]/40 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(214,175,98,0.2)]">
              <Sparkles className="w-6 h-6 text-[var(--accent-lime)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Unlock {featureInfo.name}
            </h3>
            <p className="text-[var(--text-secondary)] text-xs max-w-sm mx-auto leading-relaxed">
              {featureInfo.description}
            </p>
          </div>

          {/* Value Highlights */}
          <div className="bg-[var(--bg-primary)] p-4 rounded-sm border border-[var(--border-subtle)] space-y-2.5">
            <div className="text-[var(--accent-lime)] font-semibold text-[11px] font-mono">
              MASTERINGLOCAL.PRO PRO INCLUDES:
            </div>
            <div className="space-y-1.5 text-[11px] text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--accent-lime)] shrink-0" />
                <span>24-bit PCM &amp; 32-bit Float High-Resolution WAV Export</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--accent-lime)] shrink-0" />
                <span>ITU-R BS.1770 LUFS Loudness Target Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--accent-lime)] shrink-0" />
                <span>Curated Pro Preset Library &amp; Custom Curve Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--accent-lime)] shrink-0" />
                <span>Unlimited monthly master renders with full commercial rights</span>
              </div>
            </div>
          </div>

          {/* Pricing mini-banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono">
            <span className="text-[var(--text-secondary)]">Studio Pass</span>
            <div className="text-right">
              <span className="font-semibold text-[var(--accent-lime)]">From €12.50 / mo</span>
              <span className="text-[9px] text-[var(--text-tertiary)] block">Billed annually or €14.99/mo</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2 pt-1 font-mono">
            <button
              id="upgrade-modal-cta"
              onClick={handleUpgrade}
              className="btn-primary w-full text-xs uppercase tracking-wider"
            >
              <span>UPGRADE TO PRO STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer text-[11px]"
            >
              Continue using Free Tier
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] flex items-center justify-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6FCF97]" />
          <span>Local DSP Invariant: Audio never leaves your device</span>
        </div>
      </div>
    </div>
  );
};
