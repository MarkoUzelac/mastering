import React, { useState } from 'react';
import { MASTERING_PRESETS, PRESET_CATEGORIES, PresetCategory } from '../utils/presets';
import { MasteringParams, MasteringPreset } from '../types';
import { Bookmark, Check, Volume2, ChevronDown } from 'lucide-react';
import { FeatureKey } from '../billing/billing-config';

interface PresetSelectorProps {
  currentParams: MasteringParams;
  onApplyPreset: (preset: MasteringPreset) => void;
  isBypassed: boolean;
  onUpgradeClick?: (featureKey: FeatureKey) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentParams,
  onApplyPreset,
  isBypassed,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('All');
  const [open, setOpen] = useState(false);

  const filteredPresets = selectedCategory === 'All'
    ? MASTERING_PRESETS
    : MASTERING_PRESETS.filter((p) => p.category === selectedCategory);

  const isPresetActive = (p: MasteringPreset) => (
    Math.abs(p.params.low - currentParams.low) < 0.05 &&
    Math.abs(p.params.mid - currentParams.mid) < 0.05 &&
    Math.abs(p.params.high - currentParams.high) < 0.05 &&
    Math.abs(p.params.threshold - currentParams.threshold) < 0.05 &&
    Math.abs(p.params.ratio - currentParams.ratio) < 0.05 &&
    Math.abs(p.params.gain - currentParams.gain) < 0.05
  );

  const handleClickPreset = (preset: MasteringPreset) => {
    if (isBypassed) return;
    onApplyPreset(preset);
    setOpen(false);
  };

  return (
    <section className="premium-surface safe-width overflow-hidden p-4 sm:p-5" aria-label="DSP preset library">
      <div className="flex min-w-0 flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]">
            <Bookmark className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)]">Mastering Profiles</h2>
            <p className="truncate text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {MASTERING_PRESETS.length} calibrated starting points
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5" role="tablist" aria-label="Preset categories">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[36px] rounded-full border px-3 py-1.5 text-[10px] font-mono font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 ${
                  selectedCategory === cat.id
                    ? 'border-[var(--accent-lime)]/50 bg-[var(--accent-lime-soft)] text-[var(--accent-lime)] shadow-sm'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filteredPresets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleClickPreset(preset)}
              disabled={isBypassed}
              className={`group flex min-w-0 flex-col rounded-lg border p-4 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'border-[var(--accent-lime)]/60 bg-[var(--accent-lime-soft)] shadow-[0_8px_28px_rgba(183,240,0,0.08)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="min-w-0">
                <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-lime)] opacity-80" />
                    <span className="min-w-0 break-anywhere text-xs font-semibold leading-snug text-[var(--text-primary)]">{preset.name}</span>
                  </div>
                  {active && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-lime)] px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--bg-primary)]">
                      <Check className="h-2.5 w-2.5" /> ACTIVE
                    </span>
                  )}
                </div>
                <span className="mb-2 inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  {preset.category}
                </span>
                <p className="break-anywhere line-clamp-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {preset.description}
                </p>
              </div>

              <div className="mt-4 flex min-w-0 items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-[9px] font-mono">
                {preset.targetLufs !== undefined ? (
                  <span className="flex shrink-0 items-center gap-1 text-[var(--accent-lime)]">
                    <Volume2 className="h-3 w-3" /> {preset.targetLufs} LUFS
                  </span>
                ) : <span className="text-[var(--text-tertiary)]">CUSTOM CURVE</span>}
                <span className="truncate text-[var(--text-tertiary)]">THR {preset.params.threshold} dB</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 px-3 py-2.5">
        <span className="min-w-0 truncate text-[10px] font-mono text-[var(--text-tertiary)]">
          {filteredPresets.length} profila u kategoriji
        </span>
        <button
          type="button"
          className="flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          onClick={() => setOpen((state) => !state)}
          aria-expanded={open}
          aria-label="Toggle preset library help"
        >
          Library <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <p className="mt-2 break-anywhere text-[10px] leading-relaxed text-[var(--text-tertiary)]">
          Svaki profil je odmah dostupan i primjenjuje se izravno na aktivni DSP lanac. Dvoklik nije potreban: odabir je jednim dodirom ili klikom.
        </p>
      )}
    </section>
  );
};
