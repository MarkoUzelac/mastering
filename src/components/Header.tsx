import React, { useState } from 'react';
import {
  Upload,
  ArrowUpRight,
  BookOpen,
  Volume2,
  VolumeX,
  Palette,
  Check,
  Cpu,
  RotateCcw,
  RotateCw,
  Settings,
  ChevronDown,
  Edit3,
  ArrowUp,
} from 'lucide-react';
import { UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { soundHaptics } from '../utils/sound-haptics';
import { themeSkinService, STUDIO_SKINS, StudioSkinId } from '../utils/theme-skin';

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
    <header className="border-b border-[#1E2530] bg-[#0A0C0F] px-4 lg:px-6 py-2.5 transition-colors font-sans select-none sticky top-0 z-40">
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
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]">
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
                <span className="text-sm font-bold tracking-tight text-[#F4F3EF]">
                  MasteringPro
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#8B5CF6] text-white">
                  PRO
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[#646A73] uppercase -mt-0.5">
                LOCAL
              </span>
            </div>
          </div>

          {/* Session Selector Pill Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F4F3EF] bg-[#14171B] hover:bg-[#1E232B] border border-[#24282D] rounded-lg transition cursor-pointer"
            >
              <span>Mastering Session</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#646A73]" />
            </button>

            {sessionDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-[#0E1116] border border-[#1E2530] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-mono text-[#646A73] uppercase tracking-wider">
                  Active Sessions
                </div>
                <button
                  onClick={() => setSessionDropdownOpen(false)}
                  className="w-full text-left p-2 rounded-lg bg-[#1C162E] text-[#F4F3EF] text-xs flex items-center justify-between font-medium"
                >
                  <span>Main Mastering Project</span>
                  <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />
                </button>
                <button
                  onClick={() => setSessionDropdownOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-[#14171B] text-[#9A9EA6] text-xs"
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
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1E232B] border border-[#24282D] rounded-lg transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8B5CF6]" />
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
          <div className="flex items-center gap-0.5 bg-[#14171B] border border-[#24282D] rounded-lg p-0.5">
            <button
              onClick={onUndo}
              className="p-1.5 text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#1E232B] rounded transition cursor-pointer"
              title="Undo Parameter Change (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              className="p-1.5 text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#1E232B] rounded transition cursor-pointer"
              title="Redo Parameter Change (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* E2E Audit Quick Button */}
          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1E232B] border border-[#24282D] rounded-lg transition cursor-pointer"
            title="E2E Runtime Audit Suite"
          >
            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden xl:inline text-[11px] font-mono">Audit</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => {
              if (onOpenSettingsModal) onOpenSettingsModal();
              else onOpenAccountModal('subscription');
            }}
            className="p-1.5 text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1E232B] border border-[#24282D] rounded-lg transition cursor-pointer"
            title="Studio Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Export Button (Violet Pill) */}
          <button
            onClick={() => {
              soundHaptics.playResetSound();
              onOpenExportModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#8B5CF6] transition shadow-[0_0_12px_rgba(139,92,246,0.35)] cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
