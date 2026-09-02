import React from 'react';
import { X, Check, Shield, Sparkles } from 'lucide-react';
import { PlanId } from '../billing/billing-config';

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
  onNavigateToTerms,
  onNavigateToPrivacy,
  onNavigateToRefunds,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 p-3 backdrop-blur-md sm:p-4">
      <div className="premium-surface flex max-h-[92vh] w-full min-w-0 max-w-3xl flex-col overflow-hidden">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]"><Sparkles className="h-4 w-4" /></div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">Studio pristup</h3>
              <p className="truncate text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Sve funkcije uključene</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori" className="btn-icon shrink-0"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-w-0 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl">
            <h2 className="break-anywhere text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">Premium iskustvo bez paywalla</h2>
            <p className="mt-2 break-anywhere text-sm leading-relaxed text-[var(--text-secondary)]">
              MasteringLocal Studio sada koristi jedinstveni plan. Napredni DSP, preseti, analiza i podržani export formati dostupni su bez nadoplata i bez zaključavanja funkcija.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              '24-bit PCM i 32-bit Float WAV export',
              'Proširena biblioteka mastering profila',
              'Loudness, true-peak i stereo analiza',
              'A/B snapshot i povijest rada',
              'Responsive studio kontrole za mobitel, tablet i desktop',
              'Touch + pointer + tipkovnica za precizne kontrole',
            ].map((item) => (
              <div key={item} className="flex min-w-0 items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3.5 text-xs text-[var(--text-primary)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-lime)]" />
                <span className="break-anywhere leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex min-w-0 items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--accent-lime-soft)] p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-lime)]" />
            <div className="min-w-0">
              <strong className="block text-xs text-[var(--text-primary)]">Local audio workflow</strong>
              <p className="mt-1 break-anywhere text-[11px] leading-relaxed text-[var(--text-secondary)]">Audio obrada i master render ostaju u pregledniku; sučelje samo upravlja stvarnim lokalnim DSP lancem.</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 text-center text-[10px] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-center sm:gap-5">
            {onNavigateToTerms && <button type="button" onClick={onNavigateToTerms} className="hover:text-[var(--text-primary)] underline">Uvjeti korištenja</button>}
            {onNavigateToPrivacy && <button type="button" onClick={onNavigateToPrivacy} className="hover:text-[var(--text-primary)] underline">Privatnost</button>}
            {onNavigateToRefunds && <button type="button" onClick={onNavigateToRefunds} className="hover:text-[var(--text-primary)] underline">Povrati</button>}
          </div>
        </div>
      </div>
    </div>
  );
};
