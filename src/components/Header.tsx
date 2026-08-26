import React, { useState } from 'react';
import {
  IconCpu as Cpu,
  IconUndo as RotateCcw,
  IconRedo as RotateCw,
  IconSettings as Settings,
  IconChevronDown as ChevronDown,
  IconEdit as Edit3,
  IconArrowUp as ArrowUp,
} from './Icons';
import { UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { soundHaptics } from '../utils/sound-haptics';
import { themeSkinService, STUDIO_SKINS, StudioSkinId } from '../utils/theme-skin';
import { UserProfileMenu } from './UserProfileMenu';

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
  onOpenParityModal,
  onOpenAuditModal,
  onOpenExportModal,
  onOpenPricingModal,
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
  entitlement,
  usage,
  onUploadClick,
}) => {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-6 py-4 transition-colors font-sans select-none sticky top-0 z-40">
      <div className="w-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => {
              soundHaptics.playSliderTick(1600);
              onSelectTab('mastering');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {/* Minimalist Logo */}
            <div className="flex items-center justify-center gap-[2px] text-[var(--accent-lime)] h-6 w-6">
              <div className="w-[3px] h-4 bg-current" />
              <div className="w-[3px] h-6 bg-current" />
              <div className="w-[3px] h-3 bg-current" />
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                MasteringPro
              </span>
              <span className="text-xl font-light text-[var(--accent-lime)]">
                Local
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status and Navigation */}
        <div className="flex items-center gap-8">
          {isPlaying ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#D4FF5C]/10 border border-[#D4FF5C]/30 rounded-full animate-pulse-slow">
              <div className="flex items-center gap-0.5 h-3">
                <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_0ms]" />
                <div className="w-[2px] h-2/3 bg-[#D4FF5C] animate-[bounce_1s_infinite_200ms]" />
                <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_400ms]" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4FF5C] uppercase">PLAYING</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] shadow-[0_0_8px_var(--accent-lime)]" />
              <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">PROCESSING LOCAL</span>
            </div>
          )}

          <button
            onClick={() => onSelectTab('landing')}
            className="hidden md:block text-[11px] font-mono tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            ABOUT
          </button>
          
          <button
            onClick={onOpenSettingsModal}
            className="hidden md:block text-[11px] font-mono tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            SETTINGS
          </button>

          <button
            onClick={() => {
              soundHaptics.playButtonTap();
              onOpenExportModal();
            }}
            className="border border-[var(--border-subtle)] text-[11px] font-mono tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] px-4 py-2 rounded-xs transition"
          >
            EXPORTS <span className="text-[var(--text-secondary)]">0</span>
          </button>

          <div className="border-l border-[var(--border-subtle)] pl-8 ml-2">
            <UserProfileMenu onOpenAdmin={onOpenAdmin} onOpenBilling={onOpenBilling} />
          </div>
        </div>
      </div>
    </header>
  );
};
