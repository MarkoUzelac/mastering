import React from 'react';
import { X, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { FeatureKey } from '../billing/billing-config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey?: FeatureKey;
  onUpgradeClick: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 p-3 backdrop-blur-md sm:p-4">
      <div className="premium-surface w-full min-w-0 max-w-lg overflow-hidden">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]"><Sparkles className="h-4 w-4" /></div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">Sve funkcije su dostupne</h3>
              <p className="truncate text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Studio Edition</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori" className="btn-icon shrink-0"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-4 sm:p-5">
          <p className="break-anywhere text-sm leading-relaxed text-[var(--text-secondary)]">
            Nema zaključanih mastering funkcija ni plaćenog plana. Napredni DSP, analiza, preseti i svi podržani WAV formati dio su istog studijskog iskustva.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              '24-bit PCM i 32-bit Float WAV',
              'Napredni mastering profili',
              'Loudness i true-peak analiza',
              'A/B povijest i verzije',
            ].map((item) => (
              <div key={item} className="flex min-w-0 items-start gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-xs text-[var(--text-primary)]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-lime)]" />
                <span className="break-anywhere">{item}</span>
              </div>
            ))}
          </div>

          <button type="button" onClick={onClose} className="btn-primary w-full text-xs uppercase tracking-wider">
            NASTAVI U STUDIO
          </button>
        </div>

        <footer className="flex items-center justify-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-[10px] font-mono text-[var(--text-tertiary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#6FCF97]" />
          <span>Audio DSP ostaje lokalno u pregledniku.</span>
        </footer>
      </div>
    </div>
  );
};
