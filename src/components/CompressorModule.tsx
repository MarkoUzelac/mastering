import React, { useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { MasteringParams } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface CompressorModuleProps {
  params: MasteringParams;
  onChange: (param: keyof MasteringParams, value: number) => void;
  onReset?: () => void;
  gainReduction?: number;
  gainReductionDb?: number;
  isBypassed: boolean;
}

export const CompressorModule: React.FC<CompressorModuleProps> = ({
  params,
  onChange,
  onReset,
  gainReduction,
  gainReductionDb,
  isBypassed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grHistoryRef = useRef<number[]>(new Array(60).fill(0));

  const effectiveGR = gainReductionDb !== undefined ? gainReductionDb : (gainReduction || 0);

  const handleResetAll = () => {
    soundHaptics.playResetSound();
    if (onReset) {
      onReset();
    } else {
      onChange('threshold', -24);
      onChange('ratio', 2.0);
      onChange('gain', 0);
    }
  };

  const handleSliderChange = (param: keyof MasteringParams, value: number) => {
    onChange(param, value);
    soundHaptics.playSliderTick(1200 + value * 20);
  };

  const handleDoubleClickReset = (param: keyof MasteringParams, defaultVal: number) => {
    onChange(param, defaultVal);
    soundHaptics.playResetSound();
  };

  // Dynamic Gain Reduction real-time trace
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Shift history
    const history = grHistoryRef.current;
    history.shift();
    const currentGR = isBypassed ? 0 : effectiveGR;
    history.push(currentGR);

    // Draw background
    ctx.fillStyle = '#090A08';
    ctx.fillRect(0, 0, width, height);

    // Grid lines for 0dB, -6dB, -12dB, -18dB
    ctx.strokeStyle = '#181C22';
    ctx.lineWidth = 1;
    for (let y = 0; y <= height; y += height / 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw GR Curve Fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * width;
      const gr = history[i];
      const y = Math.min(height, (gr / 18) * height);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(214, 175, 98, 0.18)';
    ctx.fill();

    // Outline curve
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * width;
      const gr = history[i];
      const y = Math.min(height, (gr / 18) * height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#B7F000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [effectiveGR, isBypassed]);

  return (
    <div className="bg-[#0E1013] border border-[#222420] rounded-sm p-4 flex flex-col justify-between h-full relative group shadow-lg">
      {/* Rack corner bolt aesthetic */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#222420] border border-[#151714]" />

      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-[#222420] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-[#F2F2EE] uppercase font-mono">
            COMPRESSOR
          </span>
          <span className="text-[9px] font-mono text-[#B7F000] bg-[#1C170E] px-1.5 py-0.5 rounded border border-[#B7F000]/20">
            STEREO FEEDBACK
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
          title="Reset Compressor parameters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-start">
        {/* Left: Parameter Sliders */}
        <div className="space-y-3.5">
          {/* Threshold */}
          <div
            onDoubleClick={() => handleDoubleClickReset('threshold', -24)}
            className="group/slider select-none cursor-pointer"
            title="Double-click to reset (-24.0 dB)"
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-[#A5A69F] group-hover/slider:text-[#B7F000] transition-colors">
                Threshold
              </span>
              <span className="font-semibold text-[#F2F2EE] num-tabular bg-[#151714] px-1.5 py-0.2 rounded border border-[#222420]">
                {params.threshold.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-48"
              max="0"
              step="0.5"
              value={params.threshold}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('threshold', -24)}
              onChange={(e) => handleSliderChange('threshold', parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[#686A63] mt-0.5">
              <span>-48 dB</span>
              <span className="text-[8px]">2x click: -24dB</span>
              <span>0 dB</span>
            </div>
          </div>

          {/* Ratio */}
          <div
            onDoubleClick={() => handleDoubleClickReset('ratio', 2.0)}
            className="group/slider select-none cursor-pointer"
            title="Double-click to reset (2.0:1)"
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-[#A5A69F] group-hover/slider:text-[#B7F000] transition-colors">
                Ratio
              </span>
              <span className="font-semibold text-[#F2F2EE] num-tabular bg-[#151714] px-1.5 py-0.2 rounded border border-[#222420]">
                {params.ratio.toFixed(1)} : 1
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={params.ratio}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('ratio', 2.0)}
              onChange={(e) => handleSliderChange('ratio', parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[#686A63] mt-0.5">
              <span>1.0:1</span>
              <span className="text-[8px]">2x click: 2.0:1</span>
              <span>10:1</span>
            </div>
          </div>

          {/* Makeup Gain */}
          <div
            onDoubleClick={() => handleDoubleClickReset('gain', 0.0)}
            className="group/slider select-none cursor-pointer"
            title="Double-click to reset (0.0 dB)"
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-[#A5A69F] group-hover/slider:text-[#B7F000] transition-colors">
                Makeup Gain
              </span>
              <span className="font-semibold text-[#B7F000] num-tabular bg-[#151714] px-1.5 py-0.2 rounded border border-[#222420]">
                +{params.gain.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={params.gain}
              disabled={isBypassed}
              onDoubleClick={() => handleDoubleClickReset('gain', 0.0)}
              onChange={(e) => handleSliderChange('gain', parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[#686A63] mt-0.5">
              <span>0 dB</span>
              <span className="text-[8px]">2x click: 0dB</span>
              <span>+12 dB</span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Gain Reduction Graph */}
        <div className="flex flex-col h-full justify-between space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#A5A69F] uppercase tracking-wider">GAIN REDUCTION</span>
            <span className="text-[#B7F000] font-semibold num-tabular">
              {effectiveGR > 0.1 ? `-${effectiveGR.toFixed(1)} dB` : '0.0 dB'}
            </span>
          </div>

          {/* Real-time GR Canvas */}
          <div className="w-full h-24 rounded-sm bg-[#090A08] border border-[#222420] overflow-hidden relative shadow-inner">
            <canvas ref={canvasRef} width={200} height={96} className="w-full h-full block" />
            <div className="absolute left-1.5 top-1 text-[8px] font-mono text-[#686A63]">0 dB</div>
            <div className="absolute left-1.5 bottom-1 text-[8px] font-mono text-[#686A63]">-18 dB</div>
            <div className="absolute right-1.5 top-1 text-[8px] font-mono text-[#B7F000]/70">REALTIME TRACE</div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#686A63]">
            <span>Attack: 20 ms</span>
            <span>Release: 240 ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
