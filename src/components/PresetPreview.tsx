import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
import { MasteringPreset } from '../types';

interface PresetPreviewProps {
  preset: MasteringPreset;
  compact?: boolean;
}

function createWaveform(preset: MasteringPreset, points = 96) {
  const seed = preset.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: points }, (_, index) => {
    const t = index / (points - 1);
    const envelope = 0.28 + 0.72 * Math.pow(Math.sin(Math.PI * t), 0.72);
    const body = Math.sin((index + seed) * 0.37) * 0.32;
    const detail = Math.sin((index + seed) * 1.73) * 0.14;
    const low = Math.abs(preset.params.low) / 8;
    const high = Math.abs(preset.params.high) / 8;
    return Math.max(0.05, Math.min(1, envelope * (0.48 + Math.abs(body + detail) + (low + high) * 0.18)));
  });
}

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

export const PresetPreview: React.FC<PresetPreviewProps> = ({ preset, compact = false }) => {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const waveform = useMemo(() => createWaveform(preset), [preset]);

  useEffect(() => () => stop(), []);

  function stop() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    nodesRef.current.forEach((node) => {
      try { node.stop(); } catch { /* already stopped */ }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    nodesRef.current = [];
    gainRef.current?.disconnect();
    gainRef.current = null;
    setPlaying(false);
  }

  async function play() {
    stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = contextRef.current || new AudioCtx();
    contextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    gainRef.current = master;

    const now = ctx.currentTime;
    const duration = 3.2;
    const base = 110 + Math.max(0, preset.params.low) * 7;
    const mid = 220 + Math.max(0, preset.params.mid) * 12;
    const air = 440 + Math.max(0, preset.params.high) * 18;
    const drive = dbToGain(Math.max(0, preset.params.gain) * 0.55);

    const voices = [
      { type: 'sawtooth' as OscillatorType, freq: base, gain: 0.15 * drive },
      { type: 'triangle' as OscillatorType, freq: mid, gain: 0.09 * drive },
      { type: 'sine' as OscillatorType, freq: air, gain: 0.07 * drive },
    ];

    voices.forEach(({ type, freq, gain }) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * (1 + Math.max(-0.08, Math.min(0.08, preset.params.mid / 40))), now + duration);
      filter.type = type === 'sine' ? 'highpass' : 'lowpass';
      filter.frequency.value = type === 'sine' ? 1800 : 3600 + preset.params.high * 160;
      filter.Q.value = 0.6;
      amp.gain.value = gain;
      osc.connect(filter).connect(amp).connect(master);
      osc.start(now);
      osc.stop(now + duration);
      nodesRef.current.push(osc);
    });

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i++) noise[i] = (Math.random() * 2 - 1) * 0.025;
    const noiseSource = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3200 + Math.max(0, preset.params.high) * 140;
    noiseGain.gain.value = 0.3 + Math.max(0, preset.params.high) * 0.03;
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(master);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
    nodesRef.current.push(noiseSource);

    master.gain.linearRampToValueAtTime(0.12, now + 0.08);
    master.gain.linearRampToValueAtTime(0.12, now + duration - 0.18);
    master.gain.linearRampToValueAtTime(0.0001, now + duration);
    setPlaying(true);
    stopTimerRef.current = window.setTimeout(() => stop(), duration * 1000 + 100);
  }

  return (
    <div className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]">
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-[9px] font-mono uppercase tracking-[0.16em] text-[var(--text-tertiary)]">DSP preview</span>
        </div>
        <button
          type="button"
          onClick={() => void (playing ? Promise.resolve(stop()) : play())}
          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--accent-lime)]/30 bg-[var(--accent-lime-soft)] px-2.5 text-[9px] font-mono font-semibold text-[var(--accent-lime)] transition hover:bg-[var(--accent-lime)]/15 focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)]"
          aria-label={playing ? `Zaustavi preview profila ${preset.name}` : `Preslušaj preview profila ${preset.name}`}
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          {playing ? 'STOP' : 'PLAY'}
        </button>
      </div>

      <div className="h-14 w-full overflow-hidden rounded-md bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] px-1.5" aria-label="Waveform preview">
        <svg viewBox="0 0 96 42" preserveAspectRatio="none" className="h-full w-full" role="img">
          <path d="M0 21 L96 21" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6" />
          {waveform.map((value, index) => {
            const x = index;
            const y = 21 - value * 17;
            const y2 = 21 + value * 17;
            return <line key={index} x1={x} x2={x} y1={y} y2={y2} stroke="currentColor" strokeOpacity={playing ? 0.88 : 0.55} strokeWidth="0.7" className="text-[var(--accent-lime)]" />;
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-[var(--text-tertiary)]">
        <span>3.2 s demo</span>
        <span>{preset.targetLufs.toFixed(1)} LUFS target</span>
      </div>
    </div>
  );
};
