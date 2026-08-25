import React from 'react';
import { MasteringParams } from '../types';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { soundHaptics } from '../utils/sound-haptics';

interface MasteringKnobsProps {
  params: MasteringParams;
  onChange: (param: keyof MasteringParams, value: number) => void;
  onReset: () => void;
  isBypassed: boolean;
}

export const MasteringKnobs: React.FC<MasteringKnobsProps> = ({
  params,
  onChange,
  onReset,
  isBypassed,
}) => {
  const handleResetAll = () => {
    soundHaptics.playResetSound();
    onReset();
  };

  const handleSliderChange = (param: keyof MasteringParams, value: number) => {
    onChange(param, value);
    soundHaptics.playSliderTick(1300 + value * 30);
  };

  const handleDoubleClick = (param: keyof MasteringParams, defaultVal: number) => {
    onChange(param, defaultVal);
    soundHaptics.playResetSound();
  };

  return (
    <div className="bg-[#0E1013] rounded-xl p-5 border border-[#24282D] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1E2228] pb-3 mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#D6AF62]" />
          <h2 className="text-sm font-bold font-mono tracking-tight text-[#F4F3EF] uppercase">
            Analog DSP Parameter Controls
          </h2>
        </div>
        <button
          id="reset-params-btn"
          onClick={handleResetAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-[#D6AF62] hover:text-[#E7C77F] bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] rounded-md transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EQ Section */}
        <div className="space-y-4 bg-[#08090B] p-4 rounded-xl border border-[#1E2228]">
          <div className="flex items-center justify-between border-b border-[#1E2228] pb-2">
            <span className="text-xs font-bold font-mono text-[#D6AF62] uppercase tracking-wider">
              3-Band Parametric EQ
            </span>
            <span className="text-[10px] text-[#9A9EA6] font-mono">Biquad Filter Bank</span>
          </div>

          {/* Low Shelf */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('low', 0)}
            title="Double-click to reset (0.0 dB)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#D6AF62]" />
                Low Shelf (120 Hz)
              </span>
              <span className="font-mono font-bold text-[#F4F3EF] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                {params.low > 0 ? `+${params.low.toFixed(1)}` : params.low.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={params.low}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('low', 0)}
              onChange={(e) => handleSliderChange('low', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>-12 dB</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: 0 dB</span>
              <span>+12 dB</span>
            </div>
          </div>

          {/* Mid Peaking */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('mid', 0)}
            title="Double-click to reset (0.0 dB)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#D6AF62]" />
                Mid Peak (1.2 kHz, Q=0.8)
              </span>
              <span className="font-mono font-bold text-[#F4F3EF] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                {params.mid > 0 ? `+${params.mid.toFixed(1)}` : params.mid.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={params.mid}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('mid', 0)}
              onChange={(e) => handleSliderChange('mid', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>-12 dB</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: 0 dB</span>
              <span>+12 dB</span>
            </div>
          </div>

          {/* High Shelf */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('high', 0)}
            title="Double-click to reset (0.0 dB)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#D6AF62]" />
                High Shelf (8.5 kHz)
              </span>
              <span className="font-mono font-bold text-[#F4F3EF] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                {params.high > 0 ? `+${params.high.toFixed(1)}` : params.high.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={params.high}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('high', 0)}
              onChange={(e) => handleSliderChange('high', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>-12 dB</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: 0 dB</span>
              <span>+12 dB</span>
            </div>
          </div>
        </div>

        {/* Dynamics & Maximizer Section */}
        <div className="space-y-4 bg-[#08090B] p-4 rounded-xl border border-[#1E2228]">
          <div className="flex items-center justify-between border-b border-[#1E2228] pb-2">
            <span className="text-xs font-bold font-mono text-[#D6AF62] uppercase tracking-wider">
              Dynamics & Maximizer
            </span>
            <span className="text-[10px] text-[#9A9EA6] font-mono">Feedback Comp + Limiter</span>
          </div>

          {/* Threshold */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('threshold', -24)}
            title="Double-click to reset (-24.0 dB)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors font-mono">
                Compressor Threshold
              </span>
              <span className="font-mono font-bold text-[#F4F3EF] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                {params.threshold.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="0"
              step="0.5"
              value={params.threshold}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('threshold', -24)}
              onChange={(e) => handleSliderChange('threshold', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>-60 dB</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: -24 dB</span>
              <span>0 dB</span>
            </div>
          </div>

          {/* Ratio */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('ratio', 2.0)}
            title="Double-click to reset (2.0:1)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors font-mono">
                Compression Ratio
              </span>
              <span className="font-mono font-bold text-[#F4F3EF] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                {params.ratio.toFixed(1)}:1
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={params.ratio}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('ratio', 2.0)}
              onChange={(e) => handleSliderChange('ratio', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>1.0:1</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: 2.0:1</span>
              <span>20:1</span>
            </div>
          </div>

          {/* Makeup Gain */}
          <div
            className="space-y-1.5 group select-none cursor-pointer"
            onDoubleClick={() => handleDoubleClick('gain', 0.0)}
            title="Double-click to reset (0.0 dB)"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F3EF] group-hover:text-[#D6AF62] transition-colors font-mono">
                Makeup Gain / Maximizer
              </span>
              <span className="font-mono font-bold text-[#D6AF62] bg-[#14171B] px-2 py-0.5 rounded border border-[#24282D]">
                +{params.gain.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={params.gain}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClick('gain', 0.0)}
              onChange={(e) => handleSliderChange('gain', parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#646A73] font-mono">
              <span>0 dB</span>
              <span className="text-[9px] text-[#9A9EA6]">2x click: 0 dB</span>
              <span>+24 dB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
