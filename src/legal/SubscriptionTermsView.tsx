import React from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { CreditCard, Calendar, RefreshCw, XCircle, FileText } from 'lucide-react';

export interface SubscriptionTermsViewProps {
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToRefunds?: () => void;
}

export const SubscriptionTermsView: React.FC<SubscriptionTermsViewProps> = ({
  onNavigateToTerms,
  onNavigateToPrivacy,
  onNavigateToRefunds,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[#242830] pb-6">
        <div className="flex items-center gap-2.5 text-[#B7F000] mb-2">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Billing Policy</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F2F2EE]">Subscription & Recurring Billing Terms</h1>
        <p className="text-sm text-[#8E95A2] mt-1.5">
          Clear, transparent terms on pricing, renewals, cancellation, and invoices.
        </p>
      </div>

      {/* Pricing Table */}
      <section className="space-y-4 text-sm text-[#A0A6B2]">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">1. Subscription Plans and Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[#121418] border border-[#2A2E35] space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-[#F2F2EE]">MasteringPro Pro Monthly</span>
              <span className="text-xl font-bold text-[#B7F000]">€19<span className="text-xs text-[#8E95A2] font-normal"> / month</span></span>
            </div>
            <p className="text-xs text-[#8E95A2]">
              Billed monthly on the same calendar day of initial subscription. Unlimited 24-bit/32-bit float master exports and commercial license.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#121418] border border-[#B7F000]/30 space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-semibold text-[#F2F2EE]">MasteringPro Pro Annual</span>
                <span className="ml-2 text-[10px] uppercase font-bold bg-[#B7F000] text-[#0E1013] px-1.5 py-0.5 rounded">Best Value</span>
              </div>
              <span className="text-xl font-bold text-[#B7F000]">€169<span className="text-xs text-[#8E95A2] font-normal"> / year</span></span>
            </div>
            <p className="text-xs text-[#8E95A2]">
              Billed annually at €169.00/year (equivalent to €14.08/month, saving €59/year). Full commercial mastering license.
            </p>
          </div>
        </div>
      </section>

      {/* Automatic Renewal */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">2. Automatic Renewal and Invoicing</h2>
        <p>
          All Pro subscriptions renew automatically at the end of each billing cycle (monthly or yearly). Your payment method on file will be charged the agreed recurring fee unless you cancel before your next renewal date.
        </p>
        <p>
          Digital VAT-compliant invoices and payment receipts are generated automatically upon successful charge and accessible in your Account Dashboard or via Stripe Customer Portal.
        </p>
      </section>

      {/* Cancellation Flow */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">3. Cancellation and Access Expiration</h2>
        <p>
          You may cancel your subscription at any time with one click directly inside your account settings. Upon cancellation:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8E95A2] pl-2">
          <li>You will <strong>not</strong> be charged for future billing cycles.</li>
          <li>Your Pro access, unlimited exports, and advanced presets will remain active until the end of your prepaid period.</li>
          <li>All masters exported during your active Pro subscription remain 100% commercially licensed in perpetuity.</li>
        </ul>
      </section>

      {/* Payment Failures */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F2F2EE]">4. Failed Payments & Grace Period</h2>
        <p className="text-xs text-[#8E95A2]">
          If a recurring payment fails (e.g. expired card, insufficient funds), Stripe will attempt automated retries over a 7-day grace period. During this period, your account status is marked as <code>PAST_DUE</code>. If payment is not reconciled within the grace period, Pro privileges revert to Free tier limits.
        </p>
      </section>

      {/* Contact */}
      <section className="p-4 rounded-lg bg-[#14171D] border border-[#242830] text-xs text-[#8E95A2] space-y-1">
        <div className="font-semibold text-[#F2F2EE]">Billing Support</div>
        <div>Entity: {LEGAL_CONFIG.businessName}</div>
        <div>Direct Billing Inquiries: <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#B7F000] underline">{LEGAL_CONFIG.supportEmail}</a></div>
      </section>
    </div>
  );
};
