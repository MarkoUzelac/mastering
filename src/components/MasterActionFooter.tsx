import React, { useState } from 'react';
import { Sparkles, ChevronDown, Check, Zap, Settings2 } from 'lucide-react';
import { MasteringPreset } from '../types';
import { ProBadge } from './ProBadge';
import { FeatureGates } from '../billing/feature-gates';

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
  const [masteredRecently, setMasteredRecently] = useState(false);

  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

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

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 bg-[#0E1013] border border-[#24282D] rounded-xl shadow-lg">
      {/* Left: Mastering Profile Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[#9A9EA6] uppercase whitespace-nowrap">
          MASTERING PROFILE
        </span>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] hover:border-[#3A4048] rounded-lg text-xs text-[#F4F3EF] font-medium transition cursor-pointer"
          >
            <span>{activePreset ? activePreset.name : 'Streaming Target'}</span>
            {(activePreset?.proOnly || activePreset?.isPro) && <ProBadge size="xs" />}
            <ChevronDown className="w-3.5 h-3.5 text-[#9A9EA6]" />
          </button>

          {/* Preset Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute bottom-full mb-1 left-0 w-64 bg-[#14171B] border border-[#24282D] rounded-lg shadow-2xl p-1 z-30 space-y-0.5 max-h-72 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-mono text-[#646A73] uppercase tracking-wider">
                Target Mastering Presets
              </div>
              {presets.map((preset) => {
                const isProPreset = preset.proOnly || preset.isPro;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded flex items-center justify-between transition cursor-pointer ${
                      activePresetId === preset.id
                        ? 'bg-[#1C170E] text-[#D6AF62] font-semibold'
                        : 'text-[#F4F3EF] hover:bg-[#1B1F24]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div>{preset.name}</div>
                      <div className="text-[10px] text-[#9A9EA6] font-normal truncate">
                        {preset.description}
                      </div>
                    </div>
                    {isProPreset && <ProBadge size="xs" locked={!FeatureGates.isProUser()} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center: Hero MASTER THIS TRACK Button */}
      <div className="w-full sm:w-auto flex justify-center">
        <button
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
