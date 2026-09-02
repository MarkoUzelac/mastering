import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, FileAudio, ShieldCheck, Trash2, User, X } from 'lucide-react';
import { entitlementService, UserAccount, UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { UsageMeter } from './UsageMeter';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  initialTab?: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy';
  onNavigateToDataRequest?: () => void;
}

type AccountTab = NonNullable<AccountModalProps['initialTab']>;

const TABS: Array<{ id: AccountTab; label: string; icon: React.ReactNode }> = [
  { id: 'subscription', label: 'Studio', icon: <User className="h-3.5 w-3.5" /> },
  { id: 'billing', label: 'Račun', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { id: 'usage', label: 'Korištenje', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'exports', label: 'Izvozi', icon: <FileAudio className="h-3.5 w-3.5" /> },
  { id: 'privacy', label: 'Privatnost', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick: _onUpgradeClick,
  initialTab = 'subscription',
  onNavigateToDataRequest,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [entitlement, setEntitlement] = useState<UserEntitlement>(entitlementService.getEntitlement());
  const [usage, setUsage] = useState<UserUsage>(entitlementService.getUsage());
  const [user, setUser] = useState<UserAccount>(entitlementService.getUser());
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setEntitlement(entitlementService.getEntitlement());
    setUsage(entitlementService.getUsage());
    setUser(entitlementService.getUser());
    setActionMessage(null);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const unsubscribe = entitlementService.subscribe((nextEntitlement, nextUsage) => {
      setEntitlement(nextEntitlement);
      setUsage(nextUsage);
      setUser(entitlementService.getUser());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') return;
    setIsDeleting(true);
    setActionMessage(null);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Delete request failed.');
      }
      localStorage.clear();
      setActionMessage({ type: 'success', text: data.message || 'Zahtjev za brisanje računa je zaprimljen.' });
      window.setTimeout(() => window.location.reload(), 1800);
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Brisanje računa nije uspjelo.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmationInput('');
    }
  };

  const renderedExports = Math.max(0, usage.exportsUsed);
  const featureCount = entitlement.features.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 p-3 backdrop-blur-md sm:p-4">
      <div className="premium-surface flex max-h-[92vh] w-full min-w-0 max-w-3xl flex-col overflow-hidden">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">Studio račun</h3>
              <p className="truncate text-[10px] font-mono text-[var(--text-tertiary)]">{user.email || 'Lokalna sesija'} · Studio Edition</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori račun" className="btn-icon shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <nav className="safe-width flex min-w-0 gap-1 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1.5 scrollbar-none" aria-label="Postavke računa">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-md border px-3 text-[10px] font-mono font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 ${
                activeTab === tab.id
                  ? 'border-[var(--accent-lime)]/40 bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {actionMessage && (
            <div className={`mb-4 flex min-w-0 items-start gap-2 rounded-lg border p-3 text-xs ${actionMessage.type === 'success' ? 'border-[var(--accent-lime)]/40 bg-[var(--accent-lime-soft)] text-[var(--text-primary)]' : 'border-[#E56B6B]/40 bg-[#1C1012] text-[#E56B6B]'}`}>
              {actionMessage.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-lime)]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="break-anywhere">{actionMessage.text}</span>
            </div>
          )}

          {activeTab === 'subscription' && (
            <section className="grid min-w-0 gap-4 md:grid-cols-[1.15fr_.85fr]">
              <div className="premium-surface min-w-0 p-4 sm:p-5">
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Studio status</span>
                <h4 className="mt-1 break-anywhere text-xl font-semibold tracking-tight text-[var(--text-primary)]">Sve mastering funkcije su dostupne.</h4>
                <p className="mt-2 break-anywhere text-sm leading-relaxed text-[var(--text-secondary)]">
                  Jedno sučelje, bez zaključanih modula, bez paywall prekida i bez promjene radnog toka između osnovnih i naprednih kontrola.
                </p>
                <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Profili</span>
                    <span className="mt-1 block text-lg font-semibold tabular-nums text-[var(--text-primary)]">{featureCount}</span>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Izvozi</span>
                    <span className="mt-1 block text-lg font-semibold tabular-nums text-[var(--text-primary)]">{renderedExports}</span>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 col-span-2 sm:col-span-1">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Pristup</span>
                    <span className="mt-1 block text-sm font-semibold text-[var(--accent-lime)]">FULL STUDIO</span>
                  </div>
                </div>
              </div>

              <div className="premium-surface min-w-0 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-[var(--accent-lime)]"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em]">Lokalna obrada</span></div>
                <p className="break-anywhere text-xs leading-relaxed text-[var(--text-secondary)]">
                  Audio DSP i render odvijaju se u pregledniku. Račun služi za korisničke postavke, privatnost i sinkronizaciju gdje je to stvarno potrebno.
                </p>
                <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[10px] font-mono text-[var(--text-tertiary)]">
                  Status: <span className="text-[var(--accent-lime)]">READY</span>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'billing' && (
            <section className="premium-surface p-4 sm:p-5">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Račun</span>
              <h4 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Identitet i sesija</h4>
              <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3"><span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">E-mail</span><span className="mt-1 block break-anywhere text-xs text-[var(--text-primary)]">{user.email || 'Nije postavljen'}</span></div>
                <div className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3"><span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Stanje</span><span className="mt-1 block text-xs text-[var(--accent-lime)]">AKTIVNO</span></div>
              </div>
              <p className="mt-4 break-anywhere text-xs leading-relaxed text-[var(--text-secondary)]">Plaćeni planovi i prodajni elementi nisu dio ovog sučelja.</p>
            </section>
          )}

          {activeTab === 'usage' && (
            <section className="min-w-0 space-y-4">
              <UsageMeter usage={usage} isPro={false} compact={false} />
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="premium-surface min-w-0 p-4"><span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Renderi u ovoj sesiji</span><span className="mt-1 block text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{renderedExports}</span></div>
                <div className="premium-surface min-w-0 p-4"><span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Ograničenje</span><span className="mt-1 block text-lg font-semibold text-[var(--accent-lime)]">BEZ LIMITA</span></div>
              </div>
            </section>
          )}

          {activeTab === 'exports' && (
            <section className="premium-surface p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[var(--accent-lime)]"><FileAudio className="h-4 w-4" /><span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em]">Izvoz</span></div>
              <h4 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Lokalni master render</h4>
              <p className="mt-2 break-anywhere text-xs leading-relaxed text-[var(--text-secondary)]">Izvoz se pokreće iz studija i generira datoteku u pregledniku. Ovdje prikazujemo samo stvarno zabilježene lokalne render aktivnosti.</p>
              <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Ukupno zabilježeno</span>
                <span className="shrink-0 text-xl font-semibold tabular-nums text-[var(--text-primary)]">{renderedExports}</span>
              </div>
            </section>
          )}

          {activeTab === 'privacy' && (
            <section className="min-w-0 space-y-4">
              <div className="premium-surface p-4 sm:p-5">
                <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-lime)]" /><div className="min-w-0"><h4 className="text-sm font-semibold text-[var(--text-primary)]">Privatnost i podaci</h4><p className="mt-1 break-anywhere text-xs leading-relaxed text-[var(--text-secondary)]">Audio datoteke ostaju u lokalnom audio radnom toku. Za podatkovne zahtjeve koristi službeni GDPR obrazac.</p>{onNavigateToDataRequest && <button type="button" onClick={onNavigateToDataRequest} className="btn-secondary mt-4 w-full text-xs sm:w-auto">Otvori zahtjev za podacima</button>}</div></div>
              </div>

              <div className="premium-surface border-[#E56B6B]/20 p-4 sm:p-5">
                <div className="flex items-start gap-3"><Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-[#E56B6B]" /><div className="min-w-0"><h4 className="text-sm font-semibold text-[var(--text-primary)]">Brisanje računa</h4><p className="mt-1 break-anywhere text-xs leading-relaxed text-[var(--text-secondary)]">Ova radnja je nepovratna za lokalnu sesiju i šalje stvarni zahtjev backendu.</p>{!showDeleteConfirm ? <button type="button" onClick={() => setShowDeleteConfirm(true)} className="mt-4 min-h-[44px] rounded-md border border-[#E56B6B]/30 bg-transparent px-4 py-2 text-xs font-mono font-semibold text-[#E56B6B] hover:bg-[#E56B6B]/10">OBRIŠI RAČUN</button> : <div className="mt-4 min-w-0 rounded-lg border border-[#E56B6B]/30 bg-[#1C1012] p-3"><label htmlFor="delete-account-confirm" className="block text-[10px] font-mono uppercase tracking-wider text-[#E56B6B]">Upiši DELETE za potvrdu</label><input id="delete-account-confirm" value={deleteConfirmationInput} onChange={(event) => setDeleteConfirmationInput(event.target.value)} autoComplete="off" className="mt-2 min-h-[44px] w-full min-w-0 rounded-md border border-[#E56B6B]/30 bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-primary)] focus:border-[#E56B6B] focus:outline-none" /><div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row"><button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmationInput(''); }} className="btn-secondary w-full text-xs sm:w-auto">Odustani</button><button type="button" onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmationInput !== 'DELETE'} className="w-full min-h-[44px] rounded-md border border-[#E56B6B]/40 bg-[#E56B6B]/10 px-4 py-2 text-xs font-mono font-semibold text-[#E56B6B] disabled:opacity-40 sm:w-auto">{isDeleting ? 'BRISANJE…' : 'POTVRDI BRISANJE'}</button></div></div>}</div></div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
