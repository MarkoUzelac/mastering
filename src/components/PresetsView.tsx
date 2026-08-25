import React, { useState, useMemo } from 'react';
import {
  Sparkles,
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
import { ProBadge } from './ProBadge';
import { FeatureGates } from '../billing/feature-gates';
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
  onOpenUpgradeModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isPro = FeatureGates.isProUser();

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<PresetCategory, number> = {
      All: presets.length,
      Mastering: presets.filter((p) => p.category === 'Mastering').length,
      Mixing: presets.filter((p) => p.category === 'Mixing').length,
      Saturation: presets.filter((p) => p.category === 'Saturation').length,
    };
    return counts;
  }, [presets]);

  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || preset.category === selectedCategory;

      if (!matchesCategory) return false;

      // Search filter
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        preset.name.toLowerCase().includes(query) ||
        (preset.category && preset.category.toLowerCase().includes(query)) ||
        (preset.description && preset.description.toLowerCase().includes(query))
      );
    });
  }, [presets, selectedCategory, searchQuery]);

  const handleApply = (preset: MasteringPreset) => {
    const isProPreset = preset.proOnly || preset.isPro;
    if (isProPreset && !isPro) {
      onOpenUpgradeModal(preset.name);
      return;
    }
    onSelectPreset(preset);
    onOpenMastering();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mastering':
        return <Disc3 className="w-3.5 h-3.5" />;
      case 'Mixing':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Saturation':
        return <Flame className="w-3.5 h-3.5" />;
      default:
        return <Sliders className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Mastering':
        return 'text-[#B7F000] bg-[#B7F000]/10 border-[#B7F000]/30';
      case 'Mixing':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30';
      case 'Saturation':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
      default:
        return 'text-[#A5A69F] bg-[#151714] border-[#222420]';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 py-4">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222420] pb-5">
        <div>
          <div className="text-[10px] font-mono text-[#B7F000] uppercase tracking-widest flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3" />
            DSP CURVES &amp; CALIBRATIONS
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F2F2EE] mt-0.5">
            Mastering, Mixing &amp; Saturation Profiles
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A69F] mt-1 max-w-2xl">
            Precision-tuned DSP curves categorized for streaming loudness compliance, cohesive bus mixing, and warm analog saturation.
          </p>
        </div>

        {/* Search Input Field */}
        <div className="w-full md:w-80 relative">
          <label htmlFor="preset-search-input" className="sr-only">
            Search presets by name
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#A5A69F] absolute left-3 pointer-events-none" />
            <input
              id="preset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search profiles or tone..."
              className="w-full pl-9 pr-8 py-2 bg-[#0E1013] border border-[#222420] focus:border-[#B7F000] rounded-sm text-xs text-[#F2F2EE] placeholder-[#686A63] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                id="preset-clear-search"
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear preset search"
                className="absolute right-2.5 text-[#A5A69F] hover:text-[#F2F2EE] p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex justify-between items-center px-1 mt-1.5 text-[11px] font-mono text-[#686A63]">
            <span>
              Showing {filteredPresets.length} of {presets.length} profiles
            </span>
            {searchQuery && (
              <span className="text-[#B7F000] truncate max-w-[140px]">
                &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E1013] border border-[#222420] p-2 rounded-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PRESET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id];

            return (
              <button
                key={cat.id}
                id={`filter-tab-${cat.id.toLowerCase()}`}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1C170E] text-[#B7F000] border border-[#B7F000]/40 font-semibold shadow-sm'
                    : 'bg-[#151714] text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#1B1F24] border border-transparent'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected
                      ? 'bg-[#B7F000] text-[#090A08] font-bold'
                      : 'bg-[#090A08] text-[#686A63]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Descriptor */}
        <div className="text-[11px] text-[#686A63] font-mono px-2 hidden lg:block">
          {PRESET_CATEGORIES.find((c) => c.id === selectedCategory)?.description}
        </div>
      </div>

      {/* Preset Cards Grid or Empty State */}
      {filteredPresets.length === 0 ? (
        <div className="py-16 text-center bg-[#0E1013] border border-[#222420] rounded-sm p-8 space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#151714] border border-[#222420] text-[#A5A69F] mx-auto flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#F2F2EE]">No presets found</h3>
          <p className="text-xs text-[#8E95A2] max-w-sm mx-auto">
            No profile matches your current filters
            {selectedCategory !== 'All' ? ` in the ${selectedCategory} category` : ''}
            {searchQuery ? ` for query "${searchQuery}"` : ''}.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="px-3.5 py-1.5 rounded-sm bg-[#151714] hover:bg-[#222420] text-xs font-mono text-[#B7F000] border border-[#222420] transition-colors"
              >
                Show All Categories
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-sm bg-[#151714] hover:bg-[#222420] text-xs font-mono text-[#F2F2EE] border border-[#222420] transition-colors"
              >
                Clear Search Query
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPresets.map((preset) => {
            const isProPreset = preset.proOnly || preset.isPro;
            const isSelected = activePresetId === preset.id;
            const isLocked = isProPreset && !isPro;

            return (
              <div
                key={preset.id}
                id={`preset-card-${preset.id}`}
                className={`bg-[#0E1013] border rounded-sm p-5 flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'border-[#B7F000] shadow-[0_0_20px_rgba(214,175,98,0.15)] bg-gradient-to-b from-[#151714] to-[#0E1013]'
                    : 'border-[#222420] hover:border-[#3A4048]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-[#F2F2EE] flex items-center gap-2">
                        {preset.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${getCategoryBadgeStyle(
                            preset.category
                          )}`}
                        >
                          {getCategoryIcon(preset.category)}
                          {preset.category}
                        </span>
                        {preset.targetLufs && (
                          <span className="text-[10px] font-mono text-[#A5A69F]">
                            {preset.targetLufs} LUFS
                          </span>
                        )}
                      </div>
                    </div>
                    {isProPreset && <ProBadge size="sm" locked={isLocked} />}
                  </div>

                  <p className="text-xs text-[#A5A69F] leading-relaxed mb-4 min-h-[36px]">
                    {preset.description}
                  </p>

                  {/* Target Telemetry Pills */}
                  <div className="grid grid-cols-3 gap-2 bg-[#090A08] border border-[#222420] rounded-sm p-2.5 text-center font-mono text-xs mb-4">
                    <div>
                      <span className="text-[9px] text-[#686A63] block">TARGET</span>
                      <span className="text-[#F2F2EE] font-semibold">
                        {preset.targetLufs ? `${preset.targetLufs} LUFS` : '-14 LUFS'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#686A63] block">CEILING</span>
                      <span className="text-[#B7F000] font-semibold">-1.0 dBTP</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#686A63] block">EQ TONE</span>
                      <span className="text-[#A5A69F]">
                        {preset.params.high > 1 ? 'Bright' : preset.params.low > 1 ? 'Warm' : 'Neutral'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  id={`preset-apply-btn-${preset.id}`}
                  onClick={() => handleApply(preset)}
                  className={`w-full py-2 px-3 text-xs font-semibold font-mono rounded-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C170E] text-[#B7F000] border border-[#B7F000]/40'
                      : isLocked
                      ? 'bg-[#151714] text-[#B7F000] border border-[#222420] hover:border-[#B7F000]/50'
                      : 'bg-[#151714] hover:bg-[#B7F000] text-[#F2F2EE] hover:text-[#090A08] border border-[#222420]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ACTIVE IN STUDIO</span>
                    </>
                  ) : isLocked ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>UNLOCK WITH PRO</span>
                    </>
                  ) : (
                    <>
                      <span>APPLY TO WORKSPACE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
