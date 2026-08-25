import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Check,
  Zap,
  Settings2,
  Disc3,
  Layers,
  Flame,
  Sliders,
  Filter,
} from 'lucide-react';
import { MasteringPreset } from '../types';
import { ProBadge } from './ProBadge';
import { FeatureGates } from '../billing/feature-gates';
import { PRESET_CATEGORIES, PresetCategory } from '../utils/presets';

interface MasterActionFooterProps {
  presets: MasteringPreset[];
  activePresetId: string;
  onSelectPreset: (preset: MasteringPreset) => void;
  onMasterTrack?: () => void;
  onExportClick?: () => void;
  onResetParams?: () => void;
  isProcessing?: boolean;
  isBypassed: boolean;
  onToggleBypass?: () => void;
  onOpenParityModal?: () => void;
  onOpenUpgradeModal?: (feature: string) => void;
}

export const MasterActionFooter: React.FC<MasterActionFooterProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onMasterTrack,
  onExportClick,
  onResetParams,
  isProcessing = false,
  isBypassed,
  onToggleBypass,
  onOpenParityModal,
  onOpenUpgradeModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFooterCategory, setSelectedFooterCategory] = useState<PresetCategory>('All');
  const [masteredRecently, setMasteredRecently] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleMasterClick = () => {
    if (onMasterTrack) {
      onMasterTrack();
    } else if (onExportClick) {
      onExportClick();
    }
    setMasteredRecently(true);
    setTimeout(() => setMasteredRecently(false), 3000);
  };

  const handlePresetSelect = (preset: MasteringPreset) => {
    const isProPreset = preset.proOnly || preset.isPro;
    if (isProPreset && !FeatureGates.isProUser()) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal(preset.name);
      }
      return;
    }
    onSelectPreset(preset);
    setDropdownOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mastering':
        return <Disc3 className="w-3 h-3 text-[#D6AF62]" />;
      case 'Mixing':
        return <Layers className="w-3 h-3 text-[#38BDF8]" />;
      case 'Saturation':
        return <Flame className="w-3 h-3 text-[#F59E0B]" />;
      default:
        return <Sliders className="w-3 h-3 text-[#9A9EA6]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Mastering':
        return 'text-[#D6AF62] bg-[#D6AF62]/10 border-[#D6AF62]/20';
      case 'Mixing':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
      case 'Saturation':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default:
        return 'text-[#9A9EA6] bg-[#14171B] border-[#24282D]';
    }
  };

  const filteredPresets = selectedFooterCategory === 'All'
    ? presets
    : presets.filter((p) => p.category === selectedFooterCategory);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 bg-[#0E1013] border border-[#24282D] rounded-xl shadow-lg relative">
      {/* Left: Mastering Profile Selector with Categorization */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[#9A9EA6] uppercase whitespace-nowrap hidden md:inline">
          DSP PROFILE
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            id="footer-preset-selector-btn"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] hover:border-[#3A4048] rounded-lg text-xs text-[#F4F3EF] font-medium transition cursor-pointer"
          >
            {activePreset && getCategoryIcon(activePreset.category)}
            <span className="max-w-[150px] sm:max-w-[200px] truncate">
              {activePreset ? activePreset.name : 'Neutral / Transparent'}
            </span>
            {activePreset && (
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider hidden sm:inline ${getCategoryBadgeClass(
                  activePreset.category
                )}`}
              >
                {activePreset.category}
              </span>
            )}
            {(activePreset?.proOnly || activePreset?.isPro) && <ProBadge size="xs" />}
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9EA6] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Categorized Preset Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#14171B] border border-[#24282D] rounded-xl shadow-2xl z-40 overflow-hidden">
              {/* Category Filter Tabs Header */}
              <div className="bg-[#0A0C0E] border-b border-[#24282D] p-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono text-[#D6AF62] uppercase tracking-wider flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5" /> Filter by Target Role
                  </span>
                  <span className="text-[10px] font-mono text-[#646A73]">
                    {filteredPresets.length} curves
                  </span>
                </div>

                {/* Filter Tab Pills */}
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_CATEGORIES.map((cat) => {
                    const isTabActive = selectedFooterCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFooterCategory(cat.id);
                        }}
                        className={`px-2 py-1 text-[10px] font-mono rounded transition-colors cursor-pointer text-center truncate ${
                          isTabActive
                            ? 'bg-[#D6AF62] text-[#08090B] font-bold shadow-sm'
                            : 'bg-[#14171B] text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#1E2228]'
                        }`}
                      >
                        {cat.id === 'All' ? 'All' : cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets List */}
              <div className="p-1.5 max-h-72 overflow-y-auto space-y-1">
                {filteredPresets.map((preset) => {
                  const isProPreset = preset.proOnly || preset.isPro;
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#1C170E] text-[#D6AF62] font-semibold border-[#D6AF62]/40'
                          : 'text-[#F4F3EF] hover:bg-[#1B1F24] border-transparent hover:border-[#24282D]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(preset.category)}
                          <span className="truncate">{preset.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase tracking-wider ${getCategoryBadgeClass(
                              preset.category
                            )}`}
                          >
                            {preset.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#9A9EA6] font-normal truncate mt-0.5 pl-4.5">
                          {preset.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {preset.targetLufs && (
                          <span className="text-[10px] font-mono text-[#9A9EA6]">
                            {preset.targetLufs} LUFS
                          </span>
                        )}
                        {isProPreset && <ProBadge size="xs" locked={!FeatureGates.isProUser()} />}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#D6AF62]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Hero MASTER THIS TRACK Button */}
      <div className="w-full sm:w-auto flex justify-center">
        <button
          id="hero-master-render-btn"
          onClick={handleMasterClick}
          disabled={isProcessing}
          className={`w-full sm:w-auto px-8 py-2.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide font-mono transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
            isProcessing
              ? 'bg-[#1C170E] text-[#D6AF62] border border-[#D6AF62]/40 animate-pulse'
              : masteredRecently
              ? 'bg-[#6FCF97] text-[#08090B]'
              : 'bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] hover:shadow-[0_0_20px_rgba(214,175,98,0.3)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-[#D6AF62]" />
              <span>PROCESSING DSP...</span>
            </>
          ) : masteredRecently ? (
            <>
              <Check className="w-4 h-4" />
              <span>EXPORT READY ✓</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current" />
              <span>RENDER &amp; EXPORT MASTER</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Quick A/B Switch and Settings */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* A/B Quick Toggle Buttons */}
        {onToggleBypass && (
          <div className="flex items-center p-0.5 bg-[#14171B] border border-[#24282D] rounded-lg">
            <button
              id="ab-bypass-btn-a"
              onClick={() => {
                if (!isBypassed) onToggleBypass();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                isBypassed
                  ? 'bg-[#24282D] text-[#F4F3EF] font-bold'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
              }`}
              title="Listen to Dry Original (A)"
            >
              A
            </button>
            <button
              id="ab-bypass-btn-b"
              onClick={() => {
                if (isBypassed) onToggleBypass();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                !isBypassed
                  ? 'bg-[#D6AF62] text-[#08090B] font-bold'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
              }`}
              title="Listen to Mastered Audio (B)"
            >
              B
            </button>
          </div>
        )}

        {/* Diagnostics & Parity Shortcut */}
        {onOpenParityModal && (
          <button
            id="footer-parity-shortcut-btn"
            onClick={onOpenParityModal}
            className="p-2 text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] rounded-lg transition cursor-pointer"
            title="Open DSP Parity Verification & Diagnostic Suite"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
