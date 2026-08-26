import React from 'react';
import { ChevronLeft, ChevronRight, Bookmark, History, Sliders, Check, Copy } from 'lucide-react';
import { PhosphorSlider } from './PhosphorSlider';
import { MasteringPreset, MasteringParams } from '../types';

export interface HistorySnapshotItem {
  id: string;
  time: string;
  name: string;
  target: string;
  params?: MasteringParams;
}

interface BottomCardsProps {
  params: MasteringParams;
  presets: MasteringPreset[];
  activePresetId: string;
  snapshots: HistorySnapshotItem[];
  onParamChange: <K extends keyof MasteringParams>(key: K, value: MasteringParams[K]) => void;
  onSelectPreset: (preset: MasteringPreset) => void;
  onRestoreSnapshot: (item: HistorySnapshotItem) => void;
  onOpenFullPresets: () => void;
  onOpenFullHistory: () => void;
  onOpenTargetModal: () => void;
}

export const BottomCards: React.FC<BottomCardsProps> = ({
  params,
  presets,
  activePresetId,
  snapshots,
  onParamChange,
  onSelectPreset,
  onRestoreSnapshot,
  onOpenFullPresets,
  onOpenFullHistory,
  onOpenTargetModal,
}) => {
  const currentPreset = presets.find((p) => p.id === activePresetId) || presets[0];

  const handlePrevPreset = () => {
    const currentIndex = presets.findIndex((p) => p.id === activePresetId);
    const prevIndex = (currentIndex - 1 + presets.length) % presets.length;
    onSelectPreset(presets[prevIndex]);
  };

  const handleNextPreset = () => {
    const currentIndex = presets.findIndex((p) => p.id === activePresetId);
    const nextIndex = (currentIndex + 1) % presets.length;
    onSelectPreset(presets[nextIndex]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* 1. GLOBAL CONTROLS */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
            Global Controls
          </span>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">DSP ENGINE</span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-auto py-1">
          <div className="flex justify-center">
            <PhosphorSlider
              label="Input Gain"
              value={params.gain}
              min={0}
              max={24}
              step={0.1}
              defaultValue={0}
              unit="dB"
              color="violet"
              size="md"
              onChange={(val) => onParamChange('gain', val)}
            />
          </div>
          <div className="flex justify-center">
            <PhosphorSlider
              label="Ceiling"
              value={-1.0}
              min={-6}
              max={0}
              step={0.1}
              defaultValue={-1.0}
              unit="dB"
              color="red"
              size="md"
              onChange={() => {}}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--bg-elevated)] mt-2">
          {/* Oversampling Selector */}
          <div className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm px-2 py-1.5">
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Oversample</span>
            <span className="text-xs font-mono font-semibold text-[var(--accent-lime)]">4x Ultra</span>
          </div>

          {/* Dither Toggle */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-sm border text-xs font-medium bg-[var(--bg-elevated)] text-[var(--accent-lime-hover)] border-[var(--accent-lime)]/50 shadow-sm">
            <span className="text-[11px]">Dither TPDF</span>
            <span className="font-mono font-semibold text-[11px]">On</span>
          </div>
        </div>
      </div>

      {/* 2. PRESETS */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
            Presets
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPreset}
              className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
              title="Previous Preset"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextPreset}
              className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
              title="Next Preset"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-[#08090C] border border-[var(--bg-elevated)] rounded-sm p-2.5 my-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {currentPreset?.name || 'Modern Streaming Master'}
            </span>
            <span className="text-[10px] font-mono text-[var(--accent-lime)] uppercase px-1.5 py-0.5 bg-[var(--accent-lime)]/10 rounded border border-[var(--accent-lime)]/20">
              {currentPreset?.category || 'Mastering'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1 line-clamp-2 leading-relaxed">
            {currentPreset?.description ||
              'Punchy, balanced preset with gentle glue compression and a transparent limiter.'}
          </p>
        </div>

        <button
          onClick={onOpenFullPresets}
          className="btn-secondary text-xs mt-2 w-full"
        >
          Browse Presets
        </button>
      </div>

      {/* 3. HISTORY */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
            History
          </span>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">SNAPSHOTS</span>
        </div>

        <div className="space-y-1.5 my-auto">
          {snapshots.slice(0, 3).map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onRestoreSnapshot(item)}
              className="flex items-center justify-between px-2.5 py-1 rounded bg-[#08090C] hover:bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] text-xs cursor-pointer transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{item.time}</span>
                <span className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-medium truncate max-w-[130px]">
                  {item.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--accent-lime)] group-hover:underline">
                Restore
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onOpenFullHistory}
          className="btn-secondary text-xs mt-2 w-full"
        >
          View Full History
        </button>
      </div>
    </div>
  );
};
