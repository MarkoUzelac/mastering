import React from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { ShieldCheck, Lock, FileText, UserCheck } from 'lucide-react';

export interface PrivacyPolicyViewProps {
  onNavigateToTerms?: () => void;
  onNavigateToCookies?: () => void;
  onNavigateToDataRequest?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({
  onNavigateToTerms,
  onNavigateToCookies,
  onNavigateToDataRequest,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[#242830] pb-6">
        <div className="flex items-center gap-2.5 text-[#D6AF62] mb-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">Data Protection Notice</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F4F3EF]">Privacy Policy</h1>
        <p className="text-sm text-[#8E95A2] mt-1.5">
          Effective Date: August 2026 · Compliant with EU General Data Protection Regulation (GDPR) Regulation (EU) 2016/679
        </p>
      </div>

      {/* Core Local Audio Privacy Callout */}
      <div className="p-5 rounded-xl bg-[#121418] border border-[#2E3540] space-y-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#6FCF97]">
          <Lock className="w-4 h-4 text-[#6FCF97]" />
          <span>Local Audio Processing Guarantee</span>
        </div>
        <p className="text-xs text-[#E1E4EA] leading-relaxed">
          <strong>Your audio files are processed locally in your browser and are not uploaded to our servers for mastering.</strong> All sample decoding, EQ filtering, compression, limiting, and high-resolution WAV rendering execute entirely client-side using Web Audio and WebAssembly. We do not store, listen to, stream, copy, or retain your raw or mastered musical compositions.
        </p>
      </div>

      {/* 1. Data Controller Identity */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">1. Data Controller Information</h2>
        <p>The controller responsible for the processing of personal data on this website is:</p>
        <div className="p-4 rounded-lg bg-[#0E1013] border border-[#242830] text-xs text-[#8E95A2] space-y-1 font-mono">
          <div><strong className="text-[#F4F3EF]">Business Entity:</strong> {LEGAL_CONFIG.businessName}</div>
          <div><strong className="text-[#F4F3EF]">Trading Name:</strong> {LEGAL_CONFIG.tradingName}</div>
          <div><strong className="text-[#F4F3EF]">Registered Address:</strong> {LEGAL_CONFIG.registeredAddress}</div>
          <div><strong className="text-[#F4F3EF]">Registration / VAT ID:</strong> {LEGAL_CONFIG.vatId}</div>
          <div><strong className="text-[#F4F3EF]">Contact Email:</strong> <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#D6AF62]">{LEGAL_CONFIG.supportEmail}</a></div>
          <div><strong className="text-[#F4F3EF]">Privacy Officer Contact:</strong> <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className="text-[#D6AF62]">{LEGAL_CONFIG.privacyEmail}</a></div>
        </div>
      </section>

      {/* 2. Categories of Personal Data Collected */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">2. What Personal Data We Collect and Process</h2>
        <p>While your audio never reaches our servers, we process minimal operational data strictly necessary for providing billing and account features:</p>
        <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8E95A2] pl-2">
          <li><strong>Account & Identity Data:</strong> Email address, customer ID, account creation date.</li>
          <li><strong>Billing & Subscription Data:</strong> Payment status, Stripe customer ID, subscription plan ID, billing interval, and anonymized payment method metadata (e.g. card brand and last 4 digits). Complete credit card details are handled directly by Stripe and never touch our servers.</li>
          <li><strong>Usage & Quota Metadata:</strong> Count of monthly master exports and timestamp logs to enforce fair use limits on Free tiers and ensure SLA delivery on Pro tiers.</li>
          <li><strong>Technical Web Logs:</strong> Anonymized server access logs (IP address, browser user-agent, request timestamp) for security monitoring and DDoS mitigation.</li>
        </ul>
      </section>

      {/* 3. Legal Bases for Processing */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">3. Legal Bases for Processing (GDPR Art. 6)</h2>
        <ul className="space-y-2 text-xs text-[#8E95A2]">
          <li className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Performance of a Contract (Art. 6(1)(b) GDPR):</strong> Processing necessary to fulfill your subscription, provide high-resolution master export downloads, and manage billing accounts.
          </li>
          <li className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Legal Obligations (Art. 6(1)(c) GDPR):</strong> Compliance with statutory tax, commercial accounting, and anti-fraud regulations regarding invoice generation and VAT reporting.
          </li>
          <li className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Legitimate Interests (Art. 6(1)(f) GDPR):</strong> Maintaining server infrastructure security, preventing abuse, and verifying technical integrity.
          </li>
          <li className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Consent (Art. 6(1)(a) GDPR):</strong> Storing optional preferences or anonymous usage analytics when explicitly opted in via our Cookie Consent manager.
          </li>
        </ul>
      </section>

      {/* 4. Subprocessors and Third Parties */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">4. Third-Party Processors & Subprocessors</h2>
        <div className="p-4 rounded-lg bg-[#0E1013] border border-[#242830] space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-[#F4F3EF]">
            <span>Stripe Payments Europe, Ltd.</span>
            <span className="text-[#D6AF62] text-[11px]">Payment Gateway</span>
          </div>
          <p className="text-[#8E95A2]">
            Processes credit card payments, recurring subscriptions, and statutory tax invoices under PCI-DSS Level 1 certification. Stripe adheres to Standard Contractual Clauses (SCCs) for international data transfers.
          </p>
        </div>
      </section>

      {/* 5. Data Subject Rights */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">5. Your Statutory Rights Under GDPR</h2>
        <p>Under Chapter III of the GDPR, you have the following enforceable rights regarding your personal data:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Right of Access (Art. 15):</strong> Request a copy of all personal data held about you.
          </div>
          <div className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Right to Rectification (Art. 16):</strong> Correct inaccurate or incomplete personal records.
          </div>
          <div className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Right to Erasure / Deletion (Art. 17):</strong> Request deletion of your account and personal records.
          </div>
          <div className="p-3 rounded-lg bg-[#0E1013] border border-[#242830]">
            <strong className="text-[#F4F3EF]">Right to Data Portability (Art. 20):</strong> Receive your export records and account profile in a machine-readable format.
          </div>
        </div>

        {onNavigateToDataRequest && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToDataRequest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D6AF62] text-[#0E1013] text-xs font-semibold hover:bg-[#E5C37A] transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Submit a GDPR Data Subject Request
            </button>
          </div>
        )}
      </section>

      {/* 6. Supervisory Authority */}
      <section className="space-y-3 text-sm text-[#A0A6B2] leading-relaxed">
        <h2 className="text-lg font-semibold text-[#F4F3EF]">6. Right to Lodge a Complaint</h2>
        <p className="text-xs text-[#8E95A2]">
          You have the right to lodge a complaint with a competent Data Protection Supervisory Authority (e.g. the Croatian Personal Data Protection Agency — AZOP, or your local EU Member State supervisory authority) if you consider that the processing of personal data relating to you infringes the GDPR.
        </p>
      </section>
    </div>
  );
};
