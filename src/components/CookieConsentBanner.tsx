import React, { useState, useEffect } from 'react';
import { cookieConsent, CookieConsentCategories } from '../legal/cookie-consent';
import { ShieldCheck, Settings, Check, X, Lock } from 'lucide-react';

export interface CookieConsentBannerProps {
  onOpenPolicy?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPolicy }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<CookieConsentCategories>(cookieConsent.getConsent());

  useEffect(() => {
    // Show banner if user hasn't made a choice yet
    if (!cookieConsent.hasConsented()) {
      setIsOpen(true);
    }

    // Global listener for "Cookie Settings" footer clicks
    const handleOpenSettings = () => {
      setCategories(cookieConsent.getConsent());
      setIsCustomizeOpen(true);
      setIsOpen(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('open-cookie-settings', handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    cookieConsent.acceptAll();
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleRejectNonEssential = () => {
    cookieConsent.rejectNonEssential();
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleSaveCustom = () => {
    cookieConsent.setConsent(categories);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 animate-fade-in"
    >
      <div className="bg-[#121418] border border-[#2A2E35] rounded-sm p-5 shadow-2xl backdrop-blur-md">
        {!isCustomizeOpen ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-sm bg-[#1B1F26] border border-[#2E3440] text-[#B7F000] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-tight">
                  Privacy & Cookie Preferences
                </h3>
                <p className="text-xs text-[#8E95A2] leading-relaxed">
                  We use essential cookies to maintain your session and local mastering entitlements. Optional analytics cookies help us optimize platform performance without collecting any audio data.
                </p>
                {onOpenPolicy && (
                  <button
                    type="button"
                    onClick={onOpenPolicy}
                    className="text-[11px] text-[#B7F000] hover:underline font-mono"
                  >
                    Read our full Cookie Policy &rarr;
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(true)}
                className="order-3 sm:order-1 px-3 py-2 text-xs font-medium text-[#A0A6B2] hover:text-[#F2F2EE] bg-transparent hover:bg-[#1B1F26] rounded-sm transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-[#2E3440]"
              >
                <Settings className="w-3.5 h-3.5" />
                Customize
              </button>
              
              <div className="order-1 sm:order-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#F2F2EE] bg-[#1E222A] hover:bg-[#262C36] border border-[#343B47] rounded-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject Non-Essential
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#0E1013] bg-[#B7F000] hover:bg-[#E5C37A] rounded-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept All
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#242830] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#B7F000]" />
                <h3 className="text-sm font-semibold text-[#F2F2EE]">
                  Granular Cookie Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="text-[#8E95A2] hover:text-[#F2F2EE] p-1"
                aria-label="Close customizer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-left text-xs">
              {/* Strictly Necessary */}
              <div className="p-3 bg-[#171A20] rounded-sm border border-[#242830] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#F2F2EE]">
                    <span>Strictly Necessary</span>
                    <Lock className="w-3 h-3 text-[#B7F000]" />
                  </div>
                  <p className="text-[11px] text-[#8E95A2] mt-0.5">
                    Required for core authentication, local DSP processing, and subscription validation. Cannot be disabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 rounded bg-[#2A2E35] border-transparent text-[#B7F000] cursor-not-allowed opacity-80"
                />
              </div>

              {/* Preferences */}
              <div className="p-3 bg-[#171A20] rounded-sm border border-[#242830] flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">User Preferences</div>
                  <p className="text-[11px] text-[#8E95A2] mt-0.5">
                    Persists your custom mastering presets, UI layout settings, and target LUFS options.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="consent-pref"
                  checked={categories.preferences}
                  onChange={(e) => setCategories({ ...categories, preferences: e.target.checked })}
                  className="mt-1 rounded bg-[#1B1F26] border-[#343B47] text-[#B7F000] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Analytics */}
              <div className="p-3 bg-[#171A20] rounded-sm border border-[#242830] flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">Anonymous Analytics</div>
                  <p className="text-[11px] text-[#8E95A2] mt-0.5">
                    Allows aggregate telemetry on mastering rendering times and conversion performance without logging audio buffers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="consent-analytics"
                  checked={categories.analytics}
                  onChange={(e) => setCategories({ ...categories, analytics: e.target.checked })}
                  className="mt-1 rounded bg-[#1B1F26] border-[#343B47] text-[#B7F000] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Marketing */}
              <div className="p-3 bg-[#171A20] rounded-sm border border-[#242830] flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">Marketing & Referrals</div>
                  <p className="text-[11px] text-[#8E95A2] mt-0.5">
                    Measures referral attribution for partner campaigns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="consent-marketing"
                  checked={categories.marketing}
                  onChange={(e) => setCategories({ ...categories, marketing: e.target.checked })}
                  className="mt-1 rounded bg-[#1B1F26] border-[#343B47] text-[#B7F000] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 text-xs text-[#A0A6B2] hover:text-[#F2F2EE] bg-[#1B1F26] hover:bg-[#242A34] rounded-sm transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-1.5 text-xs font-semibold text-[#0E1013] bg-[#B7F000] hover:bg-[#E5C37A] rounded-sm transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
