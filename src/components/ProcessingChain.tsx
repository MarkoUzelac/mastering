import React, { useState } from 'react';
import { Power, ArrowRight, Sliders, Activity, Sparkles, Volume2, ShieldAlert } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';
import { MasteringParams, MeterData } from '../types';

export interface ChainBypassState {
  eq: boolean;
  dynamics: boolean;
  saturation: boolean;
  stereo: boolean;
  limiter: boolean;
}

export interface AdvancedParamsState {
  // EQ
  lowFreq?: number;
  midFreq?: number;
  highFreq?: number;
  lowQ?: number;
  midQ?: number;
  highQ?: number;
  // Dynamics
  attack: number;
  release: number;
  knee: number;
  // Saturation
  drive: number;
  warmth: number;
  mix: number;
  // Stereo
  width: number;
  balance: number;
  phaseInvert?: boolean;
  // Limiter
  ceiling: number;
  limiterRelease: number;
  lookahead: number;
  truePeak?: boolean;
}

interface ProcessingChainProps {
  params: MasteringParams;
  advancedParams: AdvancedParamsState;
  bypasses?: ChainBypassState;
  isBypassed?: boolean;
  gainReductionDb?: number;
  meterData?: MeterData;
  isPlaying?: boolean;
  onParamChange: <K extends keyof MasteringParams>(key: K, value: MasteringParams[K]) => void;
  onAdvancedParamChange: <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => void;
  onToggleBypass?: (module: keyof ChainBypassState) => void;
  onOpenModuleModal?: (module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter') => void;
  onOpenAdvancedModal?: (module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter') => void;
}

export const ProcessingChain: React.FC<ProcessingChainProps> = ({
  params,
  advancedParams,
  bypasses: externalBypasses,
  isBypassed = false,
  gainReductionDb: externalGR,
  meterData,
  isPlaying = false,
  onParamChange,
  onAdvancedParamChange,
  onToggleBypass: externalToggleBypass,
  onOpenModuleModal,
  onOpenAdvancedModal,
}) => {
  const [internalBypasses, setInternalBypasses] = useState<ChainBypassState>({
    eq: false,
    dynamics: false,
    saturation: false,
    stereo: false,
    limiter: false,
  });

  const bypasses = externalBypasses || internalBypasses;
  const gr = meterData?.gainReductionDb !== undefined ? meterData.gainReductionDb : externalGR || 0;

  const handleToggle = (module: keyof ChainBypassState) => {
    if (externalToggleBypass) {
      externalToggleBypass(module);
    } else {
      setInternalBypasses((prev) => ({ ...prev, [module]: !prev[module] }));
    }
  };

  const handleOpenModal = (module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter') => {
    if (onOpenModuleModal) onOpenModuleModal(module);
    if (onOpenAdvancedModal) onOpenAdvancedModal(module);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 relative">
      {/* 1. EQUALIZER MODULE (CYAN) */}
      <div
        className={`relative flex flex-col justify-between bg-[#0D0E0C] border rounded-xl p-3.5 transition-all shadow-sm ${
          bypasses.eq || isBypassed ? 'border-[#1E232B] opacity-60' : 'border-[#222420] hover:border-[#06B6D4]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[#22D3EE] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            EQ
          </span>
          <button
            onClick={() => handleToggle('eq')}
            className={`p-1 rounded-md transition cursor-pointer ${
              bypasses.eq ? 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]' : 'text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20'
            }`}
            title={bypasses.eq ? 'Enable EQ Module' : 'Bypass EQ Module'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Frequency Curve Graph */}
        <div className="w-full h-16 bg-[#07090C] border border-[#181C22] rounded-lg relative overflow-hidden mb-3.5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 64" preserveAspectRatio="none">
            <line x1="0" y1="32" x2="160" y2="32" stroke="#1A2028" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="45" y1="0" x2="45" y2="64" stroke="#141920" strokeWidth="1" />
            <line x1="115" y1="0" x2="115" y2="64" stroke="#141920" strokeWidth="1" />

            {(() => {
              const lowY = 32 - (params.low / 12) * 20;
              const midY = 32 - (params.mid / 12) * 20;
              const highY = 32 - (params.high / 12) * 20;

              const pathD = `M 0,${lowY} C 40,${lowY} 50,${midY} 80,${midY} C 110,${midY} 120,${highY} 160,${highY}`;
              const fillD = `M 0,${lowY} C 40,${lowY} 50,${midY} 80,${midY} C 110,${midY} 120,${highY} 160,${highY} L 160,32 L 0,32 Z`;

              return (
                <>
                  <path d={fillD} fill="rgba(6, 182, 212, 0.08)" />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={bypasses.eq || isBypassed ? '#686A63' : '#06B6D4'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="25" cy={lowY} r="2.5" fill="#22D3EE" />
                  <circle cx="80" cy={midY} r="2.5" fill="#22D3EE" />
                  <circle cx="135" cy={highY} r="2.5" fill="#22D3EE" />
                </>
              );
            })()}
          </svg>
        </div>

        {/* 3 Rotary Knobs */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <RotaryKnob
            label="Low"
            value={params.low}
            min={-12}
            max={12}
            step={0.1}
            defaultValue={0}
            unit="dB"
            color="cyan"
            size="sm"
            disabled={bypasses.eq || isBypassed}
            onChange={(val) => onParamChange('low', val)}
          />
          <RotaryKnob
            label="Mid"
            value={params.mid}
            min={-12}
            max={12}
            step={0.1}
            defaultValue={0}
            unit="dB"
            color="cyan"
            size="sm"
            disabled={bypasses.eq || isBypassed}
            onChange={(val) => onParamChange('mid', val)}
          />
          <RotaryKnob
            label="High"
            value={params.high}
            min={-12}
            max={12}
            step={0.1}
            defaultValue={0}
            unit="dB"
            color="cyan"
            size="sm"
            disabled={bypasses.eq || isBypassed}
            onChange={(val) => onParamChange('high', val)}
          />
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => handleOpenModal('eq')}
          className="w-full py-1 text-[11px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition text-center cursor-pointer"
        >
          Advanced
        </button>
      </div>

      {/* 2. DYNAMICS MODULE (GREEN) */}
      <div
        className={`relative flex flex-col justify-between bg-[#0D0E0C] border rounded-xl p-3.5 transition-all shadow-sm ${
          bypasses.dynamics || isBypassed ? 'border-[#1E232B] opacity-60' : 'border-[#222420] hover:border-[#10B981]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[#34D399] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Dynamics
          </span>
          <button
            onClick={() => handleToggle('dynamics')}
            className={`p-1 rounded-md transition cursor-pointer ${
              bypasses.dynamics ? 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]' : 'text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20'
            }`}
            title={bypasses.dynamics ? 'Enable Dynamics Module' : 'Bypass Dynamics Module'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Compression Transfer Curve Graph */}
        <div className="w-full h-16 bg-[#07090C] border border-[#181C22] rounded-lg relative overflow-hidden mb-3.5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 64" preserveAspectRatio="none">
            <line x1="10" y1="54" x2="150" y2="10" stroke="#1A2028" strokeWidth="1" strokeDasharray="2 2" />

            {(() => {
              const threshRatio = (params.threshold + 60) / 60;
              const threshX = 10 + threshRatio * 140;
              const threshY = 54 - threshRatio * 44;

              const endX = 150;
              const slope = 1 / params.ratio;
              const deltaX = endX - threshX;
              const endY = threshY - (deltaX * (44 / 140)) * slope;

              const pathD = `M 10,54 L ${threshX},${threshY} L ${endX},${endY}`;

              return (
                <>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={bypasses.dynamics || isBypassed ? '#686A63' : '#10B981'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx={threshX} cy={threshY} r="3" fill="#34D399" />
                </>
              );
            })()}
          </svg>

          {/* Gain Reduction Meter Overlay on Right */}
          <div className="absolute right-1.5 top-1.5 bottom-1.5 w-1.5 bg-[#151714] rounded-full overflow-hidden flex flex-col justify-end">
            <div
              className="w-full bg-[#34D399] transition-all duration-75"
              style={{
                height: `${Math.min(100, Math.max(0, (gr / 12) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* 3 Rotary Knobs */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <RotaryKnob
            label="Threshold"
            value={params.threshold}
            min={-60}
            max={0}
            step={0.5}
            defaultValue={-24}
            unit="dB"
            color="green"
            size="sm"
            disabled={bypasses.dynamics || isBypassed}
            onChange={(val) => onParamChange('threshold', val)}
          />
          <RotaryKnob
            label="Ratio"
            value={params.ratio}
            min={1}
            max={20}
            step={0.1}
            defaultValue={3}
            displayValue={`${params.ratio.toFixed(1)}:1`}
            color="green"
            size="sm"
            disabled={bypasses.dynamics || isBypassed}
            onChange={(val) => onParamChange('ratio', val)}
          />
          <RotaryKnob
            label="Knee"
            value={advancedParams.knee}
            min={0}
            max={12}
            step={0.5}
            defaultValue={6}
            unit="dB"
            color="green"
            size="sm"
            disabled={bypasses.dynamics || isBypassed}
            onChange={(val) => onAdvancedParamChange('knee', val)}
          />
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => handleOpenModal('dynamics')}
          className="w-full py-1 text-[11px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition text-center cursor-pointer"
        >
          Advanced
        </button>
      </div>

      {/* 3. SATURATION MODULE (AMBER) */}
      <div
        className={`relative flex flex-col justify-between bg-[#0D0E0C] border rounded-xl p-3.5 transition-all shadow-sm ${
          bypasses.saturation || isBypassed ? 'border-[#1E232B] opacity-60' : 'border-[#222420] hover:border-[#F59E0B]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[#FBBF24] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Saturation
          </span>
          <button
            onClick={() => handleToggle('saturation')}
            className={`p-1 rounded-md transition cursor-pointer ${
              bypasses.saturation ? 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]' : 'text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20'
            }`}
            title={bypasses.saturation ? 'Enable Saturation Module' : 'Bypass Saturation Module'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Analog Harmonic Sine Wave Graph */}
        <div className="w-full h-16 bg-[#07090C] border border-[#181C22] rounded-lg relative overflow-hidden mb-3.5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 64" preserveAspectRatio="none">
            <line x1="0" y1="32" x2="160" y2="32" stroke="#1A2028" strokeWidth="1" strokeDasharray="3 3" />

            {(() => {
              const driveFactor = 1 + (advancedParams.drive / 100) * 2;
              let points = '';
              for (let i = 0; i <= 160; i += 2) {
                const normX = (i / 160) * Math.PI * 4;
                let rawY = Math.sin(normX) * driveFactor;
                let clippedY = Math.tanh(rawY);
                let plotY = 32 - clippedY * 22;
                points += `${i === 0 ? 'M' : 'L'} ${i},${plotY} `;
              }
              return (
                <path
                  d={points}
                  fill="none"
                  stroke={bypasses.saturation || isBypassed ? '#686A63' : '#F59E0B'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })()}
          </svg>
        </div>

        {/* 3 Rotary Knobs */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <RotaryKnob
            label="Drive"
            value={advancedParams.drive}
            min={0}
            max={100}
            step={1}
            defaultValue={15}
            unit="%"
            color="amber"
            size="sm"
            disabled={bypasses.saturation || isBypassed}
            onChange={(val) => onAdvancedParamChange('drive', val)}
          />
          <RotaryKnob
            label="Warmth"
            value={advancedParams.warmth}
            min={0}
            max={100}
            step={1}
            defaultValue={20}
            unit="%"
            color="amber"
            size="sm"
            disabled={bypasses.saturation || isBypassed}
            onChange={(val) => onAdvancedParamChange('warmth', val)}
          />
          <RotaryKnob
            label="Mix"
            value={advancedParams.mix}
            min={0}
            max={100}
            step={1}
            defaultValue={100}
            unit="%"
            color="amber"
            size="sm"
            disabled={bypasses.saturation || isBypassed}
            onChange={(val) => onAdvancedParamChange('mix', val)}
          />
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => handleOpenModal('saturation')}
          className="w-full py-1 text-[11px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition text-center cursor-pointer"
        >
          Advanced
        </button>
      </div>

      {/* 4. STEREO MODULE (VIOLET) */}
      <div
        className={`relative flex flex-col justify-between bg-[#0D0E0C] border rounded-xl p-3.5 transition-all shadow-sm ${
          bypasses.stereo || isBypassed ? 'border-[#1E232B] opacity-60' : 'border-[#222420] hover:border-[#B7F000]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[#C7FF18] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7F000]" />
            Stereo
          </span>
          <button
            onClick={() => handleToggle('stereo')}
            className={`p-1 rounded-md transition cursor-pointer ${
              bypasses.stereo ? 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]' : 'text-[#B7F000] bg-[#B7F000]/10 hover:bg-[#B7F000]/20'
            }`}
            title={bypasses.stereo ? 'Enable Stereo Module' : 'Bypass Stereo Module'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Stereo Width Vectorscope */}
        <div className="w-full h-16 bg-[#07090C] border border-[#181C22] rounded-lg relative overflow-hidden mb-3.5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 64" preserveAspectRatio="none">
            <line x1="80" y1="0" x2="80" y2="64" stroke="#1A2028" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="32" x2="160" y2="32" stroke="#1A2028" strokeWidth="1" strokeDasharray="3 3" />

            {(() => {
              const spreadX = 25 * (advancedParams.width / 100);
              const spreadY = 18;
              const balOffset = (advancedParams.balance / 100) * 30;

              return (
                <g transform={`translate(${80 + balOffset}, 32) rotate(45)`}>
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={spreadX}
                    ry={spreadY}
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke={bypasses.stereo || isBypassed ? '#686A63' : '#B7F000'}
                    strokeWidth="1.5"
                  />
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={spreadX * 0.5}
                    ry={spreadY * 0.6}
                    fill="none"
                    stroke="#D4FF5C"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            })()}
          </svg>
        </div>

        {/* 3 Rotary Knobs */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <RotaryKnob
            label="Width"
            value={advancedParams.width}
            min={0}
            max={200}
            step={1}
            defaultValue={100}
            unit="%"
            color="violet"
            size="sm"
            disabled={bypasses.stereo || isBypassed}
            onChange={(val) => onAdvancedParamChange('width', val)}
          />
          <RotaryKnob
            label="Balance"
            value={advancedParams.balance}
            min={-100}
            max={100}
            step={1}
            defaultValue={0}
            displayValue={
              advancedParams.balance === 0
                ? 'C'
                : `${advancedParams.balance > 0 ? 'R' : 'L'} ${Math.abs(advancedParams.balance)}`
            }
            color="violet"
            size="sm"
            disabled={bypasses.stereo || isBypassed}
            onChange={(val) => onAdvancedParamChange('balance', val)}
          />
          <div className="flex flex-col items-center select-none">
            <span className="text-[11px] font-medium text-[#A5A69F] tracking-tight mb-1 text-center">
              Phase
            </span>
            <button
              onClick={() => onAdvancedParamChange('phaseInvert', !advancedParams.phaseInvert)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border font-mono font-bold text-xs transition cursor-pointer ${
                advancedParams.phaseInvert
                  ? 'bg-[#B7F000] text-\[#F2F2EE\] border-[#C7FF18] shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                  : 'bg-[#0F1216] text-[#A5A69F] hover:text-[#F2F2EE] border-[#282E38]'
              }`}
              title="Phase Polarity Invert (ø)"
            >
              ø
            </button>
            <span className="text-[11px] font-mono font-medium text-[#E5E7EB] mt-1">
              {advancedParams.phaseInvert ? 'Inv' : 'Norm'}
            </span>
          </div>
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => handleOpenModal('stereo')}
          className="w-full py-1 text-[11px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition text-center cursor-pointer"
        >
          Advanced
        </button>
      </div>

      {/* 5. LIMITER MODULE (RED) */}
      <div
        className={`relative flex flex-col justify-between bg-[#0D0E0C] border rounded-xl p-3.5 transition-all shadow-sm ${
          bypasses.limiter || isBypassed ? 'border-[#1E232B] opacity-60' : 'border-[#222420] hover:border-[#EF4444]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[#F87171] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Limiter
          </span>
          <button
            onClick={() => handleToggle('limiter')}
            className={`p-1 rounded-md transition cursor-pointer ${
              bypasses.limiter ? 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]' : 'text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20'
            }`}
            title={bypasses.limiter ? 'Enable Limiter Module' : 'Bypass Limiter Module'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Brickwall Limiter Curve Graph */}
        <div className="w-full h-16 bg-[#07090C] border border-[#181C22] rounded-lg relative overflow-hidden mb-3.5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 160 64" preserveAspectRatio="none">
            <line x1="0" y1="18" x2="160" y2="18" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" />

            {(() => {
              let pathD = 'M 0,32 ';
              for (let i = 0; i <= 160; i += 4) {
                let wave = Math.sin((i / 160) * Math.PI * 6) * 26;
                let y = 32 - Math.max(-14, Math.min(14, wave));
                pathD += `L ${i},${y} `;
              }
              return (
                <path
                  d={pathD}
                  fill="none"
                  stroke={bypasses.limiter || isBypassed ? '#686A63' : '#EF4444'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })()}
          </svg>

          <div className="absolute top-1.5 left-2 text-[9px] font-mono text-[#F87171]">
            CEIL {advancedParams.ceiling.toFixed(1)} dB
          </div>
        </div>

        {/* 3 Rotary Knobs */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <RotaryKnob
            label="Ceiling"
            value={advancedParams.ceiling}
            min={-12}
            max={0}
            step={0.1}
            defaultValue={-1.0}
            unit="dB"
            color="red"
            size="sm"
            disabled={bypasses.limiter || isBypassed}
            onChange={(val) => onAdvancedParamChange('ceiling', val)}
          />
          <RotaryKnob
            label="Release"
            value={advancedParams.limiterRelease}
            min={10}
            max={500}
            step={5}
            defaultValue={80}
            unit="ms"
            color="red"
            size="sm"
            disabled={bypasses.limiter || isBypassed}
            onChange={(val) => onAdvancedParamChange('limiterRelease', val)}
          />
          <RotaryKnob
            label="Lookahead"
            value={advancedParams.lookahead}
            min={0.1}
            max={10}
            step={0.1}
            defaultValue={1.0}
            unit="ms"
            color="red"
            size="sm"
            disabled={bypasses.limiter || isBypassed}
            onChange={(val) => onAdvancedParamChange('lookahead', val)}
          />
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => handleOpenModal('limiter')}
          className="w-full py-1 text-[11px] font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition text-center cursor-pointer"
        >
          Advanced
        </button>
      </div>
    </div>
  );
};
