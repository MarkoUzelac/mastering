import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Sliders, Activity, Info, BarChart2, Shield } from 'lucide-react';
import { MeterData } from '../types';

interface RightAnalysisPanelProps {
  meterData: MeterData;
  isPlaying: boolean;
  targetLufs?: number;
  referencePlatform?: string;
  onOpenLoudnessDetails: () => void;
  onOpenReferenceModal: () => void;
}

export const RightAnalysisPanel: React.FC<RightAnalysisPanelProps> = ({
  meterData,
  isPlaying,
  targetLufs = -14.0,
  referencePlatform = 'Spotify',
  onOpenLoudnessDetails,
  onOpenReferenceModal,
}) => {
  const [meterMode, setMeterMode] = useState<'TP' | 'Peak' | 'RMS'>('TP');

  const correlationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute live L & R meter values based on audio activity
  const outL = isPlaying
    ? Math.max(-60, Math.min(0, 20 * Math.log10(Math.max(0.0001, meterData.outputPeakL))))
    : -60;
  const outR = isPlaying
    ? Math.max(-60, Math.min(0, 20 * Math.log10(Math.max(0.0001, meterData.outputPeakR))))
    : -60;

  const integratedLufs = isPlaying && meterData.integratedLufs ? meterData.integratedLufs : -10.8;
  const shortTermLufs = isPlaying && meterData.momentaryLufs ? meterData.momentaryLufs : -9.7;
  const loudnessRange = isPlaying ? 1.6 : 1.6;
  const truePeakDb = isPlaying ? (outL > -60 ? outL + 0.1 : -0.9) : -0.9;

  // Real-time animated Phase Correlation Cloud
  useEffect(() => {
    const canvas = correlationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#07090C';
      ctx.fillRect(0, 0, w, h);

      // Grid Axes
      ctx.strokeStyle = '#181C22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Draw particle cloud for stereo correlation
      const numPoints = isPlaying ? 36 : 18;
      angle += 0.04;

      ctx.fillStyle = 'rgba(139, 92, 246, 0.75)';
      for (let i = 0; i < numPoints; i++) {
        const seed = i * 1.34 + angle;
        const radius = isPlaying ? 12 + Math.sin(seed * 2) * 8 : 6 + Math.sin(seed) * 3;
        const px = w / 2 + Math.cos(seed) * radius * (isPlaying ? 1.4 : 1.0);
        const py = h / 2 + Math.sin(seed * 1.5) * radius * (isPlaying ? 1.2 : 0.8);

        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Lissajous main curve
      ctx.strokeStyle = isPlaying ? 'rgba(167, 139, 250, 0.6)' : 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.15) {
        const lx = w / 2 + Math.sin(t * 2 + angle) * (isPlaying ? 16 : 8);
        const ly = h / 2 + Math.cos(t * 3 + angle) * (isPlaying ? 14 : 7);
        if (t === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.closePath();
      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying]);

  // dB scale tick marks
  const DB_TICKS = [0, -3, -6, -9, -12, -18, -24, -30, -36, -60];

  const getMeterSegmentClass = (db: number, currentDb: number) => {
    if (currentDb < db) return 'bg-[#181C22]';
    if (db >= -1) return 'bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.8)]';
    if (db >= -6) return 'bg-[#F59E0B] shadow-[0_0_4px_rgba(245,158,11,0.6)]';
    return 'bg-[#10B981] shadow-[0_0_4px_rgba(16,185,129,0.5)]';
  };

  return (
    <div className="w-full flex flex-col gap-3 shrink-0">
      {/* 1. OUTPUT METER */}
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wide text-[#F2F2EE]">Output Meter</span>
          <div className="flex items-center gap-1 bg-[#151714] border border-[#222420] rounded-md px-1.5 py-0.5">
            <select
              value={meterMode}
              onChange={(e) => setMeterMode(e.target.value as any)}
              className="bg-transparent text-[11px] font-mono text-[#B7F000] focus:outline-none cursor-pointer"
            >
              <option value="TP" className="bg-[#0D0E0C] text-[#F2F2EE]">TP</option>
              <option value="Peak" className="bg-[#0D0E0C] text-[#F2F2EE]">Peak</option>
              <option value="RMS" className="bg-[#0D0E0C] text-[#F2F2EE]">RMS</option>
            </select>
          </div>
        </div>

        {/* Dual LED Meter Ladders */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center bg-[#07090C] border border-[#181C22] rounded-sm p-2.5">
          {/* L Channel */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-center text-[#686A63]">L</span>
            <div className="flex flex-col gap-0.5 h-36 justify-between">
              {DB_TICKS.map((db, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 rounded-xs transition-colors duration-75 ${getMeterSegmentClass(db, outL)}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono text-center text-[#E5E7EB] mt-1 tabular-nums">
              {outL <= -60 ? '-∞' : `${outL.toFixed(1)}`}
            </span>
          </div>

          {/* Central dB Scale Labels */}
          <div className="flex flex-col justify-between h-36 py-0.5 text-[9px] font-mono text-[#686A63] text-center select-none">
            <span>0</span>
            <span>-3</span>
            <span>-6</span>
            <span>-9</span>
            <span>-12</span>
            <span>-18</span>
            <span>-24</span>
            <span>-30</span>
            <span>-36</span>
            <span>-∞</span>
          </div>

          {/* R Channel */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-center text-[#686A63]">R</span>
            <div className="flex flex-col gap-0.5 h-36 justify-between">
              {DB_TICKS.map((db, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 rounded-xs transition-colors duration-75 ${getMeterSegmentClass(db, outR)}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono text-center text-[#E5E7EB] mt-1 tabular-nums">
              {outR <= -60 ? '-∞' : `${outR.toFixed(1)}`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LOUDNESS TELEMETRY */}
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-[#F2F2EE]">Loudness</span>
          <span className="text-[10px] font-mono text-[#B7F000] px-1.5 py-0.5 bg-[#B7F000]/10 rounded border border-[#B7F000]/20">
            EBU R128
          </span>
        </div>

        {/* Big Bold Integrated Readout */}
        <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-2.5 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-[#686A63] uppercase tracking-wider mb-0.5">
            Integrated
          </span>
          <div className="text-2xl font-mono font-bold text-[#F2F2EE] tracking-tight">
            {integratedLufs.toFixed(1)}{' '}
            <span className="text-xs font-medium text-[#B7F000]">LUFS</span>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-1.5">
            <div className="text-[9px] font-mono text-[#686A63]">Short Term</div>
            <div className="text-xs font-mono font-semibold text-[#E5E7EB] mt-0.5">
              {shortTermLufs.toFixed(1)}
            </div>
          </div>
          <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-1.5">
            <div className="text-[9px] font-mono text-[#686A63]">Range</div>
            <div className="text-xs font-mono font-semibold text-[#E5E7EB] mt-0.5">
              {loudnessRange.toFixed(1)} LU
            </div>
          </div>
          <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-1.5">
            <div className="text-[9px] font-mono text-[#686A63]">True Peak</div>
            <div className="text-xs font-mono font-semibold text-[#E5E7EB] mt-0.5">
              {truePeakDb.toFixed(1)} dB
            </div>
          </div>
        </div>

        <button
          onClick={onOpenLoudnessDetails}
          className="w-full py-1 text-xs font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-sm transition text-center cursor-pointer"
        >
          Loudness Details
        </button>
      </div>

      {/* 3. REFERENCE TARGET */}
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-[#F2F2EE]">Reference</span>
          <span className="text-[10px] font-mono text-[#686A63]">TARGET MATCH</span>
        </div>

        <div className="flex items-center justify-between bg-[#07090C] border border-[#181C22] rounded-sm p-2">
          <div>
            <div className="text-xs font-semibold text-[#F2F2EE]">{referencePlatform}</div>
            <div className="text-[10px] font-mono text-[#B7F000]">
              {targetLufs.toFixed(1)} LUFS
            </div>
          </div>

          <button
            onClick={onOpenReferenceModal}
            className="p-1.5 rounded-md bg-[#1C162E] hover:bg-[#271E42] text-[#C7FF18] border border-[#B7F000]/40 transition cursor-pointer"
            title="Change Target Reference"
          >
            <Check className="w-3.5 h-3.5 text-[#B7F000]" />
          </button>
        </div>
      </div>

      {/* 4. CORRELATION (GONIOMETER) */}
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-[#F2F2EE]">Correlation</span>
          <span className="text-[10px] font-mono text-[#686A63]">PHASE CLOUD</span>
        </div>

        <div className="w-full h-20 bg-[#07090C] border border-[#181C22] rounded-sm overflow-hidden relative">
          <canvas
            ref={correlationCanvasRef}
            width={260}
            height={80}
            className="w-full h-full block"
          />
        </div>

        {/* Phase Scale Labels */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#686A63]">
          <span>-1</span>
          <span>0</span>
          <span>+1</span>
        </div>
      </div>

      {/* 5. BALANCE */}
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-[#F2F2EE]">Balance</span>
          <span className="text-[10px] font-mono text-[#E5E7EB] tabular-nums">0.02</span>
        </div>

        {/* Horizontal Balance Fader Track */}
        <div className="relative w-full h-2 bg-[#07090C] border border-[#181C22] rounded-full overflow-hidden flex items-center justify-center">
          <div className="w-0.5 h-full bg-[#343A46]" />
          {/* Indicator Dot */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-[#B7F000] shadow-[0_0_6px_rgba(139,92,246,0.8)]"
            style={{ left: 'calc(50% + 2px)' }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#686A63]">
          <span>L</span>
          <span>C</span>
          <span>R</span>
        </div>
      </div>
    </div>
  );
};
