import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { logOut } from '../lib/firebase';
import { LogOut, LayoutDashboard, Crown, CreditCard } from 'lucide-react';

interface UserProfileMenuProps {
  onOpenAdmin: () => void;
  onOpenBilling: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenAdmin, onOpenBilling }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] animate-pulse" aria-label="Loading account" />;
  }

  if (!user || !profile) return null;

  const displayName = profile.displayName || 'Mastering Engineer';
  const email = profile.email || 'Anonymous session';

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--accent-lime)] flex items-center justify-center text-[var(--text-primary)] font-bold text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">{email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] bg-[var(--border-subtle)] px-2 py-0.5 rounded">
                  Free / Pro via Stripe
                </span>
              </div>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => { setIsOpen(false); onOpenBilling(); }}
                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Subscription &amp; Billing
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); onOpenAdmin(); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 flex items-center gap-2 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Control Panel
                </button>
              )}

              <div className="h-px bg-[var(--border-subtle)] my-1" />

              <button
                type="button"
                onClick={() => { setIsOpen(false); void logOut(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Reset Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
