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
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222420] bg-[#0A0C0F]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#B7F000]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F2F2EE]">Stem Mastering Engine</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#B7F000] text-\[#F2F2EE\]">
                  PRO FEATURE
                </span>
              </div>
              <p className="text-[11px] text-[#686A63]">Multi-track stem summing with independent bus control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#151714] transition cursor-pointer"
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
                <div className="w-8 h-8 rounded-lg bg-[#151714] border border-[#222420] flex items-center justify-center font-mono font-bold text-xs text-[#B7F000]">
                  {stem.name[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F2F2EE]">{stem.name}</div>
                  <div className="text-[10px] font-mono text-[#686A63] uppercase">{stem.category}</div>
                </div>
              </div>

              {/* Mute / Solo */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateStem(stem.id, { muted: !stem.muted })}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    stem.muted ? 'bg-[#EF4444] text-\[#F2F2EE\]' : 'bg-[#151714] text-[#A5A69F] hover:text-[#F2F2EE]'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => updateStem(stem.id, { solo: !stem.solo })}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    stem.solo ? 'bg-[#F59E0B] text-black' : 'bg-[#151714] text-[#A5A69F] hover:text-[#F2F2EE]'
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
        <div className="px-5 py-3 border-t border-[#222420] bg-[#0A0C0F] flex items-center justify-between">
          <span className="text-[11px] text-[#686A63] font-mono">Summed into master DSP pipeline in 64-bit IEEE 754</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-\[#F2F2EE\] bg-[#B7F000] hover:bg-[#7C3AED] rounded-lg transition shadow-md cursor-pointer"
          >
            Apply Stems
          </button>
        </div>
      </div>
    </div>
  );
};
