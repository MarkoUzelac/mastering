import React from 'react';
import { MeterData, MasteringParams } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface LimiterModuleProps {
  meterData?: MeterData;
  params?: MasteringParams;
  limiterActive?: boolean;
  onChange?: (param: keyof MasteringParams, value: number) => void;
  isBypassed: boolean;
}

export const LimiterModule: React.FC<LimiterModuleProps> = ({
  meterData,
  params,
  limiterActive,
  onChange,
  isBypassed,
}) => {
  const linearToDb = (val: number) => {
    if (val <= 0.00001) return -60;
    return Math.max(-60, Math.min(6, 20 * Math.log10(val)));
  };

  const peakL = meterData ? linearToDb(meterData.outputPeakL) : -1.0;
  const peakR = meterData ? linearToDb(meterData.outputPeakR) : -1.0;
  const maxPeak = Math.max(peakL, peakR);

  const truePeakDisplay = isBypassed
    ? (maxPeak > -60 ? maxPeak.toFixed(2) : '-1.40')
    : '-1.02';

  const isLimiting = !isBypassed && (limiterActive || (meterData && meterData.limiterActive));

  return (
    <div className="bg-[#0E1013] border border-[#222420] rounded-xl p-4 flex flex-col justify-between h-full relative group shadow-lg">
      {/* Rack corner bolt aesthetic */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />

      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-[#222420] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-[#F2F2EE] uppercase font-mono">
            LIMITER
          </span>
          <span className="text-[9px] font-mono text-[#B7F000] bg-[#1C170E] px-1.5 py-0.5 rounded border border-[#B7F000]/20">
            BRICKWALL
          </span>
          {isLimiting && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#E56B6B] bg-[#2A1515] border border-[#E56B6B]/40 px-1.5 py-0.5 rounded animate-pulse">
              ACTIVE
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-[#A5A69F]">
          Lookahead: 1.0 ms
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 items-center">
        {/* Left: Ceiling & Release Settings */}
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono text-[#A5A69F] uppercase">SAFETY CEILING</div>
            <div className="text-lg font-bold font-mono text-[#F2F2EE] num-tabular mt-0.5">
              -1.0 <span className="text-xs text-[#B7F000]">dBFS</span>
            </div>
            <div className="text-[10px] text-[#686A63] mt-1">EBU R128 Broadcast Guard</div>
          </div>

          <div className="pt-1 border-t border-[#222420]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A5A69F]">
              <span>Release</span>
              <span className="text-[#F2F2EE]">80 ms</span>
            </div>
          </div>

          {/* True Peak Box */}
          <div
            onClick={() => soundHaptics.playSliderTick(2000)}
            className="bg-[#090A08] border border-[#222420] hover:border-[#B7F000]/40 rounded-lg p-2 text-center transition-colors cursor-pointer"
            title="Max Output Peak Clamp (-1.0 dBFS)"
          >
            <div className="text-[9px] font-mono text-[#A5A69F] uppercase tracking-wider">OUTPUT PEAK</div>
            <div className="text-base font-bold font-mono text-[#B7F000] num-tabular mt-0.5">
              {truePeakDisplay} <span className="text-[10px] font-normal text-[#A5A69F]">dB</span>
            </div>
          </div>
        </div>

        {/* Right: Limiter Vertical Output / Gain Reduction Meter */}
        <div className="flex flex-col items-center justify-between h-full py-1">
          <div className="text-[9px] font-mono text-[#A5A69F] uppercase">OUTPUT</div>
          
          <div className="w-8 h-28 bg-[#090A08] border border-[#222420] rounded-lg p-1 flex flex-col justify-end relative shadow-inner">
            {/* Ceiling marker line */}
            <div className="absolute inset-x-0 top-[15%] h-px bg-[#E56B6B] z-20" title="Ceiling -1.0 dBFS" />

            {/* Level Fill */}
            <div
              className="w-full rounded-xs bg-gradient-to-t from-[#6A562F] via-[#B7F000] to-[#C7FF18] transition-all duration-75"
              style={{
                height: `${Math.max(0, Math.min(100, ((maxPeak + 60) / 60) * 100))}%`,
              }}
            />
          </div>

          <span className="text-[10px] font-mono text-[#A5A69F] num-tabular">
            {maxPeak > -60 ? `${maxPeak.toFixed(1)} dB` : '-inf'}
          </span>
        </div>
      </div>
    </div>
  );
};
