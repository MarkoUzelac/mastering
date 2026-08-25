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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090B]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E1013] border border-[#24282D] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24282D] bg-[#14171B]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F3EF] tracking-wider uppercase font-mono">
                MasteringLocal Pro
              </h3>
              <p className="text-[11px] text-[#9A9EA6]">
                Professional masters. 100% in your browser. No audio uploads. No server processing. Just your master.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9A9EA6] hover:text-[#F4F3EF] p-1.5 rounded-lg hover:bg-[#14171B] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Main Hero Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-[#F4F3EF]">
              Professional masters. 100% in your browser.
            </h2>
            <p className="text-xs text-[#8E95A2] leading-relaxed">
              No audio uploads. No server processing. Just your master. Export studio-grade 24-bit PCM and 32-bit Float masters with zero latency.
            </p>
          </div>

          {/* Pricing Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Free Tier Card */}
            <div className="bg-[#08090B] rounded-xl border border-[#1E2228] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F3EF]">{freePlan.name}</span>
                  {currentPlan === 'free' && (
                    <span className="px-2 py-0.5 rounded bg-[#14171D] text-[#8E95A2] text-[10px] font-mono border border-[#24282D]">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">€0</span>
                  <span className="text-[#646A73] text-xs font-mono">/ forever</span>
                </div>
                <p className="text-[#9A9EA6] text-[11px] leading-relaxed">
                  Start mastering for free. 5 standard 16-bit master exports / month.
                </p>
                <hr className="border-[#1E2228]" />

                <div className="space-y-2 text-[11px]">
                  {freePlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#9A9EA6]">
                      <Check className="w-3.5 h-3.5 text-[#6FCF97] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={currentPlan === 'free'}
                onClick={() => handleSelect('free')}
                className="w-full py-2.5 rounded-lg text-center font-mono text-xs font-medium border border-[#24282D] bg-[#14171B] text-[#646A73] cursor-default"
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Select Free'}
              </button>
            </div>

            {/* Pro Monthly Card */}
            <div className="bg-[#0E1013] rounded-xl border border-[#2A2E35] p-5 flex flex-col justify-between space-y-4 hover:border-[#D6AF62]/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F3EF]">{proMonthly.name}</span>
                  <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[#D6AF62] text-[10px] font-mono border border-[#D6AF62]/30">
                    MONTHLY
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-[#D6AF62] num-tabular">€19</span>
                  <span className="text-[#9A9EA6] text-xs font-mono">/ month</span>
                </div>
                <p className="text-[#9A9EA6] text-[11px] leading-relaxed">
                  Release-ready mastering without limits. Unlimited high-res exports.
                </p>
                <hr className="border-[#24282D]" />

                <div className="space-y-2 text-[11px]">
                  {proMonthly.features.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#F4F3EF]">
                      <Check className="w-3.5 h-3.5 text-[#D6AF62] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="select-pro-monthly-btn"
                onClick={() => handleSelect('pro_monthly')}
                className="w-full py-2.5 rounded-lg text-center font-mono text-xs font-semibold bg-[#1C2028] hover:bg-[#252B36] border border-[#3A4354] text-[#F4F3EF] transition cursor-pointer"
              >
                Subscribe for €19/month
              </button>
            </div>

            {/* Pro Annual Card (Featured) */}
            <div className="bg-[#0E1013] rounded-xl border-2 border-[#D6AF62] p-5 flex flex-col justify-between space-y-4 shadow-[0_0_25px_rgba(214,175,98,0.15)] relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#D6AF62] text-[#08090B] text-[10px] font-mono font-bold tracking-wider">
                BEST VALUE
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F3EF]">{proAnnual.name}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-[#D6AF62] num-tabular">€169</span>
                    <span className="text-[#9A9EA6] text-xs font-mono">/ year</span>
                  </div>
                  <div className="text-[10px] text-[#E7C77F] font-mono font-medium mt-0.5">
                    Equivalent to €14.08/month · Save €59/year
                  </div>
                </div>
                <p className="text-[#9A9EA6] text-[11px] leading-relaxed">
                  Professional mastering for active artists and producers.
                </p>
                <hr className="border-[#24282D]" />

                <div className="space-y-2 text-[11px]">
                  {proAnnual.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#F4F3EF]">
                      <Check className="w-3.5 h-3.5 text-[#D6AF62] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id="select-pro-annual-btn"
                onClick={() => handleSelect('pro_yearly')}
                className="w-full py-2.5 rounded-lg text-center font-mono text-xs font-semibold bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] shadow-md shadow-[#D6AF62]/20 transition cursor-pointer"
              >
                Subscribe for €169/year
              </button>
            </div>
          </div>

          {/* Privacy & Guarantee Notice */}
          <div className="bg-[#08090B] p-4 rounded-xl border border-[#1E2228] flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#6FCF97] shrink-0" />
            <div className="space-y-0.5 text-[11px] text-[#9A9EA6]">
              <strong className="text-[#F4F3EF]">Local Audio Privacy Guarantee:</strong>
              <p>
                Your audio is processed locally in your browser. Audio files are not uploaded to our servers for mastering.
              </p>
            </div>
          </div>

          {/* Transparent Disclosures & Legal Links */}
          <div className="text-[11px] text-[#646A73] border-t border-[#1E2228] pt-4 space-y-2 text-center">
            <div>
              Recurring billing · Cancel anytime with 1-click in account settings · Statutory 14-day EU rights apply.
            </div>
            <div className="flex items-center justify-center gap-4 text-[#8E95A2]">
              {onNavigateToTerms && (
                <button type="button" onClick={onNavigateToTerms} className="hover:text-[#D6AF62] underline">
                  Terms of Service
                </button>
              )}
              {onNavigateToPrivacy && (
                <button type="button" onClick={onNavigateToPrivacy} className="hover:text-[#D6AF62] underline">
                  Privacy Policy
                </button>
              )}
              {onNavigateToRefunds && (
                <button type="button" onClick={onNavigateToRefunds} className="hover:text-[#D6AF62] underline">
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
