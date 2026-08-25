import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Lock, Loader2, Smartphone } from 'lucide-react';
import { BILLING_PLANS, PlanId } from '../billing/billing-config';
import { subscriptionService } from '../billing/subscription-service';
import { analytics } from '../billing/analytics';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: PlanId;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlanId = 'pro_monthly',
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    initialPlanId === 'free' ? 'pro_monthly' : initialPlanId
  );
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay' | 'carrier'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('Studio Mastering Producer');
  
  const [carrierNumber, setCarrierNumber] = useState('+1 (555) 019-2023');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderReceiptId, setOrderReceiptId] = useState<string | null>(null);

  if (!isOpen) return null;

  const plan = BILLING_PLANS[selectedPlan] || BILLING_PLANS.pro_monthly;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    analytics.track('checkout_started', { plan: selectedPlan, method: paymentMethod });

    try {
      const session = await subscriptionService.createCheckoutSession(selectedPlan);
      
      // If Stripe returned a live Stripe Checkout URL, redirect user to Stripe's hosted checkout page
      if (session.provider === 'stripe_live' && session.url && session.url.startsWith('https://')) {
        window.location.href = session.url;
        return;
      }

      if (session.error) {
        setErrorMsg(session.error);
        setIsLoading(false);
        return;
      }

      const sessionId = session.sessionId || 'cs_test_' + Math.random().toString(36).substring(2, 9);
      const updatedEntitlement = await subscriptionService.confirmSubscription(sessionId, selectedPlan);

      if (updatedEntitlement && updatedEntitlement.status === 'PRO') {
        setIsCompleted(true);
        setOrderReceiptId(`REC-${Date.now().toString().slice(-6)}`);
        setTimeout(() => {
          onSuccess();
        }, 1600);
      } else {
        setErrorMsg('Unable to verify server subscription entitlement. Please retry.');
      }
    } catch {
      setErrorMsg('Payment could not be completed. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A08]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E1013] border border-[#222420] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222420] bg-[#151714]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#151714] border border-[#222420] flex items-center justify-center text-[#B7F000]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wider uppercase font-mono">
                Secure Checkout
              </h3>
              <div className="text-[10px] font-mono text-[#A5A69F]">MasteringLocal.Pro Studio Pass</div>
            </div>
          </div>
          {!isCompleted && (
            <button
              onClick={onClose}
              className="text-[#A5A69F] hover:text-[#F2F2EE] p-1 rounded-sm hover:bg-[#151714] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {isCompleted ? (
            /* Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#1C170E] border border-[#B7F000] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(214,175,98,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-[#B7F000]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-[#F2F2EE]">
                  Pro Studio Membership Activated!
                </h4>
                <p className="text-[#A5A69F] text-xs font-mono">
                  Receipt ID: {orderReceiptId} · Entitlements Synchronized
                </p>
              </div>
              <div className="bg-[#090A08] p-3.5 rounded-sm border border-[#222420] text-[11px] font-mono text-[#A5A69F] space-y-1 text-left max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span>Active Plan:</span>
                  <span className="font-semibold text-[#B7F000]">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing Amount:</span>
                  <span className="text-[#F2F2EE]">€{plan.price} {plan.periodLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Quota:</span>
                  <span className="font-semibold text-[#6FCF97]">Unlimited (24/32-bit float)</span>
                </div>
              </div>
              <p className="text-[10px] text-[#686A63] font-mono">Redirecting to Studio Workspace...</p>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePay} className="space-y-4">
              {/* Plan Selection Switcher */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] uppercase text-[#A5A69F] tracking-wider block">Select Plan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedPlan('pro_monthly')}
                    className={`p-3 rounded-sm border cursor-pointer transition ${
                      selectedPlan === 'pro_monthly'
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE]'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:border-[#222420]'
                    }`}
                  >
                    <div className="font-semibold text-xs">Pro Monthly</div>
                    <div className="text-sm font-bold text-[#F2F2EE] mt-0.5">€19 <span className="text-[10px] font-normal text-[#A5A69F]">/ mo</span></div>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('pro_yearly')}
                    className={`p-3 rounded-sm border cursor-pointer transition relative ${
                      selectedPlan === 'pro_yearly'
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE]'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:border-[#222420]'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-[#B7F000] text-[#090A08] text-[8px] font-bold">
                      SAVE €59
                    </span>
                    <div className="font-semibold text-xs">Pro Annual</div>
                    <div className="text-sm font-bold text-[#F2F2EE] mt-0.5">€169 <span className="text-[10px] font-normal text-[#A5A69F]">/ yr</span></div>
                  </div>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div className="space-y-1.5 font-mono pt-1">
                <label className="text-[10px] uppercase text-[#A5A69F] tracking-wider block">Payment Method:</label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2 rounded-sm border flex items-center justify-center gap-2 cursor-pointer transition ${
                      paymentMethod === 'card'
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE]'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:border-[#222420]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Card</span>
                  </div>
                  <div
                    onClick={() => setPaymentMethod('gpay')}
                    className={`p-2 rounded-sm border flex items-center justify-center gap-2 cursor-pointer transition ${
                      paymentMethod === 'gpay'
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE]'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:border-[#222420]'
                    }`}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-3" />
                  </div>
                  <div
                    onClick={() => setPaymentMethod('carrier')}
                    className={`p-2 rounded-sm border flex items-center justify-center gap-2 cursor-pointer transition ${
                      paymentMethod === 'carrier'
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE]'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:border-[#222420]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Carrier</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[#090A08] p-3 rounded-sm border border-[#222420] space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-[#A5A69F]">
                  <span>Plan:</span>
                  <span className="font-semibold text-[#F2F2EE]">{plan.name}</span>
                </div>
                <div className="flex justify-between text-[#A5A69F]">
                  <span>Billing Interval:</span>
                  <span className="text-[#F2F2EE]">{selectedPlan === 'pro_yearly' ? 'Annual (Recurring)' : 'Monthly (Recurring)'}</span>
                </div>
                <hr className="border-[#222420]" />
                <div className="flex justify-between text-xs font-bold text-[#B7F000]">
                  <span>Total Due Today:</span>
                  <span>€{plan.price}.00</span>
                </div>
              </div>

              {/* Card Inputs */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1 font-mono">
                    <label className="text-[10px] uppercase text-[#A5A69F] block">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-[#090A08] border border-[#222420] rounded-sm px-3 py-2 text-xs text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                    />
                  </div>

                  <div className="space-y-1 font-mono">
                    <label className="text-[10px] uppercase text-[#A5A69F] flex items-center justify-between">
                      <span>Card Information</span>
                      <span className="text-[9px] text-[#686A63]">Stripe 256-bit SSL</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-[#090A08] border border-[#222420] rounded-sm pl-9 pr-3 py-2 text-xs text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                      />
                      <CreditCard className="w-4 h-4 text-[#A5A69F] absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#A5A69F] block">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#090A08] border border-[#222420] rounded-sm px-3 py-2 text-xs text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#A5A69F] block">CVC</label>
                      <input
                        type="text"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-[#090A08] border border-[#222420] rounded-sm px-3 py-2 text-xs text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'gpay' && (
                <div className="pt-2 text-center text-[#A5A69F] text-xs font-mono">
                  <p className="mb-2">Clicking checkout will open the Google Pay dialog to complete your purchase securely.</p>
                </div>
              )}

              {paymentMethod === 'carrier' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1 font-mono">
                    <label className="text-[10px] uppercase text-[#A5A69F] block">Mobile Phone Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={carrierNumber}
                        onChange={(e) => setCarrierNumber(e.target.value)}
                        className="w-full bg-[#090A08] border border-[#222420] rounded-sm pl-9 pr-3 py-2 text-xs text-[#F2F2EE] focus:border-[#B7F000] outline-none"
                      />
                      <Smartphone className="w-4 h-4 text-[#A5A69F] absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[9px] text-[#686A63] pt-1">The charge will be added to your mobile network bill.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-[#1C1012] border border-[#E56B6B]/40 rounded-sm text-[#E56B6B] flex items-center gap-2 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                id="submit-payment-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-sm font-semibold font-mono bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] shadow-md shadow-[#B7F000]/20 transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SYNCHRONIZING ENTITLEMENTS...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>SUBSCRIBE FOR €{plan.price}/{selectedPlan === 'pro_yearly' ? 'year' : 'month'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#686A63]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6FCF97]" />
                <span>Stripe Encrypted · Cancel Anytime · EU Statutory Rights</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
