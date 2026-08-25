import React, { useState, useEffect } from 'react';
import {
  Download,
  ShieldCheck,
  User,
  Sparkles,
  Sliders,
  Menu,
  X,
  ArrowUpRight,
  BookOpen,
  Volume2,
  VolumeX,
  Vibrate,
  Palette,
  Check,
  Cpu,
} from 'lucide-react';
import { ProBadge } from './ProBadge';
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
  hasAudio,
  entitlement,
  usage,
  onUploadClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [skinDropdownOpen, setSkinDropdownOpen] = useState(false);
  const [currentSkin, setCurrentSkin] = useState<StudioSkinId>(themeSkinService.getActiveSkin());
  const [soundEnabled, setSoundEnabled] = useState(soundHaptics.isSoundEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState(soundHaptics.isHapticsEnabled());

  const isPro = entitlement.status === 'PRO' || entitlement.status === 'TRIAL';

  useEffect(() => {
    const handleSkinChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ skinId: StudioSkinId }>;
      if (customEvent.detail?.skinId) {
        setCurrentSkin(customEvent.detail.skinId);
      }
    };
    window.addEventListener('studio_skin_changed', handleSkinChange);
    return () => window.removeEventListener('studio_skin_changed', handleSkinChange);
  }, []);

  const handleSelectSkin = (skinId: StudioSkinId) => {
    themeSkinService.setSkin(skinId);
    setCurrentSkin(skinId);
    setSkinDropdownOpen(false);
    soundHaptics.playPresetSnap();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundHaptics.setSoundEnabled(next);
    setSoundEnabled(next);
    if (next) soundHaptics.playResetSound();
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    soundHaptics.setHapticsEnabled(next);
    setHapticsEnabled(next);
    if (next) soundHaptics.triggerHaptic('double');
  };

  return (
    <header className="border-b border-[#24282D] bg-[#08090B]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-7 py-2.5 transition-colors font-sans">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => {
              soundHaptics.playSliderTick(1600);
              onSelectTab('mastering');
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="h-7 w-7 rounded bg-[#14171B] border border-[#24282D] group-hover:border-[#D6AF62]/60 flex items-center justify-center text-[#D6AF62] font-mono font-bold text-xs transition-colors shadow-inner">
              M
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#F4F3EF] uppercase">
                MASTERINGLOCAL
              </span>
              <span className="text-[11px] font-mono font-bold text-[#D6AF62] tracking-wider">
                PRO
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('mastering');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                activeTab === 'mastering'
                  ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B]/50'
              }`}
            >
              Mastering Studio
            </button>
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('analysis');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                activeTab === 'analysis'
                  ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B]/50'
              }`}
            >
              Telemetry &amp; Phase
            </button>
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('presets');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B]/50'
              }`}
            >
              Profiles
            </button>
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('dashboard');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B]/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('learn');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'learn'
                  ? 'bg-[#14171B] text-[#D6AF62] border border-[#24282D]'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B]/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guides
            </button>
            <button
              onClick={() => {
                soundHaptics.playSliderTick(1400);
                onSelectTab('landing');
              }}
              className={`px-3 py-1.5 rounded transition font-medium cursor-pointer ${
                activeTab === 'landing'
                  ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]'
                  : 'text-[#646A73] hover:text-[#9A9EA6]'
              }`}
            >
              Overview
            </button>
          </nav>
        </div>

        {/* Right Section: Skins, Feedback, Audit & Account */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Studio Skin Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSkinDropdownOpen(!skinDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#0E1013] hover:bg-[#14171B] border border-[#24282D] rounded-lg transition cursor-pointer"
              title="Change Studio Console Skin"
            >
              <Palette className="w-3.5 h-3.5 text-[#D6AF62]" />
              <span className="hidden xl:inline text-[11px] font-mono capitalize">
                Skin: {themeSkinService.getSkinDefinition(currentSkin).name}
              </span>
            </button>

            {skinDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#0E1013] border border-[#24282D] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-mono text-[#646A73] uppercase tracking-wider">
                  Hardware Chassis Skins
                </div>
                {STUDIO_SKINS.map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => handleSelectSkin(skin.id)}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                      currentSkin === skin.id
                        ? 'bg-[#14171B] border border-[#24282D] text-[#F4F3EF]'
                        : 'hover:bg-[#14171B]/60 text-[#9A9EA6]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/40"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                        <span>{skin.name}</span>
                      </div>
                      <div className="text-[10px] text-[#646A73]">{skin.category}</div>
                    </div>
                    {currentSkin === skin.id && <Check className="w-4 h-4 text-[#D6AF62]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound Feedback Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 text-xs rounded-lg transition cursor-pointer border ${
              soundEnabled
                ? 'bg-[#14171B] text-[#D6AF62] border-[#24282D]'
                : 'bg-[#0E1013] text-[#646A73] border-[#1E2228] opacity-60'
            }`}
            title={soundEnabled ? 'UI Synthesizer Sounds: Enabled' : 'UI Synthesizer Sounds: Disabled'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Haptic Feedback Toggle */}
          <button
            onClick={handleToggleHaptics}
            className={`hidden sm:flex p-1.5 text-xs rounded-lg transition cursor-pointer border ${
              hapticsEnabled
                ? 'bg-[#14171B] text-[#D6AF62] border-[#24282D]'
                : 'bg-[#0E1013] text-[#646A73] border-[#1E2228] opacity-60'
            }`}
            title={hapticsEnabled ? 'Haptic Vibrations: Enabled' : 'Haptic Vibrations: Disabled'}
          >
            <Vibrate className="w-3.5 h-3.5" />
          </button>

          {/* E2E Website & Runtime Audit Suite */}
          <button
            onClick={() => {
              soundHaptics.playSwitchSound(true);
              onOpenAuditModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#0E1013] hover:bg-[#14171B] border border-[#24282D] hover:border-[#D6AF62]/40 rounded-lg transition cursor-pointer"
            title="E2E Runtime & Website Audit Test Suite"
          >
            <Cpu className="w-3.5 h-3.5 text-[#6FCF97]" />
            <span className="hidden sm:inline font-mono text-[11px]">Audit</span>
          </button>

          {/* Pro Status or Upgrade CTA */}
          {isPro ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C170E] border border-[#D6AF62]/40 text-[#E7C77F] font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6AF62] animate-pulse"></span>
              <span className="font-semibold">PRO</span>
            </div>
          ) : (
            <button
              onClick={() => {
                soundHaptics.playPresetSnap();
                onOpenPricingModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#1C170E] hover:bg-[#282114] text-[#E7C77F] border border-[#D6AF62]/40 hover:border-[#D6AF62] transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D6AF62]" />
              <span className="font-mono text-[11px] font-semibold">UPGRADE</span>
            </button>
          )}

          {/* User Account Trigger */}
          <button
            onClick={() => {
              soundHaptics.playSliderTick(1600);
              onOpenAccountModal('subscription');
            }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#14171B] border border-transparent hover:border-[#24282D] transition cursor-pointer"
            title="Account & Subscription Portal"
          >
            <div className="w-6 h-6 rounded-md bg-[#1E2228] border border-[#2F353C] flex items-center justify-center text-xs font-semibold text-[#F4F3EF]">
              U
            </div>
          </button>

          {/* Quick Export Master Header Button */}
          <button
            disabled={!hasAudio}
            onClick={() => {
              soundHaptics.playResetSound();
              onOpenExportModal();
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition shadow-sm ${
              hasAudio
                ? 'bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] font-semibold cursor-pointer'
                : 'bg-[#14171B] text-[#646A73] border border-[#24282D] cursor-not-allowed opacity-60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] border border-[#24282D]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-[#24282D] mt-2.5 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onSelectTab('mastering'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'mastering' ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]' : 'text-[#9A9EA6]'}`}
            >
              Studio
            </button>
            <button
              onClick={() => { onSelectTab('analysis'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'analysis' ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]' : 'text-[#9A9EA6]'}`}
            >
              Analysis
            </button>
            <button
              onClick={() => { onSelectTab('presets'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'presets' ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]' : 'text-[#9A9EA6]'}`}
            >
              Profiles
            </button>
            <button
              onClick={() => { onSelectTab('dashboard'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'dashboard' ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]' : 'text-[#9A9EA6]'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { onSelectTab('learn'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'learn' ? 'bg-[#14171B] text-[#D6AF62] border border-[#24282D]' : 'text-[#9A9EA6]'}`}
            >
              Guides
            </button>
            <button
              onClick={() => { onSelectTab('landing'); setMobileMenuOpen(false); }}
              className={`py-1.5 text-xs rounded text-center ${activeTab === 'landing' ? 'bg-[#14171B] text-[#F4F3EF] border border-[#24282D]' : 'text-[#646A73]'}`}
            >
              Overview
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#24282D]/60 text-xs">
            <button
              onClick={() => { onOpenAccountModal('subscription'); setMobileMenuOpen(false); }}
              className="text-[#9A9EA6] hover:text-[#F4F3EF] py-1"
            >
              Account &amp; Billing
            </button>
            <button
              onClick={() => { onOpenAuditModal(); setMobileMenuOpen(false); }}
              className="text-[#6FCF97] py-1 flex items-center gap-1 font-mono"
            >
              E2E Runtime Audit <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
