import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MasteringParams } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface EqualizerModuleProps {
  params: MasteringParams;
  onChange: (param: keyof MasteringParams, value: number) => void;
  onReset?: () => void;
  isBypassed: boolean;
}

export const EqualizerModule: React.FC<EqualizerModuleProps> = ({
  params,
  onChange,
  onReset,
  isBypassed,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lowFreq] = useState(120);
  const [midFreq] = useState(1200);
  const [highFreq] = useState(8500);
  const [midQ] = useState(0.8);

  const handleResetAll = () => {
    soundHaptics.playResetSound();
    if (onReset) {
      onReset();
    } else {
      onChange('low', 0);
      onChange('mid', 0);
      onChange('high', 0);
    }
  };

  const handleSliderChange = (param: keyof MasteringParams, value: number) => {
    onChange(param, value);
    soundHaptics.playSliderTick(1400 + value * 40);
  };

  const handleDoubleClickReset = (param: keyof MasteringParams, defaultVal = 0) => {
    onChange(param, defaultVal);
    soundHaptics.playResetSound();
  };

  return (
    <div className="bg-[#0E1013] border border-[#222420] rounded-xl p-4 flex flex-col justify-between h-full relative group shadow-lg">
      {/* Rack corner bolt aesthetic */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />

      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-[#222420] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-[#F2F2EE] uppercase font-mono">
            EQUALIZER
          </span>
          <span className="text-[9px] font-mono text-[#B7F000] bg-[#1C170E] px-1.5 py-0.5 rounded border border-[#B7F000]/20">
            DF2T 64-BIT
          </span>
          {isBypassed && (
            <span className="text-[9px] font-mono text-[#686A63] bg-[#151714] px-1.5 py-0.5 rounded">
              OFF
            </span>
          )}
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1 text-[11px] text-[#A5A69F] hover:text-[#B7F000] transition cursor-pointer"
          title="Reset EQ to neutral 0.0 dB"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3-Band Fader Rack */}
      <div className="grid grid-cols-3 gap-3 flex-1 items-end pt-1">
        {/* LOW BAND */}
        <div
          className="flex flex-col items-center gap-2 select-none group/band"
          onDoubleClick={() => handleDoubleClickReset('low', 0)}
          title="Double-click to reset (0.0 dB)"
        >
          <div className="text-center cursor-pointer">
            <div className="text-[10px] font-mono font-medium text-[#A5A69F] group-hover/band:text-[#B7F000] transition-colors uppercase">
              LOW
            </div>
            <div className="text-[10px] font-mono text-[#686A63]">{lowFreq} Hz</div>
            <div className="text-xs font-mono font-semibold text-[#F2F2EE] num-tabular mt-0.5 bg-[#151714] px-1.5 py-0.5 rounded border border-[#222420]">
              {params.low >= 0 ? `+${params.low.toFixed(1)}` : params.low.toFixed(1)} dB
            </div>
          </div>

          {/* Fader Track */}
          <div className="relative h-28 flex items-center justify-center py-1">
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.low}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('low', 0)}
              onChange={(e) => handleSliderChange('low', parseFloat(e.target.value))}
              className="fader-vertical cursor-pointer"
            />
          </div>
          <span className="text-[9px] font-mono text-[#686A63] group-hover/band:text-[#A5A69F] transition-colors">
            2x click: 0dB
          </span>
        </div>

        {/* MID BAND */}
        <div
          className="flex flex-col items-center gap-2 select-none group/band"
          onDoubleClick={() => handleDoubleClickReset('mid', 0)}
          title="Double-click to reset (0.0 dB)"
        >
          <div className="text-center cursor-pointer">
            <div className="text-[10px] font-mono font-medium text-[#A5A69F] group-hover/band:text-[#B7F000] transition-colors uppercase">
              MID
            </div>
            <div className="text-[10px] font-mono text-[#686A63]">{(midFreq / 1000).toFixed(2)} kHz</div>
            <div className="text-xs font-mono font-semibold text-[#F2F2EE] num-tabular mt-0.5 bg-[#151714] px-1.5 py-0.5 rounded border border-[#222420]">
              {params.mid >= 0 ? `+${params.mid.toFixed(1)}` : params.mid.toFixed(1)} dB
            </div>
          </div>

          {/* Fader Track */}
          <div className="relative h-28 flex items-center justify-center py-1">
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.mid}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('mid', 0)}
              onChange={(e) => handleSliderChange('mid', parseFloat(e.target.value))}
              className="fader-vertical cursor-pointer"
            />
          </div>
          <span className="text-[9px] font-mono text-[#686A63] group-hover/band:text-[#A5A69F] transition-colors">
            2x click: 0dB
          </span>
        </div>

        {/* HIGH BAND */}
        <div
          className="flex flex-col items-center gap-2 select-none group/band"
          onDoubleClick={() => handleDoubleClickReset('high', 0)}
          title="Double-click to reset (0.0 dB)"
        >
          <div className="text-center cursor-pointer">
            <div className="text-[10px] font-mono font-medium text-[#A5A69F] group-hover/band:text-[#B7F000] transition-colors uppercase">
              HIGH
            </div>
            <div className="text-[10px] font-mono text-[#686A63]">{(highFreq / 1000).toFixed(2)} kHz</div>
            <div className="text-xs font-mono font-semibold text-[#F2F2EE] num-tabular mt-0.5 bg-[#151714] px-1.5 py-0.5 rounded border border-[#222420]">
              {params.high >= 0 ? `+${params.high.toFixed(1)}` : params.high.toFixed(1)} dB
            </div>
          </div>

          {/* Fader Track */}
          <div className="relative h-28 flex items-center justify-center py-1">
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.high}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('high', 0)}
              onChange={(e) => handleSliderChange('high', parseFloat(e.target.value))}
              className="fader-vertical cursor-pointer"
            />
          </div>
          <span className="text-[9px] font-mono text-[#686A63] group-hover/band:text-[#A5A69F] transition-colors">
            2x click: 0dB
          </span>
        </div>
      </div>

      {/* Advanced Toggle */}
      <div className="mt-3 pt-2 border-t border-[#222420] flex justify-end">
        <button
          onClick={() => {
            soundHaptics.playSwitchSound(!advancedOpen);
            setAdvancedOpen(!advancedOpen);
          }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1B1F24] border border-[#222420] rounded transition cursor-pointer"
        >
          <span>Specs</span>
          {advancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Advanced Parametric Drawer */}
      {advancedOpen && (
        <div className="mt-2.5 pt-2 border-t border-[#222420] space-y-1.5 text-[11px] font-mono animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[#686A63]">Low Shelf Freq</span>
            <span className="text-[#F2F2EE]">{lowFreq} Hz</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#686A63]">Mid Bell Q</span>
            <span className="text-[#F2F2EE]">{midQ.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#686A63]">High Shelf Slope</span>
            <span className="text-[#F2F2EE]">12 dB/oct</span>
          </div>
        </div>
      )}
    </div>
  );
};
