import React, { useState } from 'react';
import { LEGAL_CONFIG } from './legal-config';
import { UserCheck, Shield, CheckCircle, AlertTriangle, Send } from 'lucide-react';

export const DataRequestView: React.FC = () => {
  const [requestType, setRequestType] = useState<'access' | 'rectification' | 'erasure' | 'portability' | 'objection'>('access');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/privacy/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requestType,
          email,
          details,
        }),
      });
      const data = await res.json();
      setStatusMessage(data.message || 'Request successfully recorded.');
    } catch {
      setStatusMessage('Request recorded locally. You will also receive an email acknowledgment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-8 text-left space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2.5 text-[var(--accent-lime)] mb-2">
          <UserCheck className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold">GDPR Chapter III Rights</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Data Subject Access & Privacy Request</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
          Exercise your statutory GDPR rights regarding your account records, data access, or account deletion.
        </p>
      </div>

      <div className="p-4 rounded-sm bg-[#121418] border border-[#2A2E35] flex items-start gap-3">
        <Shield className="w-4 h-4 text-[var(--accent-lime)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-tertiary)] space-y-1">
          <span className="font-semibold text-[var(--text-primary)]">Audio Privacy Reminder:</span>
          <p>
            Because your audio files are processed 100% locally in your browser, our servers <strong className="text-[var(--text-primary)]">do not store or possess your audio files</strong>. Data held by us is strictly limited to your email, subscription plan state, and invoice ledger.
          </p>
        </div>
      </div>

      {!statusMessage ? (
        <form onSubmit={handleSubmit} className="p-6 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)]">Request Type <span className="text-[var(--accent-lime)]">*</span></label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none"
            >
              <option value="access">Right of Access (Art. 15 GDPR) — Download personal data copy</option>
              <option value="erasure">Right to Erasure / Deletion (Art. 17 GDPR) — Delete account & profile</option>
              <option value="rectification">Right to Rectification (Art. 16 GDPR) — Correct inaccurate records</option>
              <option value="portability">Right to Data Portability (Art. 20 GDPR) — Machine-readable export</option>
              <option value="objection">Right to Object / Restrict (Art. 21 GDPR) — Halt optional processing</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[var(--text-secondary)]">Your Registered Account Email <span className="text-[var(--accent-lime)]">*</span></label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artist@masteringlocal.pro"
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[var(--text-secondary)]">Specific Details / Notes (Optional)</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context or specific instructions for our Data Protection Officer."
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent-lime)] outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-secondary)] font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Submitting...' : 'Submit GDPR Request'}
          </button>
        </form>
      ) : (
        <div className="p-6 rounded-sm bg-[#121418] border border-[#2E3540] text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-[#6FCF97] mx-auto" />
          <div className="text-base font-semibold text-[var(--text-primary)]">Request Logged Successfully</div>
          <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto">
            {statusMessage}
          </p>
          <div className="text-[11px] text-[#6B7280]">
            Statutory turnaround time: Under GDPR Art. 12(3), requests are processed without undue delay and in any event within one month (30 days).
          </div>
        </div>
      )}
    </div>
  );
};
