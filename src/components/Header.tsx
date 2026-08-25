import React, { useState } from 'react';
import {
  IconUpload as Upload,
  IconArrowUpRight as ArrowUpRight,
  IconBookOpen as BookOpen,
  IconVolume2 as Volume2,
  IconVolumeX as VolumeX,
  IconPalette as Palette,
  IconCheck as Check,
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
  onOpenAccountModal: (tab?: 'subscription' | 'billing' | 'usage' | 'exports' | 'privacy') => void;
  onOpenSettingsModal?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasAudio: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  hasAudio,
  entitlement,
  usage,
  onUploadClick,
}) => {
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const isPro = entitlement.status === 'PRO' || entitlement.status === 'TRIAL';

  return (
    <header className="border-b border-[#222420] bg-[#0A0C0F] px-4 lg:px-6 py-2.5 transition-colors font-sans select-none sticky top-0 z-40">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand / Logo + Session Selector + New Project */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Logo Brand */}
          <div
            onClick={() => {
              soundHaptics.playSliderTick(1600);
              onSelectTab('mastering');
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            {/* Purple stylized icon */}
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-[#B7F000] to-[#8CA800] flex items-center justify-center text-\[#F2F2EE\] shadow-[0_0_12px_rgba(139,92,246,0.35)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="12" x2="4" y2="12" />
                <line x1="8" y1="8" x2="8" y2="16" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="16" y1="7" x2="16" y2="17" />
                <line x1="20" y1="11" x2="20" y2="13" />
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[#F2F2EE]">
                  MasteringPro
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#B7F000] text-\[#F2F2EE\]">
                  PRO
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[#686A63] uppercase -mt-0.5">
                LOCAL
              </span>
            </div>
          </div>

          {/* Session Selector Pill Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F2F2EE] bg-[#151714] hover:bg-[#1E232B] border border-[#222420] rounded-sm transition cursor-pointer"
            >
              <span>Mastering Session</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#686A63]" />
            </button>

            {sessionDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-[#0D0E0C] border border-[#222420] rounded-sm shadow-2xl p-1.5 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-mono text-[#686A63] uppercase tracking-wider">
                  Active Sessions
                </div>
                <button
                  onClick={() => setSessionDropdownOpen(false)}
                  className="w-full text-left p-2 rounded-sm bg-[#1C162E] text-[#F2F2EE] text-xs flex items-center justify-between font-medium"
                >
                  <span>Main Mastering Project</span>
                  <Check className="w-3.5 h-3.5 text-[#B7F000]" />
                </button>
                <button
                  onClick={() => setSessionDropdownOpen(false)}
                  className="w-full text-left p-2 rounded-sm hover:bg-[#151714] text-[#A5A69F] text-xs"
                >
                  Stem Group A (Vocal + Beat)
                </button>
              </div>
            )}
          </div>

          {/* New Project Button */}
          <button
            onClick={() => {
              soundHaptics.playResetSound();
              if (onUploadClick) onUploadClick();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1E232B] border border-[#222420] rounded-sm transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#B7F000]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Right: Saved Status, Undo/Redo, Settings, Export Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Saved Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#10B981] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span className="hidden sm:inline text-[11px]">Saved</span>
          </div>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-0.5 bg-[#151714] border border-[#222420] rounded-sm p-0.5">
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                if (onUndo) onUndo();
              }}
              disabled={!canUndo}
              className="p-1.5 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-[#A5A69F] hover:text-[#F2F2EE] disabled:opacity-30 hover:bg-[#1E232B] rounded transition cursor-pointer active:scale-95"
              title="Undo Parameter Change (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                if (onRedo) onRedo();
              }}
              disabled={!canRedo}
              className="p-1.5 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-[#A5A69F] hover:text-[#F2F2EE] disabled:opacity-30 hover:bg-[#1E232B] rounded transition cursor-pointer active:scale-95"
              title="Redo Parameter Change (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* E2E Audit Quick Button */}
          <button
            onClick={() => {
              soundHaptics.playButtonTap();
              onOpenAuditModal();
            }}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] justify-center text-xs text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1E232B] border border-[#222420] rounded-sm transition cursor-pointer active:scale-95"
            title="E2E Runtime & DSP Audit Suite"
          >
            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden lg:inline text-[11px] font-mono">DSP / Audit</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => {
              soundHaptics.playButtonTap();
              if (onOpenSettingsModal) onOpenSettingsModal();
              else onOpenAccountModal('subscription');
            }}
            className="p-1.5 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1E232B] border border-[#222420] rounded-sm transition cursor-pointer active:scale-95"
            title="Studio Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile / Admin Menu */}
          <UserProfileMenu
            onOpenAdmin={() => onSelectTab('admin' as any)}
            onOpenBilling={() => onOpenAccountModal('subscription')}
          />

          {/* Export Button (Violet Pill) */}
          <button
            onClick={() => {
              soundHaptics.playButtonTap();
              onOpenExportModal();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-sm text-[#090A08] bg-[#B7F000] hover:bg-[#C7FF18] transition cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
