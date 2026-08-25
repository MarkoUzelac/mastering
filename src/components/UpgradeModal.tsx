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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A08]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E1013] border border-[#B7F000] rounded-sm w-full max-w-lg shadow-[0_0_30px_rgba(214,175,98,0.15)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222420] bg-[#151714]/50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[#B7F000] border border-[#B7F000]/40 font-mono text-[10px] font-semibold">
              PRO STUDIO FEATURE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5A69F] hover:text-[#F2F2EE] p-1 rounded-sm hover:bg-[#151714] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-sm bg-[#1C170E] border border-[#B7F000]/40 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(214,175,98,0.2)]">
              <Sparkles className="w-6 h-6 text-[#B7F000]" />
            </div>
            <h3 className="text-lg font-bold text-[#F2F2EE]">
              Unlock {featureInfo.name}
            </h3>
            <p className="text-[#A5A69F] text-xs max-w-sm mx-auto leading-relaxed">
              {featureInfo.description}
            </p>
          </div>

          {/* Value Highlights */}
          <div className="bg-[#090A08] p-4 rounded-sm border border-[#222420] space-y-2.5">
            <div className="text-[#B7F000] font-semibold text-[11px] font-mono">
              MASTERINGLOCAL.PRO PRO INCLUDES:
            </div>
            <div className="space-y-1.5 text-[11px] text-[#F2F2EE]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0" />
                <span>24-bit PCM &amp; 32-bit Float High-Resolution WAV Export</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0" />
                <span>ITU-R BS.1770 LUFS Loudness Target Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0" />
                <span>Curated Pro Preset Library &amp; Custom Curve Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0" />
                <span>Unlimited monthly master renders with full commercial rights</span>
              </div>
            </div>
          </div>

          {/* Pricing mini-banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-[#151714] border border-[#222420] text-[11px] font-mono">
            <span className="text-[#A5A69F]">Studio Pass</span>
            <div className="text-right">
              <span className="font-semibold text-[#B7F000]">From €12.50 / mo</span>
              <span className="text-[9px] text-[#686A63] block">Billed annually or €14.99/mo</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2 pt-1 font-mono">
            <button
              id="upgrade-modal-cta"
              onClick={handleUpgrade}
              className="w-full py-3 rounded-sm font-semibold bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] shadow-md shadow-[#B7F000]/20 transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <span>UPGRADE TO PRO STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-[#A5A69F] hover:text-[#F2F2EE] transition cursor-pointer text-[11px]"
            >
              Continue using Free Tier
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#090A08] border-t border-[#222420] flex items-center justify-center gap-2 text-[10px] text-[#686A63] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6FCF97]" />
          <span>Local DSP Invariant: Audio never leaves your device</span>
        </div>
      </div>
    </div>
  );
};
