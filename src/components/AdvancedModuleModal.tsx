import React from 'react';
import { X, Sliders, Check, Power, Activity } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';
import { MasteringParams } from '../types';
import { AdvancedParamsState } from './ProcessingChain';

interface AdvancedModuleModalProps {
  module: 'eq' | 'dynamics' | 'saturation' | 'stereo' | 'limiter' | null;
  params: MasteringParams;
  advancedParams: AdvancedParamsState;
  onClose: () => void;
  onParamChange: <K extends keyof MasteringParams>(key: K, value: MasteringParams[K]) => void;
  onAdvancedParamChange: <K extends keyof AdvancedParamsState>(key: K, value: AdvancedParamsState[K]) => void;
}

export const AdvancedModuleModal: React.FC<AdvancedModuleModalProps> = ({
  module,
  params,
  advancedParams,
  onClose,
  onParamChange,
  onAdvancedParamChange,
}) => {
  if (!module) return null;

  const titles = {
    eq: { name: 'Equalizer Deep-Dive', color: '#06B6D4', text: 'Parametric Shelf & Surgical Peak Filters' },
    dynamics: { name: 'Dynamics Precision Control', color: '#10B981', text: 'VCA / Optical Envelope & Knee Shaping' },
    saturation: { name: 'Harmonic Saturation Engine', color: '#F59E0B', text: 'Triode / Pentode Analog Coloration' },
    stereo: { name: 'Stereo Field & Mid/Side', color: '#B7F000', text: 'Vectorscope Width & Mono Sub Crossover' },
    limiter: { name: 'Brickwall True-Peak Limiter', color: '#EF4444', text: 'Inter-Sample Peak Ceiling & Lookahead' },
  }[module];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-sm w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222420] bg-[#0A0C0F]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: titles.color }}
            />
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2EE]">{titles.name}</h3>
              <p className="text-[11px] text-[#686A63]">{titles.text}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#151714] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Based on Module */}
        <div className="p-5 space-y-4">
          {module === 'eq' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <span className="text-[11px] font-mono text-[#06B6D4] mb-2 font-semibold">Low Band</span>
                  <RotaryKnob
                    label="Gain"
                    value={params.low}
                    min={-12}
                    max={12}
                    unit="dB"
                    color="cyan"
                    onChange={(v) => onParamChange('low', v)}
                  />
                  <div className="mt-3 w-full text-center">
                    <span className="text-[10px] text-[#686A63]">Freq: 80 Hz Shelf</span>
                  </div>
                </div>

                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <span className="text-[11px] font-mono text-[#06B6D4] mb-2 font-semibold">Mid Band</span>
                  <RotaryKnob
                    label="Gain"
                    value={params.mid}
                    min={-12}
                    max={12}
                    unit="dB"
                    color="cyan"
                    onChange={(v) => onParamChange('mid', v)}
                  />
                  <div className="mt-3 w-full text-center">
                    <span className="text-[10px] text-[#686A63]">Freq: 1.2 kHz Peak</span>
                  </div>
                </div>

                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <span className="text-[11px] font-mono text-[#06B6D4] mb-2 font-semibold">High Band</span>
                  <RotaryKnob
                    label="Gain"
                    value={params.high}
                    min={-12}
                    max={12}
                    unit="dB"
                    color="cyan"
                    onChange={(v) => onParamChange('high', v)}
                  />
                  <div className="mt-3 w-full text-center">
                    <span className="text-[10px] text-[#686A63]">Freq: 10 kHz Air</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">Linear Phase Processing</div>
                  <div className="text-[11px] text-[#686A63]">Zero phase shift across frequency crossovers</div>
                </div>
                <span className="px-2 py-1 rounded bg-[#06B6D4]/10 text-[#22D3EE] font-mono text-[11px] border border-[#06B6D4]/20">
                  Active 64-bit
                </span>
              </div>
            </div>
          )}

          {module === 'dynamics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Threshold"
                    value={params.threshold}
                    min={-60}
                    max={0}
                    unit="dB"
                    color="green"
                    onChange={(v) => onParamChange('threshold', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Ratio"
                    value={params.ratio}
                    min={1}
                    max={20}
                    displayValue={`${params.ratio.toFixed(1)}:1`}
                    color="green"
                    onChange={(v) => onParamChange('ratio', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Knee"
                    value={advancedParams.knee}
                    min={0}
                    max={12}
                    unit="dB"
                    color="green"
                    onChange={(v) => onAdvancedParamChange('knee', v)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Attack"
                    value={advancedParams.attack}
                    min={0.1}
                    max={100}
                    unit="ms"
                    color="green"
                    onChange={(v) => onAdvancedParamChange('attack', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Release"
                    value={advancedParams.release}
                    min={10}
                    max={1000}
                    unit="ms"
                    color="green"
                    onChange={(v) => onAdvancedParamChange('release', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {module === 'saturation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Drive"
                    value={advancedParams.drive}
                    min={0}
                    max={100}
                    unit="%"
                    color="amber"
                    onChange={(v) => onAdvancedParamChange('drive', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Warmth"
                    value={advancedParams.warmth}
                    min={0}
                    max={100}
                    unit="%"
                    color="amber"
                    onChange={(v) => onAdvancedParamChange('warmth', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Dry/Wet"
                    value={advancedParams.mix}
                    min={0}
                    max={100}
                    unit="%"
                    color="amber"
                    onChange={(v) => onAdvancedParamChange('mix', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {module === 'stereo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Stereo Width"
                    value={advancedParams.width}
                    min={0}
                    max={200}
                    unit="%"
                    color="violet"
                    onChange={(v) => onAdvancedParamChange('width', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Balance"
                    value={advancedParams.balance}
                    min={-100}
                    max={100}
                    displayValue={advancedParams.balance === 0 ? 'C' : `${advancedParams.balance > 0 ? 'R' : 'L'} ${Math.abs(advancedParams.balance)}`}
                    color="violet"
                    onChange={(v) => onAdvancedParamChange('balance', v)}
                  />
                </div>
              </div>

              <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">Mono Bass Below 120 Hz</div>
                  <div className="text-[11px] text-[#686A63]">Sums sub frequencies to center for tight vinyl/club playback</div>
                </div>
                <span className="px-2 py-1 rounded bg-[#B7F000]/10 text-[#C7FF18] font-mono text-[11px] border border-[#B7F000]/20">
                  Enabled
                </span>
              </div>
            </div>
          )}

          {module === 'limiter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Ceiling"
                    value={advancedParams.ceiling}
                    min={-12}
                    max={0}
                    unit="dB"
                    color="red"
                    onChange={(v) => onAdvancedParamChange('ceiling', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Release"
                    value={advancedParams.limiterRelease}
                    min={10}
                    max={500}
                    unit="ms"
                    color="red"
                    onChange={(v) => onAdvancedParamChange('limiterRelease', v)}
                  />
                </div>
                <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex flex-col items-center">
                  <RotaryKnob
                    label="Lookahead"
                    value={advancedParams.lookahead}
                    min={0.1}
                    max={10}
                    unit="ms"
                    color="red"
                    onChange={(v) => onAdvancedParamChange('lookahead', v)}
                  />
                </div>
              </div>

              <div className="bg-[#07090C] p-3 rounded-sm border border-[#181C22] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#F2F2EE]">True Peak ISP Oversampling</div>
                  <div className="text-[11px] text-[#686A63]">Prevents D/A converter clipping during streaming encode</div>
                </div>
                <span className="px-2 py-1 rounded bg-[#EF4444]/10 text-[#F87171] font-mono text-[11px] border border-[#EF4444]/20">
                  4x True Peak
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#222420] bg-[#0A0C0F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-\[#F2F2EE\] bg-[#B7F000] hover:bg-[#7C3AED] rounded-sm transition shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
