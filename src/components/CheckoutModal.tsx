import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Lock, Loader2, Smartphone } from 'lucide-react';
import { BILLING_PLANS, PlanId } from '../billing/billing-config';
import { subscriptionService } from '../billing/subscription-service';
import { analytics } from '../billing/analytics';

interface CheckoutModalProps { isOpen: boolean; onClose: () => void; initialPlanId?: PlanId; onSuccess: () => void; }

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, initialPlanId = 'pro_monthly', onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlanId === 'free' ? 'pro_monthly' : initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay' | 'carrier'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderReceiptId, setOrderReceiptId] = useState<string | null>(null);
  if (!isOpen) return null;
  const plan = BILLING_PLANS[selectedPlan] || BILLING_PLANS.pro_monthly;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setErrorMsg(null);
    analytics.track('checkout_started', { plan: selectedPlan, method: paymentMethod });
    try {
      const session = await subscriptionService.createCheckoutSession(selectedPlan);
      if (session.error) { setErrorMsg(session.error); return; }
      if (!session.url || session.provider !== 'stripe_live') { setErrorMsg('Secure Stripe Checkout is not available. Production payments never use simulated checkout.'); return; }
      window.location.href = session.url;
    } catch { setErrorMsg('Payment could not be initialized. Please retry.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)]"><CreditCard className="w-4 h-4" /></div><div><h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wider uppercase font-mono">Secure Checkout</h3><div className="text-[10px] font-mono text-[var(--text-secondary)]">MasteringLocal.Pro Studio Pass</div></div></div>
          {!isCompleted && <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-sm hover:bg-[var(--bg-elevated)] transition cursor-pointer"><X className="w-4 h-4" /></button>}
        </div>
        <div className="p-6 space-y-5 text-xs">
          {isCompleted ? <div className="text-center py-6 space-y-4"><div className="w-14 h-14 rounded-full bg-[#1C170E] border border-[var(--accent-lime)] flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-[var(--accent-lime)]" /></div><h4 className="text-lg font-bold text-[var(--text-primary)]">Pro Studio Membership Activated!</h4><p className="text-[var(--text-secondary)] text-xs font-mono">Receipt ID: {orderReceiptId} · Entitlements verified by Stripe webhook</p></div> :
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-1.5 font-mono"><label className="text-[10px] uppercase text-[var(--text-secondary)] tracking-wider block">Select Plan:</label><div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSelectedPlan('pro_monthly')} className={`p-3 rounded-sm border text-left transition ${selectedPlan === 'pro_monthly' ? 'bg-[#1C170E] border-[var(--accent-lime)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)]'}`}><div className="font-semibold text-xs">Pro Monthly</div><div className="text-sm font-bold mt-0.5">€19 <span className="text-[10px] font-normal">/ mo</span></div></button>
              <button type="button" onClick={() => setSelectedPlan('pro_yearly')} className={`p-3 rounded-sm border text-left transition ${selectedPlan === 'pro_yearly' ? 'bg-[#1C170E] border-[var(--accent-lime)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)]'}`}><div className="font-semibold text-xs">Pro Annual</div><div className="text-sm font-bold mt-0.5">€169 <span className="text-[10px] font-normal">/ yr</span></div></button>
            </div></div>
            <div className="space-y-1.5 font-mono"><label className="text-[10px] uppercase text-[var(--text-secondary)] tracking-wider block">Payment Method</label><div className="grid grid-cols-3 gap-2">
              {(['card', 'gpay', 'carrier'] as const).map((method) => <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`p-2 rounded-sm border flex items-center justify-center gap-2 cursor-pointer transition ${paymentMethod === method ? 'bg-[#1C170E] border-[var(--accent-lime)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)]'}`}>{method === 'card' ? <CreditCard className="w-4 h-4" /> : method === 'gpay' ? <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-3" /> : <Smartphone className="w-4 h-4" />}<span className="text-[10px] font-bold">{method === 'gpay' ? 'Google Pay' : method === 'carrier' ? 'Carrier' : 'Card'}</span></button>)}
            </div></div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-sm border border-[var(--border-subtle)] space-y-2 text-[11px] font-mono"><div className="flex justify-between"><span>Plan</span><span className="font-semibold">{plan.name}</span></div><div className="flex justify-between"><span>Amount</span><span>€{plan.price} {plan.periodLabel}</span></div><div className="flex items-center gap-2 pt-2 text-[var(--text-secondary)]"><ShieldCheck className="w-4 h-4" /> Payment is processed on Stripe's hosted checkout. No card data is stored by MasteringLocal.Pro.</div></div>
            {errorMsg && <div className="flex gap-2 p-3 border border-red-500/30 bg-red-500/5 text-red-300 rounded-sm"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-[var(--accent-lime)] text-[var(--bg-primary)] px-4 py-3 rounded-sm font-bold disabled:opacity-50">{isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening secure checkout…</> : <><Lock className="w-4 h-4" /> Continue to Stripe</>}</button>
            <p className="text-[10px] text-[var(--text-tertiary)] text-center">Your PRO entitlement is activated only after Stripe sends a verified webhook to the server.</p>
          </form>}
        </div>
      </div>
    </div>
  );
};
