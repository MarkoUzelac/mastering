import React, { useEffect, useState } from 'react';
import { Power, Settings2 } from 'lucide-react';
import { PhosphorSlider } from './PhosphorSlider';
import { audioEngine, audioEngineEvents } from '../utils/audio-engine';
import { MasteringParams, MeterData } from '../types';

export interface ChainBypassState { eq: boolean; dynamics: boolean; saturation: boolean; stereo: boolean; limiter: boolean; }

export interface AdvancedParamsState {
  lowFreq?: number; midFreq?: number; highFreq?: number; lowQ?: number; midQ?: number; highQ?: number;
  attack: number; release: number; knee: number; drive: number; warmth: number; mix: number; width: number;
  balance: number; phaseInvert?: boolean; ceiling: number; limiterRelease: number; lookahead: number; truePeak?: boolean;
}

interface ProcessingChainProps {
  params: MasteringParams; advancedParams: AdvancedParamsState; bypasses?: ChainBypassState; isBypassed?: boolean;
  gainReductionDb?: number; meterData?: MeterData; isPlaying?: boolean;
  onParamChange: <K extends keyof MasteringParams>(key: K, value: MasteringParams[K]) => void;
  onAdvancedParamChange: <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => void;
  onToggleBypass?: (module: keyof ChainBypassState) => void;
  onOpenAdvancedModal?: (module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter') => void;
}

export const ProcessingChain: React.FC<ProcessingChainProps> = ({ params, advancedParams, bypasses: externalBypasses, isBypassed = false, gainReductionDb: externalGR, meterData, onParamChange, onAdvancedParamChange, onToggleBypass: externalToggleBypass, onOpenAdvancedModal }) => {
  const [internalBypasses, setInternalBypasses] = useState<ChainBypassState>({ eq: false, dynamics: false, saturation: false, stereo: false, limiter: false });
  const [localMeters, setLocalMeters] = useState<MeterData | null>(null);
  const bypasses = externalBypasses || internalBypasses;

  useEffect(() => {
    const handler = (event: Event) => setLocalMeters((event as CustomEvent<MeterData>).detail);
    audioEngineEvents.addEventListener('meterupdate', handler);
    return () => audioEngineEvents.removeEventListener('meterupdate', handler);
  }, []);

  useEffect(() => {
    // Hard-flush every advanced control into the same live DSP parameter state.
    audioEngine.setParams(advancedParams as Partial<MasteringParams>);
  }, [advancedParams]);

  const activeMeters = localMeters || meterData;
  const gr = activeMeters?.gainReductionDb ?? externalGR ?? 0;

  const handleToggle = (module: keyof ChainBypassState) => {
    if (externalToggleBypass) externalToggleBypass(module);
    else setInternalBypasses((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const handleAdvanced = <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => {
    onAdvancedParamChange(key, value);
  };

  const header = (title: string, module: keyof ChainBypassState) => (
    <div className="mb-5 flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">{title}</span>
      <div className="flex gap-2">
        {onOpenAdvancedModal && <button type="button" aria-label={`${title} advanced`} onClick={() => onOpenAdvancedModal(module as any)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Settings2 className="h-3.5 w-3.5" /></button>}
        <button type="button" aria-label={`${title} bypass`} onClick={() => handleToggle(module)} className={`transition ${bypasses[module] ? 'text-[var(--text-tertiary)]' : 'text-[var(--accent-lime)]'}`}><Power className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );

  const disabled = (module: keyof ChainBypassState) => bypasses[module] || isBypassed;

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <div className="flex min-w-0 items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">MASTER CHAIN / 03</h3>
        <span className="text-[10px] font-mono tracking-widest text-[var(--accent-lime)]">REAL DSP</span>
      </div>
      <div className="grid min-w-0 grid-cols-1 divide-y border border-[var(--border-subtle)] md:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        <div className="min-w-0 border-0 p-5">
          {header('TONE', 'eq')}
          <div className="flex flex-col gap-5">
            {(['low','mid','high'] as const).map((key) => <PhosphorSlider key={key} label={key} value={params[key]} min={-12} max={12} step={0.1} unit=" dB" disabled={disabled('eq')} onChange={(v) => onParamChange(key, v)} />)}
          </div>
        </div>
        <div className="min-w-0 border-0 p-5">
          {header('COMPRESSION', 'dynamics')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider label="Threshold" value={params.threshold} min={-60} max={0} step={0.5} unit=" dB" disabled={disabled('dynamics')} onChange={(v) => onParamChange('threshold', v)} />
            <PhosphorSlider label="Ratio" value={params.ratio} min={1} max={20} step={0.1} displayValue={`${params.ratio.toFixed(1)}:1`} disabled={disabled('dynamics')} onChange={(v) => onParamChange('ratio', v)} />
            <PhosphorSlider label="Makeup Gain" value={params.gain} min={-12} max={12} step={0.1} unit=" dB" disabled={disabled('dynamics')} onChange={(v) => onParamChange('gain', v)} />
            <PhosphorSlider label="Knee" value={advancedParams.knee} min={0} max={12} step={0.5} unit=" dB" disabled={disabled('dynamics')} onChange={(v) => handleAdvanced('knee', v)} />
            <PhosphorSlider label="Attack" value={advancedParams.attack} min={1} max={200} step={1} unit=" ms" disabled={disabled('dynamics')} onChange={(v) => handleAdvanced('attack', v)} />
            <PhosphorSlider label="Release" value={advancedParams.release} min={10} max={1000} step={5} unit=" ms" disabled={disabled('dynamics')} onChange={(v) => handleAdvanced('release', v)} />
          </div>
          {gr > 0.1 && !disabled('dynamics') && <div className="mt-5 flex justify-between text-[10px] font-mono text-[var(--accent-lime)]"><span>GR</span><span>{gr.toFixed(1)} dB</span></div>}
        </div>
        <div className="min-w-0 border-0 p-5">
          {header('SATURATION', 'saturation')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider label="Drive" value={advancedParams.drive} min={0} max={100} step={1} unit="%" disabled={disabled('saturation')} onChange={(v) => handleAdvanced('drive', v)} />
            <PhosphorSlider label="Warmth" value={advancedParams.warmth} min={0} max={100} step={1} unit="%" disabled={disabled('saturation')} onChange={(v) => handleAdvanced('warmth', v)} />
            <PhosphorSlider label="Mix" value={advancedParams.mix} min={0} max={100} step={1} unit="%" disabled={disabled('saturation')} onChange={(v) => handleAdvanced('mix', v)} />
          </div>
        </div>
        <div className="min-w-0 border-0 p-5">
          {header('STEREO', 'stereo')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider label="Width" value={advancedParams.width} min={0} max={200} step={1} unit="%" disabled={disabled('stereo')} onChange={(v) => handleAdvanced('width', v)} />
            <PhosphorSlider label="Balance" value={advancedParams.balance} min={-100} max={100} step={1} unit="%" disabled={disabled('stereo')} onChange={(v) => handleAdvanced('balance', v)} />
          </div>
        </div>
        <div className="min-w-0 border-0 p-5">
          {header('LIMITER', 'limiter')}
          <div className="flex flex-col gap-5">
            <PhosphorSlider label="Ceiling" value={advancedParams.ceiling} min={-12} max={0} step={0.1} unit=" dB" disabled={disabled('limiter')} onChange={(v) => handleAdvanced('ceiling', v)} />
            <PhosphorSlider label="Release" value={advancedParams.limiterRelease} min={10} max={500} step={5} unit=" ms" disabled={disabled('limiter')} onChange={(v) => handleAdvanced('limiterRelease', v)} />
            {advancedParams.truePeak !== false && <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2 text-[9px] font-mono text-[var(--text-tertiary)]">4× FIR peak estimate active · no user lookahead</div>}
          </div>
        </div>
      </div>
    </section>
  );
};
