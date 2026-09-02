import React, { useEffect, useState } from 'react';
import {
  IconCpu as Cpu,
  IconUndo as RotateCcw,
  IconRedo as RotateCw,
  IconSettings as Settings,
} from './Icons';
import { UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { soundHaptics } from '../utils/sound-haptics';
import { UserProfileMenu } from './UserProfileMenu';
import { audioEngine } from '../utils/audio-engine';
import { StudioAiReleaseModal } from './StudioAiReleaseModal';
import { toStructuredAudioSnapshot } from '../audio/analyze-audio';
import type { StructuredAudioSnapshot } from '../ai/contracts';

export type ActiveTab = 'mastering' | 'analysis' | 'presets' | 'dashboard' | 'landing' | 'learn';

interface HeaderProps {
  activeTab: ActiveTab | string;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenParityModal: () => void;
  onOpenAuditModal: () => void;
  onOpenExportModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAccountModal: (tab: 'subscription' | 'billing' | 'usage') => void;
  onOpenSettingsModal: () => void;
  onOpenAdmin: () => void;
  onOpenBilling: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasAudio: boolean;
  isPlaying: boolean;
  entitlement: UserEntitlement;
  usage: UserUsage;
  onUploadClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenExportModal,
  onOpenAccountModal,
  onOpenSettingsModal,
  onOpenAdmin,
  onOpenBilling,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasAudio,
  isPlaying,
  usage,
}) => {
  const [aiModal, setAiModal] = useState<'assistant' | 'release' | null>(null);
  const [audioSnapshot, setAudioSnapshot] = useState<StructuredAudioSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!hasAudio) {
      setAudioSnapshot(null);
      return;
    }
    const buffer = audioEngine.getLoadedBuffer();
    if (!buffer) {
      setAudioSnapshot(null);
      return;
    }
    try {
      const measured = toStructuredAudioSnapshot(buffer);
      if (!cancelled) setAudioSnapshot(measured);
    } catch (error) {
      console.error('[Telemetry] Failed to analyze loaded buffer', error);
      if (!cancelled) setAudioSnapshot(null);
    }
    return () => { cancelled = true; };
  }, [hasAudio]);

  const navigate = (tab: ActiveTab) => {
    soundHaptics.playButtonTap();
    onSelectTab(tab);
  };

  return (
    <>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 sm:px-6 py-3 transition-colors font-sans select-none sticky top-0 z-40">
        <div className="w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 xl:gap-7 min-w-0">
            <div onClick={() => navigate('landing')} className="flex items-center gap-3 cursor-pointer group select-none shrink-0">
              <div className="flex items-end justify-center gap-[2px] text-[var(--accent-lime)] h-6 w-6">
                <div className="w-[3px] h-4 bg-current" />
                <div className="w-[3px] h-6 bg-current" />
                <div className="w-[3px] h-3 bg-current" />
              </div>
              <div className="hidden sm:flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">MasteringLocal</span>
                <span className="text-lg font-light text-[var(--accent-lime)]">Studio AI</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
              {[
                ['landing', 'STUDIO'],
                ['analysis', 'ANALYZE'],
                ['mastering', 'MASTER'],
                ['dashboard', 'PROJECTS'],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => navigate(tab as ActiveTab)}
                  className={`px-3 py-2 rounded-sm text-[10px] font-mono tracking-[0.15em] transition ${
                    activeTab === tab
                      ? 'text-[var(--accent-lime)] bg-[var(--accent-lime)]/8'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setAiModal('release')}
                className="px-3 py-2 rounded-sm text-[10px] font-mono tracking-[0.15em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
              >
                RELEASE
              </button>
              <button
                onClick={() => onOpenAccountModal('subscription')}
                className="px-3 py-2 rounded-sm text-[10px] font-mono tracking-[0.15em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
              >
                ACCOUNT
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isPlaying && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#D4FF5C]/10 border border-[#D4FF5C]/30 rounded-full animate-pulse-slow">
                <div className="flex items-center gap-0.5 h-3">
                  <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_0ms]" />
                  <div className="w-[2px] h-2/3 bg-[#D4FF5C] animate-[bounce_1s_infinite_200ms]" />
                  <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_400ms]" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4FF5C] uppercase">PLAYING</span>
              </div>
            )}

            <button
              onClick={() => setAiModal('assistant')}
              className="hidden sm:flex items-center gap-2 border border-[var(--accent-lime)]/30 text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 px-3 py-2 rounded-sm transition text-[10px] font-mono tracking-widest"
            >
              <Cpu className="w-3.5 h-3.5" />
              AI ENGINEER
            </button>

            <div className="hidden md:flex items-center gap-1">
              <button onClick={onUndo} disabled={!canUndo} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30" title="Undo"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={onRedo} disabled={!canRedo} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30" title="Redo"><RotateCw className="w-4 h-4" /></button>
            </div>

            <button
              onClick={onOpenExportModal}
              className="hidden md:block border border-[var(--border-subtle)] text-[10px] font-mono tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-3 py-2 rounded-sm transition"
            >
              EXPORTS <span className="text-[var(--text-secondary)]">{usage.exportsUsed}</span>
            </button>

            <button onClick={onOpenSettingsModal} className="hidden md:block p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Settings">
              <Settings className="w-4 h-4" />
            </button>

            <UserProfileMenu onOpenAdmin={onOpenAdmin} onOpenBilling={onOpenBilling} />
          </div>
        </div>
      </header>

      {aiModal && (
        <StudioAiReleaseModal mode={aiModal} onClose={() => setAiModal(null)} audioSnapshot={audioSnapshot} />
      )}
    </>
  );
};
