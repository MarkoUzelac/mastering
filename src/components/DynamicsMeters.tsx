import React from 'react';
import { MeterData } from '../types';
import { Zap, Volume2, ShieldAlert } from 'lucide-react';

interface DynamicsMetersProps {
  meterData: MeterData;
  isBypassed: boolean;
}

export const DynamicsMeters: React.FC<DynamicsMetersProps> = ({
  meterData,
  isBypassed,
}) => {
  const linearToDb = (val: number) => {
    if (val <= 0.0001) return -60;
    const db = 20 * Math.log10(val);
    return Math.max(-60, Math.min(6, db));
  };

  const dbToPercent = (db: number) => {
    const clamped = Math.max(-60, Math.min(0, db));
    return ((clamped + 60) / 60) * 100;
  };

  const inPeakL = linearToDb(meterData.inputPeakL);
  const inPeakR = linearToDb(meterData.inputPeakR);
  const inRmsL = linearToDb(meterData.inputRmsL);
  const inRmsR = linearToDb(meterData.inputRmsR);

  const outPeakL = linearToDb(meterData.outputPeakL);
  const outPeakR = linearToDb(meterData.outputPeakR);
  const outRmsL = linearToDb(meterData.outputRmsL);
  const outRmsR = linearToDb(meterData.outputRmsR);

  const grPercent = Math.min(100, (meterData.gainReductionDb / 18) * 100);

  const renderChannelMeter = (peakDb: number, rmsDb: number, label: string) => {
    const peakPct = dbToPercent(peakDb);
    const rmsPct = dbToPercent(rmsDb);
    const isClipping = peakDb >= -0.1;
    const isLimiting = peakDb >= -1.05 && peakDb <= -0.95;

    return (
      <div className="flex flex-col items-center gap-1.5 flex-1">
        <span className="text-[10px] font-mono text-[#00aa44] font-semibold">{label}</span>
        <div className="w-full max-w-[28px] h-36 bg-[#030d06] rounded p-1 flex flex-col justify-end relative border border-[#0f4020]">
          {/* Scale Ticks */}
          <div className="absolute inset-x-0 top-[0%] h-px bg-[#ff3333]/60 z-10" title="0 dBFS" />
          <div className="absolute inset-x-0 top-[16.6%] h-px bg-[#ffaa00]/40 z-10" title="-10 dBFS" />
          <div className="absolute inset-x-0 top-[33.3%] h-px bg-[#00ff66]/30 z-10" title="-20 dBFS" />
          <div className="absolute inset-x-0 top-[66.6%] h-px bg-[#00aa44]/20 z-10" title="-40 dBFS" />

          {/* Peak Hold Bar */}
          <div
            className={`w-full absolute inset-x-0 h-1 z-20 transition-all duration-75 ${
              isClipping
                ? 'bg-[#ff3333] shadow-sm shadow-[#ff3333]'
                : isLimiting
                ? 'bg-[#ffaa00] shadow-sm shadow-[#ffaa00]'
                : 'bg-[#ffffff] shadow-sm shadow-[#ffffff]'
            }`}
            style={{ bottom: `${peakPct}%` }}
          />

          {/* Phosphor RMS Level Fill */}
          <div
            className="w-full rounded-sm bg-gradient-to-t from-[#006622] via-[#00cc55] to-[#00ff66] transition-all duration-75 shadow-sm shadow-[#00ff66]/30"
            style={{ height: `${rmsPct}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono font-bold ${isClipping ? 'text-[#ff5555]' : 'text-[#00ff66]'}`}>
          {peakDb > -60 ? `${peakDb.toFixed(1)}` : '-inf'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-[#07170c] rounded-xl p-4 border border-[#0d381c] shadow-lg flex flex-col justify-between crt-overlay h-full">
      <div className="flex items-center justify-between border-b border-[#0d381c] pb-2 mb-3">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#00ff66] flex items-center gap-1.5 glow-phosphor">
          <Volume2 className="w-3.5 h-3.5" />
          Dynamics & Peak Meters
        </span>
        {meterData.limiterActive && !isBypassed && (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#ffaa00] bg-[#ffaa00]/10 px-2 py-0.5 rounded border border-[#ffaa00]/40 animate-pulse">
            <Zap className="w-3 h-3 fill-[#ffaa00]" />
            LIMITER ENGAGED
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 items-end">
        {/* Input Meters */}
        <div className="bg-[#030d06] p-2.5 rounded-lg border border-[#0f4020] flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase font-bold text-[#00aa44] mb-2">INPUT SIGNAL</span>
          <div className="flex gap-2 w-full justify-center">
            {renderChannelMeter(inPeakL, inRmsL, 'L')}
            {renderChannelMeter(inPeakR, inRmsR, 'R')}
          </div>
        </div>

        {/* Gain Reduction (GR) Meter */}
        <div className="bg-[#030d06] p-2.5 rounded-lg border border-[#0f4020] flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase font-bold text-[#ffaa00] mb-2">GAIN RED.</span>
          <div className="w-full max-w-[36px] h-36 bg-[#030d06] rounded p-1 flex flex-col justify-start relative border border-[#0f4020]">
            {/* GR Fill going downwards */}
            <div
              className="w-full rounded-sm bg-gradient-to-b from-[#ffaa00] to-[#ff3333] transition-all duration-75 shadow-sm shadow-[#ffaa00]/40"
              style={{ height: `${grPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-[#ffaa00] mt-1.5">
            {meterData.gainReductionDb > 0.05 ? `-${meterData.gainReductionDb.toFixed(1)} dB` : '0.0 dB'}
          </span>
        </div>

        {/* Output Meters */}
        <div className="bg-[#030d06] p-2.5 rounded-lg border border-[#0f4020] flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase font-bold text-[#00ff66] mb-2">MASTER OUT</span>
          <div className="flex gap-2 w-full justify-center">
            {renderChannelMeter(outPeakL, outRmsL, 'L')}
            {renderChannelMeter(outPeakR, outRmsR, 'R')}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#0d381c] flex items-center justify-between text-[11px] text-[#00cc55] font-mono">
        <span>Ceiling: -1.0 dBFS</span>
        <span className={meterData.gainReductionDb > 0 ? 'text-[#ffaa00] font-bold' : 'text-[#00aa44]'}>
          {meterData.gainReductionDb > 0 ? `Dynamic Compression` : 'Linear Processing'}
        </span>
      </div>
    </div>
  );
};
