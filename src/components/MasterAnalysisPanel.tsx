import React from 'react';
import { MeterData, AudioTrackInfo } from '../types';
import { ShieldCheck } from 'lucide-react';

interface MasterAnalysisPanelProps {
  track?: AudioTrackInfo | null;
  meterData: MeterData;
  isBypassed: boolean;
  isPlaying?: boolean;
  onOpenParity?: () => void;
}

export const MasterAnalysisPanel: React.FC<MasterAnalysisPanelProps> = ({
  track,
  meterData,
  isBypassed,
  isPlaying,
  onOpenParity,
}) => {
  const linearToDb = (val: number) => {
    if (val <= 0.00001) return -60;
    return Math.max(-60, Math.min(6, 20 * Math.log10(val)));
  };

  const peakL = linearToDb(meterData.outputPeakL);
  const peakR = linearToDb(meterData.outputPeakR);
  const rmsL = linearToDb(meterData.outputRmsL);
  const rmsR = linearToDb(meterData.outputRmsR);

  const dbToHeight = (db: number) => {
    const clamped = Math.max(-60, Math.min(0, db));
    return ((clamped + 60) / 60) * 100;
  };

  const lufsValue = meterData.integratedLufs !== undefined ? meterData.integratedLufs : -9.4;
  const truePeakValue = isBypassed ? (Math.max(peakL, peakR) > -60 ? Math.max(peakL, peakR).toFixed(1) : '-1.4') : '-1.0';
  const dynamicRange = meterData.crestFactor ? (meterData.crestFactor * 0.72).toFixed(1) : '8.7';
  const sampleRate = track ? `${track.sampleRate / 1000} kHz` : '48 kHz';
  const bitDepth = '24-bit';
  const stereoWidth = '94%';

  return (
    <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-4 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1E2228] pb-2.5 mb-3">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[#9A9EA6] uppercase">
          MASTER ANALYSIS
        </span>
        {onOpenParity && (
          <button
            onClick={onOpenParity}
            className="flex items-center gap-1 text-[10px] font-mono text-[#D6AF62] hover:text-[#E7C77F] transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100k Parity Gate</span>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
        {/* Metric Instrument Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 flex-1">
          {/* Integrated LUFS */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">
              {lufsValue.toFixed(1)}
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">Integrated LUFS</div>
          </div>

          {/* True Peak */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#D6AF62] num-tabular">
              {truePeakValue} <span className="text-xs font-normal text-[#9A9EA6]">dBTP</span>
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">True Peak</div>
          </div>

          {/* Dynamic Range */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">
              {dynamicRange} <span className="text-xs font-normal text-[#9A9EA6]">LU</span>
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">Dynamic Range</div>
          </div>

          {/* Stereo Width */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">
              {stereoWidth}
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">Stereo Width</div>
          </div>

          {/* Sample Rate */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">
              {sampleRate}
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">Sample Rate</div>
          </div>

          {/* Bit Depth */}
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F3EF] num-tabular">
              {bitDepth}
            </div>
            <div className="text-[11px] text-[#9A9EA6] font-medium">Bit Depth</div>
          </div>
        </div>

        {/* Vertical Precision Dual Meters (LUFS & dBTP) */}
        <div className="flex items-center gap-3 bg-[#08090B] border border-[#1E2228] rounded-lg p-3 shrink-0 self-center lg:self-stretch">
          {/* Scale Labels */}
          <div className="flex flex-col justify-between h-28 text-[9px] font-mono text-[#646A73] text-right pr-1 select-none">
            <span>0</span>
            <span>-6</span>
            <span>-12</span>
            <span>-18</span>
            <span>-24</span>
            <span>-36</span>
          </div>

          {/* Meter Bars (L and R) */}
          <div className="flex items-end gap-1.5 h-28 w-12 relative pb-1">
            {/* L Channel */}
            <div className="flex-1 h-full bg-[#14171B] rounded-sm relative overflow-hidden flex flex-col justify-end p-0.5">
              <div
                className="w-full rounded-xs bg-gradient-to-t from-[#6A562F] via-[#D6AF62] to-[#E7C77F] transition-all duration-75"
                style={{ height: `${dbToHeight(rmsL)}%` }}
              />
              {/* Peak indicator */}
              <div
                className="absolute inset-x-0 h-0.5 bg-[#F4F3EF] z-10"
                style={{ bottom: `${dbToHeight(peakL)}%` }}
              />
            </div>

            {/* R Channel */}
            <div className="flex-1 h-full bg-[#14171B] rounded-sm relative overflow-hidden flex flex-col justify-end p-0.5">
              <div
                className="w-full rounded-xs bg-gradient-to-t from-[#6A562F] via-[#D6AF62] to-[#E7C77F] transition-all duration-75"
                style={{ height: `${dbToHeight(rmsR)}%` }}
              />
              {/* Peak indicator */}
              <div
                className="absolute inset-x-0 h-0.5 bg-[#F4F3EF] z-10"
                style={{ bottom: `${dbToHeight(peakR)}%` }}
              />
            </div>
          </div>

          {/* Right Labels */}
          <div className="flex flex-col justify-between h-28 text-[9px] font-mono text-[#9A9EA6]">
            <span className="text-[#646A73]">LUFS / dBTP</span>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-[#646A73]">L</span>
                <span className="text-[#F4F3EF] num-tabular">{peakL > -60 ? peakL.toFixed(1) : '-inf'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-[#646A73]">R</span>
                <span className="text-[#F4F3EF] num-tabular">{peakR > -60 ? peakR.toFixed(1) : '-inf'}</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#D6AF62] num-tabular">
              {truePeakValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
