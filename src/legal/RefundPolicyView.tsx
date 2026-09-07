import React from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { RotateCcw, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export interface RefundPolicyViewProps {
  onNavigateToTerms?: () => void;
}

export const RefundPolicyView: React.FC<RefundPolicyViewProps> = ({ onNavigateToTerms: _onNavigateToTerms }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2.5 text-[var(--accent-lime)] mb-2">
          <RotateCcw className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Consumer Protection</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Refund & Cancellation Policy</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1.5">Compliant with EU Consumer Rights Directive (Directive 2011/83/EU) on digital services.</p>
      </div>
      <div className="p-5 rounded-sm bg-[#121418] border border-[#2A2E35] space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><CheckCircle className="w-4 h-4 text-[#6FCF97]" /><span>Understanding Cancellation vs. Refunds</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
          <div className="p-3 bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-subtle)]"><strong className="text-[var(--text-primary)]">Subscription Cancellation:</strong> Stop future automatic renewals at any time with one click. Access continues until the prepaid period ends.</div>
          <div className="p-3 bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-subtle)]"><strong className="text-[var(--text-primary)]">Refund Requests:</strong> Return of funds charged for a specific billing cycle under statutory rights or verified billing errors.</div>
        </div>
      </div>
      <section className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">1. Statutory EU Right of Withdrawal (14 Days)</h2>
        <p>Under European Union consumer protection rules, consumers residing in the EU generally have the right to withdraw from a distance contract within 14 days without giving any reason.</p>
        <div className="p-4 rounded-sm bg-[var(--bg-elevated)] border border-[#2E3540] text-xs text-[var(--text-tertiary)] space-y-2"><div className="font-semibold text-[var(--accent-lime)]">Digital Content Performance Exception (Directive 2011/83/EU Art. 16(m))</div><p>When you purchase a digital subscription and immediately utilize pro features, you acknowledge that performance of the digital service begins immediately and that statutory withdrawal rights may cease as permitted by applicable law.</p></div>
      </section>
      <section className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">2. Circumstances Eligible for Refunds</h2>
        <p>We review and grant refunds promptly under the following circumstances:</p>
        <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-tertiary)] pl-2"><li><strong>Billing Discrepancies & Duplicate Charges:</strong> If an error occurs resulting in duplicate billing on your account.</li><li><strong>Unused Annual Renewals:</strong> If an annual renewal occurs and you contact us within 48 hours without having performed any high-resolution Pro exports in the renewed period.</li><li><strong>Verified Platform Failure:</strong> In the rare event of persistent, unresolved technical server or billing verification outages preventing you from accessing features.</li></ul>
      </section>
      <section className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">3. How to Submit a Refund Request</h2>
        <p className="text-xs text-[var(--text-tertiary)]">To request a refund, please contact our support team at <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[var(--accent-lime)] underline">{LEGAL_CONFIG.supportEmail}</a> with your registered account email and Stripe receipt / invoice number. We process verified requests within 3–5 business days directly back to your original payment method.</p>
      </section>
      <div className="hidden"><AlertTriangle /><HelpCircle /></div>
    </div>
  );
};
