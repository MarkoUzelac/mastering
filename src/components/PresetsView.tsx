import React, { useState, useMemo } from 'react';
import {
  Check,
  ArrowRight,
  Search,
  X,
  SlidersHorizontal,
  Flame,
  Layers,
  Disc3,
  Sliders,
  Filter,
} from 'lucide-react';
import { MasteringPreset } from '../types';
import { PRESET_CATEGORIES, PresetCategory } from '../utils/presets';

interface PresetsViewProps {
  presets: MasteringPreset[];
  activePresetId: string;
  onSelectPreset: (preset: MasteringPreset) => void;
  onOpenMastering: () => void;
  onOpenUpgradeModal: (feature: string) => void;
}

export const PresetsView: React.FC<PresetsViewProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onOpenMastering,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryCounts = useMemo(() => ({
    All: presets.length,
    Mastering: presets.filter((p) => p.category === 'Mastering').length,
    Mixing: presets.filter((p) => p.category === 'Mixing').length,
    Saturation: presets.filter((p) => p.category === 'Saturation').length,
  }), [presets]);

  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return presets.filter((preset) => {
      const matchesCategory = selectedCategory === 'All' || preset.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return [preset.name, preset.category, preset.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [presets, searchQuery, selectedCategory]);

  const handleApply = (preset: MasteringPreset) => {
    onSelectPreset(preset);
    onOpenMastering();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mastering': return <Disc3 className="h-3.5 w-3.5" />;
      case 'Mixing': return <Layers className="h-3.5 w-3.5" />;
      case 'Saturation': return <Flame className="h-3.5 w-3.5" />;
      default: return <Sliders className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Mastering': return 'text-[var(--accent-lime)] bg-[var(--accent-lime-soft)] border-[var(--accent-lime)]/30';
      case 'Mixing': return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30';
      case 'Saturation': return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-subtle)]';
    }
  };

  return (
    <main className="safe-width mx-auto space-y-5 py-3 sm:py-4">
      <header className="premium-surface flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--accent-lime)]">
            <SlidersHorizontal className="h-3 w-3" />
            DSP profile library
          </div>
          <h1 className="break-anywhere text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            Mastering Profiles
          </h1>
          <p className="mt-1 max-w-2xl break-anywhere text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
            Precizno podešeni početni profili za mastering, miks bus i saturaciju. Sve je odmah dostupno u studiju.
          </p>
        </div>

        <div className="w-full min-w-0 lg:max-w-sm">
          <label htmlFor="preset-search-input" className="sr-only">Pretraži profile</label>
          <div className="relative flex min-w-0 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              id="preset-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Pretraži profil, ton ili kategoriju…"
              className="safe-width min-h-[44px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-9 pr-10 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-lime)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Očisti pretragu"
                className="btn-icon absolute right-1 top-1 min-h-[36px] min-w-[36px]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 px-1 text-[10px] font-mono text-[var(--text-tertiary)]">
            <span>{filteredPresets.length} / {presets.length} profila</span>
            <span className="truncate text-[var(--text-secondary)]">{selectedCategory}</span>
          </div>
        </div>
      </header>

      <nav className="safe-width flex min-w-0 gap-1.5 overflow-x-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1.5 scrollbar-none" aria-label="Preset categories">
        {PRESET_CATEGORIES.map((cat) => {
          const selected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3 text-[10px] font-mono font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 ${
                selected
                  ? 'border-[var(--accent-lime)]/50 bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              {getCategoryIcon(cat.id)}
              {cat.label}
              <span className="rounded-full bg-[var(--bg-primary)] px-1.5 py-0.5 text-[9px] tabular-nums">{categoryCounts[cat.id]}</span>
            </button>
          );
        })}
      </nav>

      {filteredPresets.length === 0 ? (
        <section className="premium-surface px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <Filter className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Nema rezultata</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--text-tertiary)]">Promijeni kategoriju ili pojam pretrage.</p>
        </section>
      ) : (
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredPresets.map((preset) => {
            const selected = activePresetId === preset.id;
            return (
              <article
                key={preset.id}
                className={`premium-surface min-w-0 overflow-hidden p-4 transition-all duration-200 ${
                  selected ? 'ring-1 ring-[var(--accent-lime)]/60 shadow-[0_0_30px_rgba(183,240,0,0.07)]' : 'hover:-translate-y-0.5 hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-anywhere text-sm font-semibold leading-snug text-[var(--text-primary)]">{preset.name}</h3>
                      <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                        <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-wider ${getCategoryBadgeStyle(preset.category)}`}>
                          {getCategoryIcon(preset.category)}
                          {preset.category}
                        </span>
                        {preset.targetLufs !== undefined && (
                          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-1 text-[9px] font-mono text-[var(--text-secondary)]">
                            {preset.targetLufs} LUFS
                          </span>
                        )}
                      </div>
                    </div>
                    {selected && <Check className="h-4 w-4 shrink-0 text-[var(--accent-lime)]" aria-label="Aktivan profil" />}
                  </div>

                  <p className="mt-3 min-h-[54px] break-anywhere text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {preset.description}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2 text-center font-mono">
                    <div className="min-w-0"><span className="block text-[8px] uppercase tracking-wider text-[var(--text-tertiary)]">Low</span><span className="block truncate text-[10px] text-[var(--text-primary)]">{preset.params.low > 0 ? '+' : ''}{preset.params.low} dB</span></div>
                    <div className="min-w-0"><span className="block text-[8px] uppercase tracking-wider text-[var(--text-tertiary)]">Mid</span><span className="block truncate text-[10px] text-[var(--text-primary)]">{preset.params.mid > 0 ? '+' : ''}{preset.params.mid} dB</span></div>
                    <div className="min-w-0"><span className="block text-[8px] uppercase tracking-wider text-[var(--text-tertiary)]">High</span><span className="block truncate text-[10px] text-[var(--text-primary)]">{preset.params.high > 0 ? '+' : ''}{preset.params.high} dB</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(preset)}
                  className={`mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold font-mono transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 ${
                    selected
                      ? 'border-[var(--accent-lime)]/50 bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-lime)]/40 hover:bg-[var(--accent-lime-soft)]'
                  }`}
                >
                  {selected ? <><Check className="h-3.5 w-3.5" /> AKTIVNO U STUDIJU</> : <>PRIMIJENI PROFIL <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};
