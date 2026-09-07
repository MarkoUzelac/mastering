import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { MasteringPreset } from '../types';
import { audioEngine } from '../utils/audio-engine';
import { renderPresetPreview } from '../audio/dsp-core.js';

interface PresetPreviewProps {
  preset: MasteringPreset;
  compact?: boolean;
  audioBuffer?: AudioBuffer | null;
}

const PREVIEW_DURATION = 8;

function makeFallbackWaveform(preset: MasteringPreset, points = 128) {
  const seed = preset.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: points }, (_, index) => {
    const t = index / Math.max(1, points - 1);
    const envelope = 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * t), 0.7);
    const body = Math.sin((index + seed) * 0.31) * 0.28;
    const detail = Math.sin((index + seed) * 1.61) * 0.16;
    return Math.max(0.04, Math.min(1, envelope * (0.46 + Math.abs(body + detail))));
  });
}

function extractWaveform(buffer: AudioBuffer, maxPoints = 128) {
  const channels = Math.min(2, buffer.numberOfChannels);
  const length = buffer.length;
  const points = Math.min(maxPoints, Math.max(32, Math.floor(length / 512)));
  const values = new Array<number>(points).fill(0);
  const bucketSize = Math.max(1, Math.floor(length / points));
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;

  for (let point = 0; point < points; point += 1) {
    const start = point * bucketSize;
    const end = Math.min(length, start + bucketSize);
    let peak = 0;
    for (let i = start; i < end; i += 1) {
      const sample = (Math.abs(left[i]) + Math.abs(right[i])) * 0.5;
      if (sample > peak) peak = sample;
    }
    values[point] = Math.max(0.02, Math.min(1, peak));
  }
  return values;
}

function createAudioBuffer(ctx: AudioContext, rendered: { sampleRate: number; frames: number; left: Float32Array; right: Float32Array }) {
  const buffer = ctx.createBuffer(2, rendered.frames, rendered.sampleRate);
  buffer.getChannelData(0).set(rendered.left);
  buffer.getChannelData(1).set(rendered.right);
  return buffer;
}

function createFallbackBuffer(ctx: AudioContext, preset: MasteringPreset) {
  const frameCount = Math.floor(ctx.sampleRate * 3.2);
  const buffer = ctx.createBuffer(2, frameCount, ctx.sampleRate);
  const lowBoost = Math.max(-6, Math.min(6, preset.params.low));
  const midBoost = Math.max(-6, Math.min(6, preset.params.mid));
  const highBoost = Math.max(-6, Math.min(6, preset.params.high));
  const lowGain = 10 ** (lowBoost / 20);
  const midGain = 10 ** (midBoost / 20);
  const highGain = 10 ** (highBoost / 20);

  for (let channel = 0; channel < 2; channel += 1) {
    const out = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i += 1) {
      const t = i / ctx.sampleRate;
      const env = Math.min(1, t * 18) * Math.min(1, (3.2 - t) * 10);
      const low = Math.sin(2 * Math.PI * (72 + lowBoost * 7) * t) * 0.18 * lowGain;
      const mid = Math.sin(2 * Math.PI * (220 + midBoost * 10) * t) * 0.09 * midGain;
      const air = Math.sin(2 * Math.PI * (4200 + highBoost * 90) * t) * 0.025 * highGain;
      const click = Math.sin(2 * Math.PI * (2 + channel * 0.03) * t) * 0.01;
      out[i] = Math.tanh((low + mid + air + click) * (1 + Math.max(0, preset.params.gain) * 0.06)) * env;
    }
  }
  return buffer;
}

export const PresetPreview: React.FC<PresetPreviewProps> = ({ preset, compact = false, audioBuffer }) => {
  const [mode, setMode] = useState<'original' | 'preset'>('preset');
  const [playing, setPlaying] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedBuffer, setRenderedBuffer] = useState<AudioBuffer | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const sourceBuffer = audioBuffer || audioEngine.getLoadedBuffer();
  const hasRealTrack = Boolean(sourceBuffer);

  useEffect(() => {
    let cancelled = false;
    stopPlayback();

    if (!sourceBuffer) {
      setRenderedBuffer(null);
      setRendering(false);
      return;
    }

    setRendering(true);
    const rendered = renderPresetPreview(sourceBuffer, preset.params, PREVIEW_DURATION);
    if (cancelled) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = contextRef.current || new AudioCtx();
    contextRef.current = ctx;
    setRenderedBuffer(createAudioBuffer(ctx, rendered));
    setRendering(false);

    return () => { cancelled = true; };
  }, [preset, sourceBuffer]);

  useEffect(() => () => stopPlayback(), []);

  function stopPlayback() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    try { sourceRef.current?.disconnect(); } catch { /* already disconnected */ }
    sourceRef.current = null;
    setPlaying(false);
    setProgress(0);
  }

  async function getContext() {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = contextRef.current || new AudioCtx();
    contextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx;
  }

  async function play() {
    stopPlayback();
    const ctx = await getContext();
    const original = sourceBuffer || audioEngine.getLoadedBuffer();
    const buffer = mode === 'original'
      ? original
      : renderedBuffer || (original ? createAudioBuffer(ctx, renderPresetPreview(original, preset.params, PREVIEW_DURATION)) : createFallbackBuffer(ctx, preset));

    if (!buffer) return;

    const maxDuration = Math.min(PREVIEW_DURATION, buffer.duration);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.0001;
    source.connect(gain).connect(ctx.destination);
    sourceRef.current = source;

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.78, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + maxDuration);
    source.start(now);
    source.stop(now + maxDuration + 0.03);
    setPlaying(true);

    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      setProgress(Math.min(1, elapsed / maxDuration));
      if (elapsed >= maxDuration) stopPlayback();
    }, 50);
  }

  const displayedBuffer = mode === 'original' ? sourceBuffer : renderedBuffer;
  const waveform = useMemo(
    () => displayedBuffer ? extractWaveform(displayedBuffer) : makeFallbackWaveform(preset),
    [displayedBuffer, preset]
  );
  const statusLabel = mode === 'original' ? 'ORIGINAL' : hasRealTrack ? 'MASTERINGDSP RENDER' : 'DSP DEMO';

  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 ${compact ? 'p-2.5' : 'p-3.5'} shadow-[0_12px_36px_rgba(0,0,0,0.12)]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]">
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[9px] font-mono uppercase tracking-[0.16em] text-[var(--text-tertiary)]">A/B audio preview</div>
            <div className="truncate text-[10px] font-semibold text-[var(--text-primary)]">{statusLabel}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void (playing ? Promise.resolve(stopPlayback()) : play())}
          disabled={rendering}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--accent-lime)]/35 bg-[var(--accent-lime-soft)] px-3 text-[9px] font-mono font-bold text-[var(--accent-lime)] transition hover:bg-[var(--accent-lime)]/15 focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
          aria-label={playing ? `Zaustavi preview ${preset.name}` : `Preslušaj ${preset.name}`}
        >
          {rendering ? <Loader2 className="h-3 w-3 animate-spin" /> : playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          {rendering ? 'RENDER' : playing ? 'STOP' : 'PLAY'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1" role="tablist" aria-label="A/B preview">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'original'}
          onClick={() => { stopPlayback(); setMode('original'); }}
          disabled={!hasRealTrack}
          className={`min-h-9 rounded-md px-2 text-[9px] font-mono font-bold transition ${mode === 'original' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          A · ORIGINAL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'preset'}
          onClick={() => { stopPlayback(); setMode('preset'); }}
          className={`min-h-9 rounded-md px-2 text-[9px] font-mono font-bold transition ${mode === 'preset' ? 'bg-[var(--accent-lime-soft)] text-[var(--accent-lime)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
          B · {hasRealTrack ? 'PRESET' : 'DSP DEMO'}
        </button>
      </div>

      <div className="mt-3 h-16 w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] px-1.5" aria-label={mode === 'original' ? 'Waveform originalnog audio zapisa' : 'Waveform DSP rendera preseta'}>
        <svg viewBox="0 0 128 42" preserveAspectRatio="none" className="h-full w-full" role="img">
          <path d="M0 21 L128 21" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6" />
          {waveform.map((value, index) => {
            const x = index;
            const y = 21 - value * 17;
            const y2 = 21 + value * 17;
            const active = progress > 0 && index / Math.max(1, waveform.length - 1) <= progress;
            return <line key={`${preset.id}-${mode}-${index}`} x1={x} x2={x} y1={y} y2={y2} stroke="currentColor" strokeOpacity={active ? 0.95 : 0.48} strokeWidth="0.72" className="text-[var(--accent-lime)]" />;
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[9px] font-mono text-[var(--text-tertiary)]">
        <span className="truncate">{hasRealTrack ? `${mode === 'original' ? 'A' : 'B'} · stvarni audio buffer` : 'Nema učitanog tracka'}</span>
        <span className="shrink-0">{preset.targetLufs.toFixed(1)} LUFS</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          {mode === 'preset' ? <Check className="h-3 w-3 text-[var(--accent-lime)]" /> : <RotateCcw className="h-3 w-3" />}
          <span className="truncate">{mode === 'preset' ? 'Slušaš stvarni DSP render preseta' : 'Slušaš originalni track'}</span>
        </div>
        <span className="shrink-0 tabular-nums text-[9px] text-[var(--text-tertiary)]">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
};
