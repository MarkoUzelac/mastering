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
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFooterCategory, setSelectedFooterCategory] = useState<PresetCategory>('All');
  const [masteredRecently, setMasteredRecently] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleMasterClick = () => {
    if (onMasterTrack) onMasterTrack();
    else onExportClick?.();
    setMasteredRecently(true);
    window.setTimeout(() => setMasteredRecently(false), 1800);
  };

  const handlePresetSelect = (preset: MasteringPreset) => {
    onSelectPreset(preset);
    setDropdownOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mastering': return <Disc3 className="h-3 w-3 text-[var(--accent-lime)]" />;
      case 'Mixing': return <Layers className="h-3 w-3 text-[#38BDF8]" />;
      case 'Saturation': return <Flame className="h-3 w-3 text-[#F59E0B]" />;
      default: return <Sliders className="h-3 w-3 text-[var(--text-secondary)]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Mastering': return 'text-[var(--accent-lime)] bg-[var(--accent-lime-soft)] border-[var(--accent-lime)]/20';
      case 'Mixing': return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20';
      case 'Saturation': return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-subtle)]';
    }
  };

  const filteredPresets = selectedFooterCategory === 'All'
    ? presets
    : presets.filter((p) => p.category === selectedFooterCategory);

  return (
    <footer className="premium-surface safe-width relative flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 w-full items-center gap-2 sm:w-auto">
        <span className="hidden shrink-0 text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] lg:inline">DSP profile</span>
        <div className="relative min-w-0 flex-1 sm:flex-none" ref={dropdownRef}>
          <button
            id="footer-preset-selector-btn"
            type="button"
            onClick={() => setDropdownOpen((value) => !value)}
            className="btn-secondary w-full min-w-0 justify-between px-3 text-xs sm:w-auto sm:max-w-[330px]"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            {activePreset && getCategoryIcon(activePreset.category)}
            <span className="min-w-0 flex-1 truncate text-left sm:max-w-[210px]">{activePreset?.name || 'Neutral / Transparent'}</span>
            {activePreset && <span className={`hidden shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-mono uppercase sm:inline ${getCategoryBadgeClass(activePreset.category)}`}>{activePreset.category}</span>}
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 z-40 mb-2 w-[min(92vw,420px)] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-2xl">
              <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-mono uppercase tracking-wider text-[var(--accent-lime)]"><Filter className="h-2.5 w-2.5 shrink-0" /> Profiles</span>
                  <span className="shrink-0 text-[9px] font-mono text-[var(--text-tertiary)]">{filteredPresets.length}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setSelectedFooterCategory(cat.id); }}
                      className={`min-h-[36px] rounded-md px-2 text-[9px] font-mono font-semibold transition-colors ${selectedFooterCategory === cat.id ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      {cat.id === 'All' ? 'All' : cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[min(55vh,360px)] overflow-y-auto p-1.5">
                {filteredPresets.map((preset) => {
                  const selected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handlePresetSelect(preset)}
                      className={`mb-1 flex min-h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors last:mb-0 ${selected ? 'border-[var(--accent-lime)]/40 bg-[var(--accent-lime-soft)]' : 'border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {getCategoryIcon(preset.category)}
                          <span className="min-w-0 truncate text-xs font-medium text-[var(--text-primary)]">{preset.name}</span>
                        </div>
                        <span className="mt-0.5 block truncate pl-4.5 text-[9px] text-[var(--text-secondary)]">{preset.description}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {preset.targetLufs !== undefined && <span className="hidden text-[9px] font-mono text-[var(--text-tertiary)] sm:inline">{preset.targetLufs} LUFS</span>}
                        {selected && <Check className="h-3.5 w-3.5 text-[var(--accent-lime)]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        id="hero-master-render-btn"
        type="button"
        onClick={handleMasterClick}
        disabled={isProcessing}
        className={`w-full min-w-0 shrink-0 rounded-md px-6 py-3 text-xs font-semibold tracking-wide font-mono transition-all sm:w-auto ${isProcessing ? 'animate-pulse bg-[var(--accent-lime-soft)] text-[var(--accent-lime)] ring-1 ring-[var(--accent-lime)]/40' : masteredRecently ? 'bg-[#6FCF97] text-[var(--bg-primary)]' : 'bg-[var(--accent-lime)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-lime)]/10 hover:-translate-y-px hover:bg-[var(--accent-lime-hover)]'}`}
      >
        {isProcessing ? <><Zap className="mx-auto h-4 w-4 animate-spin" /> PROCESSING…</> : masteredRecently ? <><Check className="inline h-4 w-4" /> READY</> : <><Sparkles className="inline h-4 w-4 fill-current" /> RENDER &amp; EXPORT</>}
      </button>

      <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:w-auto">
        {onToggleBypass && (
          <div className="flex shrink-0 items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5" aria-label="A/B bypass">
            <button type="button" aria-pressed={isBypassed} onClick={() => { if (!isBypassed) onToggleBypass(); }} className={`min-h-[40px] min-w-[40px] rounded px-2 text-xs font-mono ${isBypassed ? 'bg-[var(--border-subtle)] font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>A</button>
            <button type="button" aria-pressed={!isBypassed} onClick={() => { if (isBypassed) onToggleBypass(); }} className={`min-h-[40px] min-w-[40px] rounded px-2 text-xs font-mono ${!isBypassed ? 'bg-[var(--accent-lime)] font-bold text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>B</button>
          </div>
        )}
        {onOpenParityModal && (
          <button id="footer-parity-shortcut-btn" type="button" onClick={onOpenParityModal} className="btn-icon shrink-0" title="DSP dijagnostika" aria-label="DSP dijagnostika">
            <Settings2 className="h-4 w-4" />
          </button>
        )}
        {onResetParams && (
          <button type="button" onClick={onResetParams} className="hidden min-h-[40px] rounded-md px-3 text-[10px] font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] sm:block">
            RESET
          </button>
        )}
      </div>
    </footer>
  );
};
