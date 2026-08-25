import React, { useState } from 'react';
import { X, Layers, Volume2, VolumeX, Sliders, Play, Pause } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';

interface StemTrack {
  id: string;
  name: string;
  category: 'drums' | 'bass' | 'instruments' | 'vocals';
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

interface StemsModalProps {
  onClose: () => void;
}

export const StemsModal: React.FC<StemsModalProps> = ({ onClose }) => {
  const [stems, setStems] = useState<StemTrack[]>([
    { id: '1', name: 'Drums & Percussion', category: 'drums', gain: 0, pan: 0, muted: false, solo: false },
    { id: '2', name: 'Sub & Bassline', category: 'bass', gain: 0, pan: 0, muted: false, solo: false },
    { id: '3', name: 'Instruments & Synths', category: 'instruments', gain: 0, pan: 0, muted: false, solo: false },
    { id: '4', name: 'Lead & Backing Vocals', category: 'vocals', gain: 0, pan: 0, muted: false, solo: false },
  ]);

  const updateStem = (id: string, updates: Partial<StemTrack>) => {
    setStems((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E1116] border border-[#1E2530] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2530] bg-[#0A0C0F]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F4F3EF]">Stem Mastering Engine</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#8B5CF6] text-white">
                  PRO FEATURE
                </span>
              </div>
              <p className="text-[11px] text-[#646A73]">Multi-track stem summing with independent bus control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {stems.map((stem) => (
            <div
              key={stem.id}
              className="bg-[#07090C] border border-[#181C22] rounded-xl p-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#14171B] border border-[#24282D] flex items-center justify-center font-mono font-bold text-xs text-[#8B5CF6]">
                  {stem.name[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F4F3EF]">{stem.name}</div>
                  <div className="text-[10px] font-mono text-[#646A73] uppercase">{stem.category}</div>
                </div>
              </div>

              {/* Mute / Solo */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateStem(stem.id, { muted: !stem.muted })}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    stem.muted ? 'bg-[#EF4444] text-white' : 'bg-[#14171B] text-[#9A9EA6] hover:text-[#F4F3EF]'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => updateStem(stem.id, { solo: !stem.solo })}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    stem.solo ? 'bg-[#F59E0B] text-black' : 'bg-[#14171B] text-[#9A9EA6] hover:text-[#F4F3EF]'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Fader Knobs */}
              <div className="flex items-center gap-4">
                <RotaryKnob
                  label="Gain"
                  value={stem.gain}
                  min={-12}
                  max={12}
                  unit="dB"
                  color="violet"
                  size="sm"
                  onChange={(v) => updateStem(stem.id, { gain: v })}
                />
                <RotaryKnob
                  label="Pan"
                  value={stem.pan}
                  min={-100}
                  max={100}
                  displayValue={stem.pan === 0 ? 'C' : `${stem.pan > 0 ? 'R' : 'L'} ${Math.abs(stem.pan)}`}
                  color="violet"
                  size="sm"
                  onChange={(v) => updateStem(stem.id, { pan: v })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E2530] bg-[#0A0C0F] flex items-center justify-between">
          <span className="text-[11px] text-[#646A73] font-mono">Summed into master DSP pipeline in 64-bit IEEE 754</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition shadow-md cursor-pointer"
          >
            Apply Stems
          </button>
        </div>
      </div>
    </div>
  );
};
