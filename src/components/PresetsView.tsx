import React, { useState, useMemo } from 'react';
import { Sparkles, Check, ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react';
import { MasteringPreset } from '../types';
import { ProBadge } from './ProBadge';
import { FeatureGates } from '../billing/feature-gates';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isPro = FeatureGates.isProUser();

  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return presets;

    return presets.filter((preset) =>
      preset.name.toLowerCase().includes(query) ||
      (preset.category && preset.category.toLowerCase().includes(query)) ||
      (preset.description && preset.description.toLowerCase().includes(query))
    );
  }, [presets, searchQuery]);

  const handleApply = (preset: MasteringPreset) => {
    const isProPreset = preset.proOnly || preset.isPro;
    if (isProPreset && !isPro) {
      onOpenUpgradeModal(preset.name);
      return;
    }
    onSelectPreset(preset);
    onOpenMastering();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 py-4">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#24282D] pb-5">
        <div>
          <div className="text-[10px] font-mono text-[#D6AF62] uppercase tracking-widest">
            MASTERING PROFILES
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F3EF] mt-0.5">
            Calibrated Mastering Profiles & Targets
          </h1>
          <p className="text-xs sm:text-sm text-[#9A9EA6] mt-1">
            Engineered curves designed for major streaming platforms, club systems, and acoustic transparency.
          </p>
        </div>

        {/* Search Input Field */}
        <div className="w-full md:w-80 relative">
          <label htmlFor="preset-search-input" className="sr-only">
            Search presets by name
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#9A9EA6] absolute left-3 pointer-events-none" />
            <input
              id="preset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presets by name..."
              className="w-full pl-9 pr-8 py-2 bg-[#0E1013] border border-[#24282D] focus:border-[#D6AF62] rounded-lg text-xs text-[#F4F3EF] placeholder-[#646A73] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                id="preset-clear-search"
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear preset search"
                className="absolute right-2.5 text-[#9A9EA6] hover:text-[#F4F3EF] p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex justify-between items-center px-1 mt-1.5 text-[11px] font-mono text-[#646A73]">
            <span>
              Showing {filteredPresets.length} of {presets.length} profiles
            </span>
            {searchQuery && (
              <span className="text-[#D6AF62]">
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preset Cards Grid or Empty State */}
      {filteredPresets.length === 0 ? (
        <div className="py-16 text-center bg-[#0E1013] border border-[#24282D] rounded-xl p-8 space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#14171B] border border-[#24282D] text-[#9A9EA6] mx-auto flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#F4F3EF]">No mastering presets found</h3>
          <p className="text-xs text-[#8E95A2] max-w-sm mx-auto">
            No preset matches &quot;{searchQuery}&quot;. Try searching for &quot;Streaming&quot;, &quot;Club&quot;, &quot;Warm&quot;, or &quot;EDM&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-1.5 rounded-lg bg-[#14171B] hover:bg-[#1E2228] text-xs font-mono text-[#D6AF62] border border-[#24282D] transition-colors"
          >
            Clear Filter
          </button>
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
                className={`bg-[#0E1013] border rounded-xl p-5 flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'border-[#D6AF62] shadow-[0_0_20px_rgba(214,175,98,0.15)]'
                    : 'border-[#24282D] hover:border-[#3A4048]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-[#F4F3EF] flex items-center gap-2">
                        {preset.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#D6AF62] uppercase tracking-wider">
                        {preset.category || 'Mastering Profile'}
                      </span>
                    </div>
                    {isProPreset && <ProBadge size="sm" locked={isLocked} />}
                  </div>

                  <p className="text-xs text-[#9A9EA6] leading-relaxed mb-4">
                    {preset.description}
                  </p>

                  {/* Target Telemetry Pills */}
                  <div className="grid grid-cols-3 gap-2 bg-[#08090B] border border-[#1E2228] rounded-lg p-2.5 text-center font-mono text-xs mb-4">
                    <div>
                      <span className="text-[9px] text-[#646A73] block">TARGET</span>
                      <span className="text-[#F4F3EF] font-semibold">
                        {preset.targetLufs ? `${preset.targetLufs} LUFS` : '-14 LUFS'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#646A73] block">CEILING</span>
                      <span className="text-[#D6AF62] font-semibold">-1.0 dBTP</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#646A73] block">EQ TONE</span>
                      <span className="text-[#9A9EA6]">
                        {preset.params.high > 1 ? 'Bright' : preset.params.low > 1 ? 'Warm' : 'Neutral'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  id={`preset-apply-btn-${preset.id}`}
                  onClick={() => handleApply(preset)}
                  className={`w-full py-2 px-3 text-xs font-semibold font-mono rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C170E] text-[#D6AF62] border border-[#D6AF62]/40'
                      : isLocked
                      ? 'bg-[#14171B] text-[#D6AF62] border border-[#24282D] hover:border-[#D6AF62]/50'
                      : 'bg-[#14171B] hover:bg-[#D6AF62] text-[#F4F3EF] hover:text-[#08090B] border border-[#24282D]'
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
