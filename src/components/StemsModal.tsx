import React, { useEffect, useState } from 'react';
import { X, Layers } from 'lucide-react';
import { PhosphorSlider } from './PhosphorSlider';
import { stemMixer } from '../utils/stem-mixer';

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

  useEffect(() => {
    stemMixer.install();
    stemMixer.setStates(stems);
    stemMixer.attach();

    return () => {
      stemMixer.detach(true);
    };
    // The mixer is synchronized explicitly below; this effect only owns the
    // graph lifetime for the modal instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStem = (id: string, updates: Partial<StemTrack>) => {
    setStems((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const updated = next.find((s) => s.id === id);
      if (!updated) return next;

      if (updates.pan !== undefined) stemMixer.setPan(id, updated.pan);
      if (updates.gain !== undefined) stemMixer.setVolume(id, updated.gain);
      if (updates.muted !== undefined) stemMixer.setMuted(id, updated.muted);
      if (updates.solo !== undefined) stemMixer.setSolo(id, updated.solo);

      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Layers className="h-4 w-4 shrink-0 text-[var(--accent-lime)]" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">Stem Mastering Engine</h3>
                <span className="hidden shrink-0 rounded bg-[var(--accent-lime)] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[var(--text-primary)] sm:inline-block">
                  PRO FEATURE
                </span>
              </div>
              <p className="hidden text-[11px] text-[var(--text-tertiary)] sm:block">Multi-track stem summing with independent bus control</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stem mixer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6">
          {/* Mobile: 1 column. Tablet: 2 columns. Desktop: horizontal 4-channel mixer. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
            {stems.map((stem) => (
              <div
                key={stem.id}
                className="flex min-w-0 flex-col rounded-xl border border-[#181C22] bg-[#07090C] p-4 sm:p-5"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs font-bold text-[var(--accent-lime)]">
                    {stem.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[var(--text-primary)]">{stem.name}</div>
                    <div className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">{stem.category}</div>
                  </div>
                </div>

                {/* Gain / Pan controls keep their existing DSP callbacks. */}
                <div className="space-y-5">
                  <div className="min-h-11 flex items-center">
                    <PhosphorSlider
                      label="Gain"
                      value={stem.gain}
                      min={-12}
                      max={12}
                      step={0.1}
                      unit="dB"
                      color="violet"
                      size="sm"
                      onChange={(v) => updateStem(stem.id, { gain: v })}
                    />
                  </div>
                  <div className="min-h-11 flex items-center">
                    <PhosphorSlider
                      label="Pan"
                      value={stem.pan}
                      min={-100}
                      max={100}
                      step={1}
                      displayValue={stem.pan === 0 ? 'C' : `${stem.pan > 0 ? 'R' : 'L'} ${Math.abs(stem.pan)}`}
                      color="violet"
                      size="sm"
                      onChange={(v) => updateStem(stem.id, { pan: v })}
                    />
                  </div>
                </div>

                {/* Mute / Solo: minimum 44x44px touch targets. */}
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    aria-label={`Mute ${stem.name}`}
                    aria-pressed={stem.muted}
                    onClick={() => updateStem(stem.id, { muted: !stem.muted })}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] ${
                      stem.muted
                        ? 'border-[#EF4444]/50 bg-[#EF4444] text-[var(--text-primary)]'
                        : 'border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    aria-label={`Solo ${stem.name}`}
                    aria-pressed={stem.solo}
                    onClick={() => updateStem(stem.id, { solo: !stem.solo })}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-mono font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] ${
                      stem.solo
                        ? 'border-[#F59E0B]/50 bg-[#F59E0B] text-black'
                        : 'border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 sm:px-5">
          <span className="hidden text-[11px] font-mono text-[var(--text-tertiary)] sm:block">
            Summed into master DSP pipeline in 64-bit IEEE 754
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-11 min-w-[120px] items-center justify-center rounded-lg bg-[var(--accent-lime)] px-4 text-xs font-semibold text-[var(--text-primary)] shadow-md transition hover:bg-[#7C3AED] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)]"
          >
            Apply Stems
          </button>
        </div>
      </div>
    </div>
  );
};
