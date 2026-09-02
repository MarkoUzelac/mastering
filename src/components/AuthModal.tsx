import React from 'react';
import { X, Check, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#121418] border border-[var(--border-subtle)] max-w-md w-full rounded-sm shadow-2xl overflow-hidden relative">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-sm transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-[var(--accent-lime)]/10 rounded-full flex items-center justify-center border border-[var(--accent-lime)]/30">
            <ShieldCheck className="w-8 h-8 text-[var(--accent-lime)]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-serif text-[var(--text-primary)] tracking-tight">Secure Studio Session</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              No social login is required. MasteringLocal.Pro creates a secure anonymous session automatically so Stripe checkout and server-side entitlements can work without a Google account.
            </p>
          </div>

          <div className="space-y-2 text-left bg-[var(--bg-secondary)] p-4 rounded-sm border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>No Google sign-in or third-party social account is required.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>Stripe is the payment processor; card details stay on Stripe Checkout.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>Paid access is granted only after verified Stripe webhook processing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
