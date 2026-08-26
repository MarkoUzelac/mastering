import React, { useState } from 'react';
import { MASTERING_PRESETS, PRESET_CATEGORIES, PresetCategory } from '../utils/presets';
import { MasteringParams, MasteringPreset } from '../types';
import { Bookmark, Sparkles, Check, Music, Lock, Volume2 } from 'lucide-react';
import { ProBadge } from './ProBadge';
import { FeatureGates } from '../billing/feature-gates';
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
  onUpgradeClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('All');
  const isPro = FeatureGates.isProUser();

  const filteredPresets = selectedCategory === 'All'
    ? MASTERING_PRESETS
    : MASTERING_PRESETS.filter((p) => p.category === selectedCategory);

  const isPresetActive = (p: MasteringPreset) => {
    return (
      Math.abs(p.params.low - currentParams.low) < 0.05 &&
      Math.abs(p.params.mid - currentParams.mid) < 0.05 &&
      Math.abs(p.params.high - currentParams.high) < 0.05 &&
      Math.abs(p.params.threshold - currentParams.threshold) < 0.05 &&
      Math.abs(p.params.ratio - currentParams.ratio) < 0.05 &&
      Math.abs(p.params.gain - currentParams.gain) < 0.05
    );
  };

  const handleClickPreset = (preset: MasteringPreset) => {
    if (isBypassed) return;
    if (preset.isPro && !isPro && onUpgradeClick) {
      onUpgradeClick('ADVANCED_PRESETS');
      return;
    }
    onApplyPreset(preset);
  };

  return (
    <div className="bg-[#07170c] rounded-sm p-5 border border-[#0d381c] shadow-lg crt-overlay">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0d381c] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-[#00ff66]" />
          <h2 className="text-sm font-bold font-mono tracking-tight text-[#00ff66] uppercase glow-phosphor">
            DSP Target Presets &amp; Profiles
          </h2>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-sm transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#00ff66] text-[#030d06] font-bold shadow-sm shadow-[#00ff66]/30'
                  : 'bg-[#030d06] text-[#00aa44] hover:text-[#00ff66] border border-[#0f4020]'
              }`}
            >
              {cat.id === 'All' ? 'All' : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredPresets.map((preset) => {
          const active = isPresetActive(preset);
          const isLocked = preset.isPro && !isPro;

          return (
            <button
              key={preset.id}
              onClick={() => handleClickPreset(preset)}
              disabled={isBypassed}
              className={`p-3.5 rounded-sm border text-left transition relative flex flex-col justify-between cursor-pointer ${
                active
                  ? 'bg-[#0f4020]/70 border-[#00ff66] text-[var(--text-primary)] shadow-md shadow-[#00ff66]/15'
                  : isLocked
                  ? 'bg-[#030a05] border-[#1a331f] text-[#00aa44] hover:border-[#f59e0b]/50'
                  : 'bg-[#030d06] border-[#0d381c] text-[#00cc55] hover:bg-[#071c0e] hover:border-[#00ff66]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1 gap-1">
                  <span className="text-xs font-bold font-mono text-[#00ff66] block truncate">
                    {preset.name}
                  </span>
                  {preset.isPro && <ProBadge locked={isLocked} />}
                  {active && !preset.isPro && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#00ff66] text-[#030d06] rounded">
                      <Check className="w-2.5 h-2.5" /> ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#0a2913] text-[#00ff66] border border-[#0f4020] rounded">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#00aa44] line-clamp-2 leading-relaxed mb-2 font-mono">
                  {preset.description}
                </p>
              </div>

              {/* Target & Parameter footprint badge */}
              <div className="pt-2 border-t border-[#0f4020] flex items-center justify-between text-[10px] font-mono text-[#008833]">
                {preset.targetLufs ? (
                  <span className="text-[#88ffaa] flex items-center gap-1 font-bold">
                    <Volume2 className="w-2.5 h-2.5 text-[#00ff66]" />
                    {preset.targetLufs} LUFS
                  </span>
                ) : (
                  <span>EQ: {preset.params.low}/{preset.params.mid}/{preset.params.high}</span>
                )}
                <span>Thresh: {preset.params.threshold}dB</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
