import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, HelpCircle, Lock, ArrowRight } from 'lucide-react';
import { BILLING_PLANS, PlanId } from '../billing/billing-config';
import { analytics } from '../billing/analytics';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void;
  currentPlan: PlanId;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToRefunds?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan,
  onNavigateToTerms,
  onNavigateToPrivacy,
  onNavigateToRefunds,
}) => {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  if (!isOpen) return null;

  const handleSelect = (planId: PlanId) => {
    analytics.track('pricing_view', { selectedPlan: planId, billingCycle });
    onSelectPlan(planId);
  };

  const proMonthly = BILLING_PLANS.pro_monthly;
  const proAnnual = BILLING_PLANS.pro_yearly;
  const freePlan = BILLING_PLANS.free;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A08]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E1013] border border-[#222420] rounded-sm w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222420] bg-[#151714]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#151714] border border-[#222420] flex items-center justify-center text-[#B7F000]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wider uppercase font-mono">
                MasteringLocal Pro
              </h3>
              <p className="text-[11px] text-[#A5A69F]">
                Professional masters. 100% in your browser. No audio uploads. No server processing. Just your master.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5A69F] hover:text-[#F2F2EE] p-1.5 rounded-sm hover:bg-[#151714] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Main Hero Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-[#F2F2EE]">
              Professional masters. 100% in your browser.
            </h2>
            <p className="text-xs text-[#8E95A2] leading-relaxed">
              No audio uploads. No server processing. Just your master. Export studio-grade 24-bit PCM and 32-bit Float masters with zero latency.
            </p>
          </div>

          {/* Pricing Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Free Tier Card */}
            <div className="bg-[#090A08] rounded-sm border border-[#222420] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F2F2EE]">{freePlan.name}</span>
                  {currentPlan === 'free' && (
                    <span className="px-2 py-0.5 rounded bg-[#14171D] text-[#8E95A2] text-[10px] font-mono border border-[#222420]">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-[#F2F2EE] num-tabular">€0</span>
                  <span className="text-[#686A63] text-xs font-mono">/ forever</span>
                </div>
                <p className="text-[#A5A69F] text-[11px] leading-relaxed">
                  Start mastering for free. 5 standard 16-bit master exports / month.
                </p>
                <hr className="border-[#222420]" />

                <div className="space-y-2 text-[11px]">
                  {freePlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#A5A69F]">
                      <Check className="w-3.5 h-3.5 text-[#6FCF97] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={currentPlan === 'free'}
                onClick={() => handleSelect('free')}
                className="w-full py-2.5 rounded-sm text-center font-mono text-xs font-medium border border-[#222420] bg-[#151714] text-[#686A63] cursor-default"
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Select Free'}
              </button>
            </div>

            {/* Pro Monthly Card */}
            <div className="bg-[#0E1013] rounded-sm border border-[#2A2E35] p-5 flex flex-col justify-between space-y-4 hover:border-[#B7F000]/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F2F2EE]">{proMonthly.name}</span>
                  <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[#B7F000] text-[10px] font-mono border border-[#B7F000]/30">
                    MONTHLY
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-[#B7F000] num-tabular">€19</span>
                  <span className="text-[#A5A69F] text-xs font-mono">/ month</span>
                </div>
                <p className="text-[#A5A69F] text-[11px] leading-relaxed">
                  Release-ready mastering without limits. Unlimited high-res exports.
                </p>
                <hr className="border-[#222420]" />

                <div className="space-y-2 text-[11px]">
                  {proMonthly.features.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#F2F2EE]">
                      <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="select-pro-monthly-btn"
                onClick={() => handleSelect('pro_monthly')}
                className="w-full py-2.5 rounded-sm text-center font-mono text-xs font-semibold bg-[#1C2028] hover:bg-[#252B36] border border-[#3A4354] text-[#F2F2EE] transition cursor-pointer"
              >
                Subscribe for €19/month
              </button>
            </div>

            {/* Pro Annual Card (Featured) */}
            <div className="bg-[#0E1013] rounded-sm border-2 border-[#B7F000] p-5 flex flex-col justify-between space-y-4 shadow-[0_0_25px_rgba(214,175,98,0.15)] relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#B7F000] text-[#090A08] text-[10px] font-mono font-bold tracking-wider">
                BEST VALUE
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F2F2EE]">{proAnnual.name}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-[#B7F000] num-tabular">€169</span>
                    <span className="text-[#A5A69F] text-xs font-mono">/ year</span>
                  </div>
                  <div className="text-[10px] text-[#C7FF18] font-mono font-medium mt-0.5">
                    Equivalent to €14.08/month · Save €59/year
                  </div>
                </div>
                <p className="text-[#A5A69F] text-[11px] leading-relaxed">
                  Professional mastering for active artists and producers.
                </p>
                <hr className="border-[#222420]" />

                <div className="space-y-2 text-[11px]">
                  {proAnnual.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#F2F2EE]">
                      <Check className="w-3.5 h-3.5 text-[#B7F000] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="select-pro-annual-btn"
                onClick={() => handleSelect('pro_yearly')}
                className="w-full py-2.5 rounded-sm text-center font-mono text-xs font-semibold bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] shadow-md shadow-[#B7F000]/20 transition cursor-pointer"
              >
                Subscribe for €169/year
              </button>
            </div>
          </div>

          {/* Privacy & Guarantee Notice */}
          <div className="bg-[#090A08] p-4 rounded-sm border border-[#222420] flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#6FCF97] shrink-0" />
            <div className="space-y-0.5 text-[11px] text-[#A5A69F]">
              <strong className="text-[#F2F2EE]">Local Audio Privacy Guarantee:</strong>
              <p>
                Your audio is processed locally in your browser. Audio files are not uploaded to our servers for mastering.
              </p>
            </div>
          </div>

          {/* Transparent Disclosures & Legal Links */}
          <div className="text-[11px] text-[#686A63] border-t border-[#222420] pt-4 space-y-2 text-center">
            <div>
              Recurring billing · Cancel anytime with 1-click in account settings · Statutory 14-day EU rights apply.
            </div>
            <div className="flex items-center justify-center gap-4 text-[#8E95A2]">
              {onNavigateToTerms && (
                <button type="button" onClick={onNavigateToTerms} className="hover:text-[#B7F000] underline">
                  Terms of Service
                </button>
              )}
              {onNavigateToPrivacy && (
                <button type="button" onClick={onNavigateToPrivacy} className="hover:text-[#B7F000] underline">
                  Privacy Policy
                </button>
              )}
              {onNavigateToRefunds && (
                <button type="button" onClick={onNavigateToRefunds} className="hover:text-[#B7F000] underline">
                  Refund Policy
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
