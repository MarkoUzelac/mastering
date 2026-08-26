import React, { useState } from 'react';
import { Power, Settings2 } from 'lucide-react';
import { PhosphorSlider } from './PhosphorSlider';
import { audioEngineEvents } from '../utils/audio-engine';
import { MasteringParams, MeterData } from '../types';

export interface ChainBypassState {
  eq: boolean;
  dynamics: boolean;
  saturation: boolean;
  stereo: boolean;
  limiter: boolean;
}

export interface AdvancedParamsState {
  lowFreq?: number;
  midFreq?: number;
  highFreq?: number;
  lowQ?: number;
  midQ?: number;
  highQ?: number;
  attack: number;
  release: number;
  knee: number;
  drive: number;
  warmth: number;
  mix: number;
  width: number;
  balance: number;
  phaseInvert?: boolean;
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
  onOpenAdvancedModal?: (module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter') => void;
}

export const ProcessingChain: React.FC<ProcessingChainProps> = ({
  params,
  advancedParams,
  bypasses: externalBypasses,
  isBypassed = false,
  gainReductionDb: externalGR,
  meterData,
  onParamChange,
  onAdvancedParamChange,
  onToggleBypass: externalToggleBypass,
  onOpenAdvancedModal,
}) => {
  const [internalBypasses, setInternalBypasses] = useState<ChainBypassState>({
    eq: false, dynamics: false, saturation: false, stereo: false, limiter: false,
  });

  const bypasses = externalBypasses || internalBypasses;
  const [localMeters, setLocalMeters] = React.useState<any>(null);
  React.useEffect(() => {
    const handler = (e: any) => setLocalMeters(e.detail);
    audioEngineEvents.addEventListener('meterupdate', handler);
    return () => audioEngineEvents.removeEventListener('meterupdate', handler);
  }, []);
  const activeMeters = localMeters || meterData;
  const gr = activeMeters?.gainReductionDb !== undefined ? activeMeters?.gainReductionDb : externalGR || 0;

  const handleToggle = (module: keyof ChainBypassState) => {
    if (externalToggleBypass) {
      externalToggleBypass(module);
    } else {
      setInternalBypasses((prev) => ({ ...prev, [module]: !prev[module] }));
    }
  };

  const getContainerStyle = (isBypassedLocal: boolean) => 
    `relative flex flex-col bg-transparent border border-[var(--border-subtle)] p-5 transition-all ${
      isBypassedLocal || isBypassed ? 'opacity-40' : 'hover:border-[var(--text-tertiary)]'
    }`;

  const getHeader = (title: string, module: keyof ChainBypassState) => (
    <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--border-subtle)]">
      <span className="text-[10px] font-mono tracking-widest text-[var(--text-primary)] uppercase">{title}</span>
      <div className="flex gap-2">
        {onOpenAdvancedModal && (
          <button 
            onClick={() => onOpenAdvancedModal(module as any)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => handleToggle(module)}
          className={`transition ${bypasses[module] ? 'text-[var(--text-tertiary)]' : 'text-[var(--accent-lime)]'}`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2">
        <h3 className="text-[10px] font-mono tracking-widest text-[var(--text-primary)] uppercase">
          MASTER CHAIN / 03
        </h3>
        <div className="flex gap-4">
          <span className="text-[10px] font-mono tracking-widest text-[var(--accent-lime)]">SHAPE THE SIGNAL</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 border border-[var(--border-subtle)] divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
        
        {/* TONE */}
        <div className={getContainerStyle(bypasses.eq) + " border-0"}>
          {getHeader('TONE', 'eq')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider
              label="Low" value={params.low} min={-12} max={12} step={0.1} unit=" dB"
              disabled={bypasses.eq || isBypassed}
              onChange={(val) => onParamChange('low', val)}
            />
            <PhosphorSlider
              label="Mid" value={params.mid} min={-12} max={12} step={0.1} unit=" dB"
              disabled={bypasses.eq || isBypassed}
              onChange={(val) => onParamChange('mid', val)}
            />
            <PhosphorSlider
              label="High" value={params.high} min={-12} max={12} step={0.1} unit=" dB"
              disabled={bypasses.eq || isBypassed}
              onChange={(val) => onParamChange('high', val)}
            />
          </div>
        </div>

        {/* DYNAMICS */}
        <div className={getContainerStyle(bypasses.dynamics) + " border-0"}>
          {getHeader('COMPRESSION', 'dynamics')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider
              label="Threshold" value={params.threshold} min={-60} max={0} step={0.5} unit=" dB"
              disabled={bypasses.dynamics || isBypassed}
              onChange={(val) => onParamChange('threshold', val)}
            />
            <PhosphorSlider
              label="Ratio" value={params.ratio} min={1} max={20} step={0.1} displayValue={`${params.ratio.toFixed(1)}:1`}
              disabled={bypasses.dynamics || isBypassed}
              onChange={(val) => onParamChange('ratio', val)}
            />
            <PhosphorSlider
              label="Knee" value={advancedParams.knee} min={0} max={12} step={0.5} unit=" dB"
              disabled={bypasses.dynamics || isBypassed}
              onChange={(val) => onAdvancedParamChange('knee', val)}
            />
          </div>
          {gr < -0.1 && !bypasses.dynamics && !isBypassed && (
            <div className="mt-6 flex justify-between items-center text-[10px] font-mono text-[var(--accent-lime)]">
              <span>GR</span>
              <span>{gr.toFixed(1)} dB</span>
            </div>
          )}
        </div>

        {/* SATURATION */}
        <div className={getContainerStyle(bypasses.saturation) + " border-0"}>
          {getHeader('SATURATION', 'saturation')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider
              label="Drive" value={advancedParams.drive} min={0} max={100} step={1} unit="%"
              disabled={bypasses.saturation || isBypassed}
              onChange={(val) => onAdvancedParamChange('drive', val)}
            />
            <PhosphorSlider
              label="Warmth" value={advancedParams.warmth} min={0} max={100} step={1} unit="%"
              disabled={bypasses.saturation || isBypassed}
              onChange={(val) => onAdvancedParamChange('warmth', val)}
            />
            <PhosphorSlider
              label="Mix" value={advancedParams.mix} min={0} max={100} step={1} unit="%"
              disabled={bypasses.saturation || isBypassed}
              onChange={(val) => onAdvancedParamChange('mix', val)}
            />
          </div>
        </div>

        {/* STEREO */}
        <div className={getContainerStyle(bypasses.stereo) + " border-0"}>
          {getHeader('STEREO', 'stereo')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider
              label="Width" value={advancedParams.width} min={0} max={200} step={1} unit="%"
              disabled={bypasses.stereo || isBypassed}
              onChange={(val) => onAdvancedParamChange('width', val)}
            />
            <PhosphorSlider
              label="Balance" value={advancedParams.balance} min={-100} max={100} step={1}
              disabled={bypasses.stereo || isBypassed}
              onChange={(val) => onAdvancedParamChange('balance', val)}
            />
          </div>
        </div>

        {/* LIMITER */}
        <div className={getContainerStyle(bypasses.limiter) + " border-0"}>
          {getHeader('LIMITER', 'limiter')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider
              label="Ceiling" value={advancedParams.ceiling} min={-12} max={0} step={0.1} unit=" dB"
              disabled={bypasses.limiter || isBypassed}
              onChange={(val) => onAdvancedParamChange('ceiling', val)}
            />
            <PhosphorSlider
              label="Release" value={advancedParams.limiterRelease} min={10} max={500} step={5} unit=" ms"
              disabled={bypasses.limiter || isBypassed}
              onChange={(val) => onAdvancedParamChange('limiterRelease', val)}
            />
            <PhosphorSlider
              label="Lookahead" value={advancedParams.lookahead} min={0.1} max={10} step={0.1} unit=" ms"
              disabled={bypasses.limiter || isBypassed}
              onChange={(val) => onAdvancedParamChange('lookahead', val)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
