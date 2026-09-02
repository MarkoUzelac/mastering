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

  // Keep pan interaction state owned by React. DSP updates are side effects and
  // must never be the source of truth for a controlled UI control.
  const [panValues, setPanValues] = useState<Record<string, number>>(() => ({
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
  }));

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

  const handlePanChange = (id: string, value: number) => {
    const clamped = Math.max(-100, Math.min(100, Math.round(value)));
    setPanValues((prev) => ({ ...prev, [id]: clamped }));
    updateStem(id, { pan: clamped });
  };

  const handlePanReset = (id: string) => {
    setPanValues((prev) => ({ ...prev, [id]: 0 }));
    updateStem(id, { pan: 0 });
  };

  const formatPanLabel = (value: number) => {
    if (value === 0) return 'C';
    return `${value < 0 ? 'L' : 'R'}${Math.abs(value)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md sm:p-4 md:p-6">
      <div className="flex max-h-[92vh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-150 sm:max-h-[88vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-inner sm:h-10 sm:w-10">
              <Layers className="h-4 w-4 text-[var(--accent-lime)]" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)] sm:text-base">Stem Mastering Engine</h3>
                <span className="hidden shrink-0 rounded-md border border-[var(--accent-lime)]/30 bg-[var(--accent-lime)]/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--accent-lime)] sm:inline-block">PRO</span>
              </div>
              <p className="hidden text-[11px] text-[var(--text-tertiary)] sm:block">Independent gain, pan, mute and solo control</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close stem mixer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Stem bus</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Four channels · live DSP routing</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">64-bit DSP</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5">
            {stems.map((stem) => {
              const panValue = panValues[stem.id] ?? stem.pan ?? 0;
              return (
                <div key={stem.id} className="group flex min-w-0 flex-col rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-colors hover:border-[var(--accent-lime)]/20 sm:p-5">
                  <div className="mb-5 flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs font-bold text-[var(--accent-lime)] shadow-inner">{stem.name[0]}</div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[var(--text-primary)] sm:text-[13px]">{stem.name}</div>
                      <div className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{stem.category}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-[var(--border-subtle)]/70 bg-[var(--bg-primary)]/40 px-3 py-2">
                      <PhosphorSlider label="Gain" value={stem.gain} min={-12} max={12} step={0.1} unit=" dB" color="violet" size="sm" onChange={(v) => updateStem(stem.id, { gain: v })} />
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)]/70 bg-[var(--bg-primary)]/40 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">Pan</span>
                        <button
                          type="button"
                          onDoubleClick={() => handlePanReset(stem.id)}
                          onClick={() => handlePanReset(stem.id)}
                          className="min-h-[24px] rounded-md px-1.5 text-[11px] font-mono font-semibold tabular-nums text-[var(--accent-violet,#8B5CF6)] transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)]"
                          title="Click or double-click to reset pan to center"
                          aria-label={`Reset pan for ${stem.name} to center`}
                        >
                          PAN: {formatPanLabel(panValue)}
                        </button>
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        step={1}
                        value={panValue}
                        onChange={(event) => handlePanChange(stem.id, Number(event.target.value))}
                        onDoubleClick={() => handlePanReset(stem.id)}
                        aria-label={`Pan for ${stem.name}`}
                        aria-valuetext={formatPanLabel(panValue)}
                        className="h-11 w-full cursor-pointer appearance-none bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] touch-none [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--bg-elevated)] [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-primary)] [&::-webkit-slider-thumb]:bg-[var(--text-primary)] [&::-webkit-slider-thumb]:shadow-lg"
                      />
                      <div className="mt-1 flex justify-between px-0.5 text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                        <span>L100</span>
                        <span>C</span>
                        <span>R100</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Channel</span>
                      <span className="text-[9px] font-mono text-[var(--text-tertiary)]">M / S</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" aria-label={`Mute ${stem.name}`} aria-pressed={stem.muted} onClick={() => updateStem(stem.id, { muted: !stem.muted })} className={`flex h-11 min-h-11 flex-1 items-center justify-center rounded-xl border text-xs font-mono font-bold transition active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] ${stem.muted ? 'border-[#EF4444]/50 bg-[#EF4444]/15 text-[#EF4444] shadow-[0_0_18px_rgba(239,68,68,0.12)]' : 'border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'}`}>MUTE</button>
                      <button type="button" aria-label={`Solo ${stem.name}`} aria-pressed={stem.solo} onClick={() => updateStem(stem.id, { solo: !stem.solo })} className={`flex h-11 min-h-11 flex-1 items-center justify-center rounded-xl border text-xs font-mono font-bold transition active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] ${stem.solo ? 'border-[#F59E0B]/50 bg-[#F59E0B]/15 text-[#F59E0B] shadow-[0_0_18px_rgba(245,158,11,0.12)]' : 'border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'}`}>SOLO</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 px-3 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Master bus</p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">Summed into the live DSP pipeline</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 min-h-11 w-full items-center justify-center rounded-xl bg-[var(--accent-lime)] px-5 text-xs font-semibold text-[var(--text-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition hover:brightness-95 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] sm:w-auto sm:min-w-[132px]">Apply Stems</button>
        </div>
      </div>
    </div>
  );
};
