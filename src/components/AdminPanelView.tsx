import React from 'react';
import { ArrowLeft, Shield, Users, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AdminPanelView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { loading, isAdmin } = useAuth();

  if (loading) return <div className="flex-1 p-8 text-[var(--accent-lime-hover)]">Učitavanje administratorskog pristupa…</div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <Shield className="mb-4 h-14 w-14 text-[var(--accent-lime)]" />
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Administracija je zaključana</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">Admin statistika više nije vezana uz klijentsku bazu. Administratorski backend može se spojiti zasebno bez izlaganja baze u javnom UI-ju.</p>
        <button onClick={onBack} className="btn-secondary mt-6 inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Natrag u studio</button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="premium-surface mx-auto w-full max-w-5xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-lime)]"><Settings className="h-3.5 w-3.5" /> Admin</div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Admin Control Panel</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Administracija je odvojena od javnog mastering sučelja.</p>
          </div>
          <button onClick={onBack} className="btn-icon" aria-label="Natrag"><ArrowLeft className="h-5 w-5" /></button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5"><Users className="h-5 w-5 text-[var(--accent-lime)]" /><h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Korisnički podaci</h2><p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">Bez direktnog pristupa Firestoreu iz preglednika.</p></div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5"><Settings className="h-5 w-5 text-[var(--accent-lime)]" /><h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Production controls</h2><p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">Sigurne postavke treba držati iza server-side administratorskog API-ja.</p></div>
        </div>
      </div>
    </div>
  );
};
