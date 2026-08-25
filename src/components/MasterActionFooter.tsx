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
        return <Disc3 className="w-3 h-3 text-[#B7F000]" />;
      case 'Mixing':
        return <Layers className="w-3 h-3 text-[#38BDF8]" />;
      case 'Saturation':
        return <Flame className="w-3 h-3 text-[#F59E0B]" />;
      default:
        return <Sliders className="w-3 h-3 text-[#A5A69F]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Mastering':
        return 'text-[#B7F000] bg-[#B7F000]/10 border-[#B7F000]/20';
      case 'Mixing':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
      case 'Saturation':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default:
        return 'text-[#A5A69F] bg-[#151714] border-[#222420]';
    }
  };

  const filteredPresets = selectedFooterCategory === 'All'
    ? presets
    : presets.filter((p) => p.category === selectedFooterCategory);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 bg-[#0E1013] border border-[#222420] rounded-xl shadow-lg relative">
      {/* Left: Mastering Profile Selector with Categorization */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[#A5A69F] uppercase whitespace-nowrap hidden md:inline">
          DSP PROFILE
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            id="footer-preset-selector-btn"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#151714] hover:bg-[#1B1F24] border border-[#222420] hover:border-[#3A4048] rounded-lg text-xs text-[#F2F2EE] font-medium transition cursor-pointer"
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
            <ChevronDown className={`w-3.5 h-3.5 text-[#A5A69F] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Categorized Preset Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#151714] border border-[#222420] rounded-xl shadow-2xl z-40 overflow-hidden">
              {/* Category Filter Tabs Header */}
              <div className="bg-[#0A0C0E] border-b border-[#222420] p-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono text-[#B7F000] uppercase tracking-wider flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5" /> Filter by Target Role
                  </span>
                  <span className="text-[10px] font-mono text-[#686A63]">
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
                            ? 'bg-[#B7F000] text-[#090A08] font-bold shadow-sm'
                            : 'bg-[#151714] text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#222420]'
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
                          ? 'bg-[#1C170E] text-[#B7F000] font-semibold border-[#B7F000]/40'
                          : 'text-[#F2F2EE] hover:bg-[#1B1F24] border-transparent hover:border-[#222420]'
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
                        <div className="text-[10px] text-[#A5A69F] font-normal truncate mt-0.5 pl-4.5">
                          {preset.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {preset.targetLufs && (
                          <span className="text-[10px] font-mono text-[#A5A69F]">
                            {preset.targetLufs} LUFS
                          </span>
                        )}
                        {isProPreset && <ProBadge size="xs" locked={!FeatureGates.isProUser()} />}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#B7F000]" />}
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
              ? 'bg-[#1C170E] text-[#B7F000] border border-[#B7F000]/40 animate-pulse'
              : masteredRecently
              ? 'bg-[#6FCF97] text-[#090A08]'
              : 'bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] hover:shadow-[0_0_20px_rgba(214,175,98,0.3)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-[#B7F000]" />
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
          <div className="flex items-center p-0.5 bg-[#151714] border border-[#222420] rounded-lg">
            <button
              id="ab-bypass-btn-a"
              onClick={() => {
                if (!isBypassed) onToggleBypass();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                isBypassed
                  ? 'bg-[#222420] text-[#F2F2EE] font-bold'
                  : 'text-[#A5A69F] hover:text-[#F2F2EE]'
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
                  ? 'bg-[#B7F000] text-[#090A08] font-bold'
                  : 'text-[#A5A69F] hover:text-[#F2F2EE]'
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
            className="p-2 text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1B1F24] border border-[#222420] rounded-lg transition cursor-pointer"
            title="Open DSP Parity Verification & Diagnostic Suite"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
