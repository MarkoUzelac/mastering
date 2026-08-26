import React, { useState, useRef, useEffect } from 'react';
import {
  IconSparkles as Sparkles,
  IconChevronDown as ChevronDown,
  IconCheck as Check,
  IconZap as Zap,
  IconSettings2 as Settings2,
  IconDisc3 as Disc3,
  IconLayers as Layers,
  IconFlame as Flame,
  IconSliders as Sliders,
  IconFilter as Filter,
} from './Icons';
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
        return <Disc3 className="w-3 h-3 text-[var(--accent-lime)]" />;
      case 'Mixing':
        return <Layers className="w-3 h-3 text-[#38BDF8]" />;
      case 'Saturation':
        return <Flame className="w-3 h-3 text-[#F59E0B]" />;
      default:
        return <Sliders className="w-3 h-3 text-[var(--text-secondary)]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Mastering':
        return 'text-[var(--accent-lime)] bg-[var(--accent-lime)]/10 border-[var(--accent-lime)]/20';
      case 'Mixing':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
      case 'Saturation':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default:
        return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-subtle)]';
    }
  };

  const filteredPresets = selectedFooterCategory === 'All'
    ? presets
    : presets.filter((p) => p.category === selectedFooterCategory);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm shadow-lg relative">
      {/* Left: Mastering Profile Selector with Categorization */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[var(--text-secondary)] uppercase whitespace-nowrap hidden md:inline">
          DSP PROFILE
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            id="footer-preset-selector-btn"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn-secondary px-3 py-1.5 text-xs justify-between w-full sm:w-auto"
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
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Categorized Preset Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm shadow-2xl z-40 overflow-hidden">
              {/* Category Filter Tabs Header */}
              <div className="bg-[#0A0C0E] border-b border-[var(--border-subtle)] p-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono text-[var(--accent-lime)] uppercase tracking-wider flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5" /> Filter by Target Role
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
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
                            ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] font-bold shadow-sm'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
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
                      className={`w-full text-left px-3 py-2 text-xs rounded-sm flex items-center justify-between transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#1C170E] text-[var(--accent-lime)] font-semibold border-[var(--accent-lime)]/40'
                          : 'text-[var(--text-primary)] hover:bg-[#1B1F24] border-transparent hover:border-[var(--border-subtle)]'
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
                        <div className="text-[10px] text-[var(--text-secondary)] font-normal truncate mt-0.5 pl-4.5">
                          {preset.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {preset.targetLufs && (
                          <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                            {preset.targetLufs} LUFS
                          </span>
                        )}
                        {isProPreset && <ProBadge size="xs" locked={!FeatureGates.isProUser()} />}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-lime)]" />}
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
          className={`w-full sm:w-auto px-8 py-2.5 rounded-sm text-xs sm:text-sm font-semibold tracking-wide font-mono transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
            isProcessing
              ? 'bg-[#1C170E] text-[var(--accent-lime)] border border-[var(--accent-lime)]/40 animate-pulse'
              : masteredRecently
              ? 'bg-[#6FCF97] text-[var(--bg-primary)]'
              : 'bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-[var(--accent-lime)]" />
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
          <div className="flex items-center p-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm">
            <button
              id="ab-bypass-btn-a"
              onClick={() => {
                if (!isBypassed) onToggleBypass();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                isBypassed
                  ? 'bg-[var(--border-subtle)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[#1B1F24] border border-[var(--border-subtle)] rounded-sm transition cursor-pointer"
            title="Open DSP Parity Verification & Diagnostic Suite"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
