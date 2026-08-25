import React from 'react';
import { PhosphorTheme } from '../types';
import { Settings, X, Palette, Cpu, Sparkles, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: PhosphorTheme;
  onThemeChange: (theme: PhosphorTheme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
}) => {
  if (!isOpen) return null;

  const themes: { id: PhosphorTheme; name: string; desc: string; color: string }[] = [
    {
      id: 'p1-green',
      name: 'Phosphor P1 Emerald CRT',
      desc: 'Classic 1980s green cathode ray tube monochrome terminal glow (#00FF66)',
      color: '#00ff66',
    },
    {
      id: 'p3-amber',
      name: 'Phosphor P3 Amber CRT',
      desc: 'Warm amber monochrome laboratory oscilloscope glow (#FFAA00)',
      color: '#ffaa00',
    },
    {
      id: 'cyan-studio',
      name: 'Cyberpunk Studio Cyan',
      desc: 'High-contrast studio mastering interface with vibrant spectral meters (#00E5FF)',
      color: '#00e5ff',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#030a05]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#07170c] border border-[#0d381c] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden crt-overlay">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d381c] bg-[#030d06]/80">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#00ff66]" />
            <h3 className="text-base font-bold text-[#00ff66] glow-phosphor">
              Studio Configuration & CRT Themes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#00aa44] hover:text-[#00ff66] p-1 rounded-sm hover:bg-[#0f4020] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Theme selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#00dd55] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#00ff66]" />
              CRT Display Theme
            </label>
            <div className="space-y-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`w-full p-3.5 rounded-sm border text-left flex items-start gap-3 transition cursor-pointer ${
                    currentTheme === t.id
                      ? 'bg-[#0f4020]/60 border-[#00ff66] text-[#e2fce9] shadow-md shadow-[#00ff66]/10'
                      : 'bg-[#030d06] border-[#0d381c] text-[#00aa44] hover:bg-[#071c0e]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0 border border-black/40 shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-\[#F2F2EE\] block mb-0.5">
                      {t.name}
                    </span>
                    <span className="text-[11px] text-[#00aa44] block font-mono">
                      {t.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Engine Specs */}
          <div className="bg-[#030d06] p-3.5 rounded-sm border border-[#0f4020] text-xs font-mono space-y-1.5 text-[#00cc55]">
            <div className="font-bold text-[#00ff66] flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5" />
              DSP Architecture Specifications:
            </div>
            <div>• Sample Format: Float32 audio graph, Float64 internal DSP</div>
            <div>• Filter Topology: Direct Form II Transposed (DF2T) Biquad</div>
            <div>• Comp/Limiter: Stereo-linked detector with true peak ceiling</div>
            <div>• Parity Benchmark: Bit-accurate JS & C++/WASM reference test</div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2 border-t border-[#0d381c]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-[#00ff66] hover:bg-[#00dd55] text-[#030d06] rounded-sm shadow-lg shadow-[#00ff66]/20 transition cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
