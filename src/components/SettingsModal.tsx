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
      id: 'phosphor-dark',
      name: 'Phosphor Dark',
      desc: 'Deep carbon obsidian chassis, precision neon lime indicators, and sharp typographic layouts.',
      color: '#090A08',
    },
    {
      id: 'phosphor-light',
      name: 'Phosphor Light',
      desc: 'Crisp bright environment, minimal borders, and high-contrast typography.',
      color: '#F5F5F3',
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#030a05]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xs w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[var(--accent-lime)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Studio Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--accent-lime)] p-1 rounded-xs transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Theme selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[var(--accent-lime)]" />
              Display Theme
            </label>
            <div className="space-y-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`w-full p-3.5 rounded-xs border text-left flex items-start gap-3 transition cursor-pointer ${
                    currentTheme === t.id
                      ? 'bg-[var(--bg-elevated)] border-[var(--accent-lime)] text-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0 border border-black/20 shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block mb-0.5" style={{ color: currentTheme === t.id ? 'var(--accent-lime)' : 'inherit' }}>
                      {t.name}
                    </span>
                    <span className="text-[11px] block font-mono opacity-80">
                      {t.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Engine Specs */}
          <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xs border border-[var(--border-subtle)] text-xs font-mono space-y-1.5 text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
              DSP Architecture Specifications:
            </div>
            <div>• Sample Format: Float32 audio graph, Float64 internal DSP</div>
            <div>• Filter Topology: Direct Form II Transposed (DF2T) Biquad</div>
            <div>• Comp/Limiter: Stereo-linked detector with true peak ceiling</div>
            <div>• Parity Benchmark: Bit-accurate JS & C++/WASM reference test</div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[#090A08] rounded-xs transition cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
