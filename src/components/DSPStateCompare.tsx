import React, { useState, useEffect } from 'react';
import {
  Copy,
  ArrowRightLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MasteringParams } from '../types';
import { AdvancedParamsState } from './ProcessingChain';
import { soundHaptics } from '../utils/sound-haptics';

export interface DSPStateSlot {
  params: MasteringParams;
  advancedParams: AdvancedParamsState;
  presetName?: string;
  timestamp: number;
}

interface DSPStateCompareProps {
  activeSlot: 'A' | 'B';
  slotA: DSPStateSlot;
  slotB: DSPStateSlot;
  currentParams: MasteringParams;
  currentAdvancedParams: AdvancedParamsState;
  onSelectSlot: (slot: 'A' | 'B') => void;
  onCaptureToOppositeSlot: () => void;
  onCopySlot: (from: 'A' | 'B', to: 'A' | 'B') => void;
  onSwapSlots: () => void;
  onResetSlot: (slot: 'A' | 'B') => void;
}

interface ParamDiff {
  label: string;
  category: 'EQ' | 'Dynamics' | 'Color' | 'Stereo' | 'Limiter' | 'Gain';
  valA: string;
  valB: string;
  isDiff: boolean;
}

export const DSPStateCompare: React.FC<DSPStateCompareProps> = ({
  activeSlot,
  slotA,
  slotB,
  currentParams,
  currentAdvancedParams,
  onSelectSlot,
  onCaptureToOppositeSlot,
  onCopySlot,
  onSwapSlots,
  onResetSlot,
}) => {
  const [showDiffDrawer, setShowDiffDrawer] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2400);
  };

  // Keyboard shortcut listener for instantaneous auditioning (Shift + A, Shift + B, or Alt + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.shiftKey || e.altKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        soundHaptics.playButtonTap();
        onSelectSlot('A');
        showFeedback('Switched to State A');
      } else if ((e.shiftKey || e.altKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        soundHaptics.playButtonTap();
        onSelectSlot('B');
        showFeedback('Switched to State B');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectSlot]);

  // Calculate detailed differences between Slot A and Slot B
  const diffs: ParamDiff[] = [
    {
      label: 'Low Shelf (80 Hz)',
      category: 'EQ',
      valA: `${slotA.params.low > 0 ? '+' : ''}${slotA.params.low.toFixed(1)} dB`,
      valB: `${slotB.params.low > 0 ? '+' : ''}${slotB.params.low.toFixed(1)} dB`,
      isDiff: Math.abs(slotA.params.low - slotB.params.low) > 0.05,
    },
    {
      label: 'Mid Parametric (1.2 kHz)',
      category: 'EQ',
      valA: `${slotA.params.mid > 0 ? '+' : ''}${slotA.params.mid.toFixed(1)} dB`,
      valB: `${slotB.params.mid > 0 ? '+' : ''}${slotB.params.mid.toFixed(1)} dB`,
      isDiff: Math.abs(slotA.params.mid - slotB.params.mid) > 0.05,
    },
    {
      label: 'High Shelf (8 kHz)',
      category: 'EQ',
      valA: `${slotA.params.high > 0 ? '+' : ''}${slotA.params.high.toFixed(1)} dB`,
      valB: `${slotB.params.high > 0 ? '+' : ''}${slotB.params.high.toFixed(1)} dB`,
      isDiff: Math.abs(slotA.params.high - slotB.params.high) > 0.05,
    },
    {
      label: 'Compressor Threshold',
      category: 'Dynamics',
      valA: `${slotA.params.threshold.toFixed(1)} dB`,
      valB: `${slotB.params.threshold.toFixed(1)} dB`,
      isDiff: Math.abs(slotA.params.threshold - slotB.params.threshold) > 0.05,
    },
    {
      label: 'Compressor Ratio',
      category: 'Dynamics',
      valA: `${slotA.params.ratio.toFixed(1)}:1`,
      valB: `${slotB.params.ratio.toFixed(1)}:1`,
      isDiff: Math.abs(slotA.params.ratio - slotB.params.ratio) > 0.05,
    },
    {
      label: 'Input / Makeup Gain',
      category: 'Gain',
      valA: `${slotA.params.gain > 0 ? '+' : ''}${slotA.params.gain.toFixed(1)} dB`,
      valB: `${slotB.params.gain > 0 ? '+' : ''}${slotB.params.gain.toFixed(1)} dB`,
      isDiff: Math.abs(slotA.params.gain - slotB.params.gain) > 0.05,
    },
    {
      label: 'Saturation Drive',
      category: 'Color',
      valA: `${slotA.advancedParams.drive.toFixed(0)}%`,
      valB: `${slotB.advancedParams.drive.toFixed(0)}%`,
      isDiff: Math.abs(slotA.advancedParams.drive - slotB.advancedParams.drive) > 0.5,
    },
    {
      label: 'Stereo Width',
      category: 'Stereo',
      valA: `${slotA.advancedParams.width.toFixed(0)}%`,
      valB: `${slotB.advancedParams.width.toFixed(0)}%`,
      isDiff: Math.abs(slotA.advancedParams.width - slotB.advancedParams.width) > 0.5,
    },
    {
      label: 'Ceiling (True Peak)',
      category: 'Limiter',
      valA: `${slotA.advancedParams.ceiling.toFixed(1)} dBTP`,
      valB: `${slotB.advancedParams.ceiling.toFixed(1)} dBTP`,
      isDiff: Math.abs(slotA.advancedParams.ceiling - slotB.advancedParams.ceiling) > 0.05,
    },
  ];

  const totalDifferences = diffs.filter((d) => d.isDiff).length;
  const oppositeSlot = activeSlot === 'A' ? 'B' : 'A';

  return (
    <div
      id="dsp-state-ab-container"
      className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-3.5 sm:p-4 shadow-sm transition-all relative overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-lime)]/40 to-transparent" />

      {/* Main Bar Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Component Title & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                DSP State A/B
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                Auditioning: State {activeSlot}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
              Instantaneous glitch-free parameter comparison · Shortcuts: <kbd className="font-mono text-[10px] text-[var(--text-secondary)]">Shift+A</kbd> / <kbd className="font-mono text-[10px] text-[var(--text-secondary)]">Shift+B</kbd>
            </p>
          </div>
        </div>

        {/* Center: A/B Toggle Button Group & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Segmented A / B Toggle Controls */}
          <div
            className="inline-flex items-center p-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-sm shadow-inner"
            role="group"
            aria-label="DSP State A/B selection"
          >
            {/* Slot A Button */}
            <button
              id="dsp-slot-a-btn"
              onClick={() => {
                soundHaptics.playButtonTap();
                onSelectSlot('A');
                showFeedback('Switched to State A');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-xs font-mono text-xs transition-all cursor-pointer select-none ${
                activeSlot === 'A'
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] font-bold shadow-[0_0_12px_rgba(183,240,0,0.35)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title="Audition State A (Shift+A)"
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80" />
              <span className="font-extrabold tracking-wide">STATE A</span>
              {slotA.presetName && (
                <span
                  className={`text-[10px] font-normal truncate max-w-[80px] hidden sm:inline ${
                    activeSlot === 'A' ? 'text-[var(--bg-primary)]/80' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  ({slotA.presetName})
                </span>
              )}
            </button>

            {/* Slot B Button */}
            <button
              id="dsp-slot-b-btn"
              onClick={() => {
                soundHaptics.playButtonTap();
                onSelectSlot('B');
                showFeedback('Switched to State B');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-xs font-mono text-xs transition-all cursor-pointer select-none ${
                activeSlot === 'B'
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] font-bold shadow-[0_0_12px_rgba(183,240,0,0.35)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title="Audition State B (Shift+B)"
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80" />
              <span className="font-extrabold tracking-wide">STATE B</span>
              {slotB.presetName && (
                <span
                  className={`text-[10px] font-normal truncate max-w-[80px] hidden sm:inline ${
                    activeSlot === 'B' ? 'text-[var(--bg-primary)]/80' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  ({slotB.presetName})
                </span>
              )}
            </button>
          </div>

          {/* Quick Capture Current to Opposite Slot Button */}
          <button
            id="dsp-capture-to-opposite-btn"
            onClick={() => {
              soundHaptics.playPresetClick();
              onCaptureToOppositeSlot();
              showFeedback(`Captured current settings into State ${oppositeSlot}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-mono font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[#1C2028] border border-[var(--border-subtle)] hover:border-[var(--accent-lime)]/40 rounded-sm transition-colors cursor-pointer active:scale-95 shadow-sm"
            title={`Capture current DSP settings into State ${oppositeSlot}`}
          >
            <Camera className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
            <span>Capture → {oppositeSlot}</span>
          </button>

          {/* Copy A -> B or B -> A */}
          <button
            id="dsp-copy-slot-btn"
            onClick={() => {
              soundHaptics.playPresetClick();
              if (activeSlot === 'A') {
                onCopySlot('A', 'B');
                showFeedback('Copied State A to State B');
              } else {
                onCopySlot('B', 'A');
                showFeedback('Copied State B to State A');
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[#1C2028] border border-[var(--border-subtle)] rounded-sm transition-colors cursor-pointer active:scale-95"
            title={activeSlot === 'A' ? 'Duplicate State A to State B' : 'Duplicate State B to State A'}
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy {activeSlot}→{oppositeSlot}</span>
          </button>

          {/* Swap Slots */}
          <button
            id="dsp-swap-slots-btn"
            onClick={() => {
              soundHaptics.playButtonTap();
              onSwapSlots();
              showFeedback('Swapped State A and State B');
            }}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[#1C2028] border border-[var(--border-subtle)] rounded-sm transition-colors cursor-pointer active:scale-95"
            title="Swap State A and State B"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>

          {/* Reset Current Slot */}
          <button
            id="dsp-reset-slot-btn"
            onClick={() => {
              soundHaptics.playResetSound();
              onResetSlot(activeSlot);
              showFeedback(`Reset State ${activeSlot} to defaults`);
            }}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#EF4444] bg-[var(--bg-elevated)] hover:bg-[#1C2028] border border-[var(--border-subtle)] rounded-sm transition-colors cursor-pointer active:scale-95"
            title={`Reset State ${activeSlot} to Default Settings`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Difference Telemetry & Inspector Toggle */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            id="dsp-diff-drawer-toggle-btn"
            onClick={() => {
              soundHaptics.playButtonTap();
              setShowDiffDrawer(!showDiffDrawer);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 min-h-[38px] text-xs font-mono rounded-sm border transition-colors cursor-pointer select-none ${
              totalDifferences > 0
                ? 'bg-[var(--bg-elevated)] border-[var(--accent-lime)]/40 text-[var(--text-primary)] hover:border-[var(--accent-lime)]'
                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
            }`}
            title="Toggle Parameter Delta Inspector"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                totalDifferences > 0 ? 'bg-[var(--accent-lime)] animate-pulse' : 'bg-[#6B7280]'
              }`}
            />
            <span className="font-semibold tabular-nums">
              {totalDifferences === 0 ? 'In Sync' : `${totalDifferences} Diff${totalDifferences > 1 ? 's' : ''}`}
            </span>
            {showDiffDrawer ? (
              <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Feedback Banner */}
      {feedbackMessage && (
        <div className="mt-2.5 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--accent-lime)]/30 rounded-xs text-xs font-mono text-[var(--accent-lime)] flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Expandable Parameter Differences Breakdown Drawer */}
      {showDiffDrawer && (
        <div className="mt-3.5 pt-3.5 border-t border-[var(--border-subtle)] space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Parameter Comparison Matrix (State A vs State B)
            </div>
            <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
              {totalDifferences === 0 ? 'Both states have identical settings' : `${totalDifferences} parameter deltas active`}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
            {diffs.map((diff, index) => (
              <div
                key={index}
                className={`p-2 rounded-xs border transition-colors flex items-center justify-between ${
                  diff.isDiff
                    ? 'bg-[#151812] border-[var(--accent-lime)]/30 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-elevated)]/50 border-[var(--border-subtle)]/60 text-[var(--text-tertiary)]'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] block">
                    {diff.category}
                  </span>
                  <span className={`text-[11px] truncate block ${diff.isDiff ? 'text-[var(--text-primary)] font-medium' : ''}`}>
                    {diff.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 tabular-nums text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded-xs ${
                      activeSlot === 'A'
                        ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] font-bold'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {diff.valA}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-[9px]">vs</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-xs ${
                      activeSlot === 'B'
                        ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] font-bold'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {diff.valB}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
