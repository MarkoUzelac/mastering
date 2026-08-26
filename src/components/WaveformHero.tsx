import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Split } from 'lucide-react';
import { AudioTrackInfo } from '../types';
import { soundHaptics } from '../utils/sound-haptics';
import { audioEngineEvents } from '../utils/audio-engine';

interface WaveformHeroProps {
  currentTrack: AudioTrackInfo | null;
  currentTime?: number;
  duration: number;
  isPlaying: boolean;
  isBypassed: boolean;
  onSeek: (time: number) => void;
  loopRegion?: { start: number; end: number; enabled: boolean };
  onToggleLoop?: () => void;
}

export const WaveformHero: React.FC<WaveformHeroProps> = ({
  currentTrack,
  currentTime = 0,
  duration,
  isPlaying,
  isBypassed,
  onSeek,
  loopRegion = { start: 30, end: 75, enabled: false },
  onToggleLoop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [localTime, setLocalTime] = useState<number>(0);
  useEffect(() => {
    const handler = (e: any) => setLocalTime(e.detail.currentTime);
    audioEngineEvents.addEventListener('timeupdate', handler);
    return () => audioEngineEvents.removeEventListener('timeupdate', handler);
  }, []);
  // Ensure localTime is used instead of currentTime prop
  const activeTime = localTime;
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const lastScrubTickRef = useRef<number>(0);

  const totalDurationRender = duration > 0 ? duration : 225.782;
  const visibleDuration = totalDurationRender / zoomLevel;
  let viewStart = currentTime - visibleDuration / 2;
  if (viewStart < 0) viewStart = 0;
  if (viewStart + visibleDuration > totalDurationRender) viewStart = Math.max(0, totalDurationRender - visibleDuration);

  const formatPrecisionTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // High-resolution peak extractor
  const waveformPeaks = useMemo(() => {
    if (!currentTrack?.buffer) return null;
    const buffer = currentTrack.buffer;
    const numBuckets = 1200;
    const numChannels = Math.min(2, buffer.numberOfChannels);

    const leftData = buffer.getChannelData(0);
    const rightData = numChannels > 1 ? buffer.getChannelData(1) : leftData;
    const totalSamples = buffer.length;
    const step = Math.floor(totalSamples / numBuckets);

    const mins: number[] = [];
    const maxs: number[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const start = i * step;
      const end = Math.min(start + step, totalSamples);
      let minVal = 1.0;
      let maxVal = -1.0;

      for (let j = start; j < end; j += 4) {
        const val = 0.5 * (leftData[j] + rightData[j]);
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }

      mins.push(minVal === 1.0 ? 0 : minVal);
      maxs.push(maxVal === -1.0 ? 0 : maxVal);
    }

    return { mins, maxs, numBuckets };
  }, [currentTrack]);

  // Render Waveform Canvas with Rich Violet Theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#07090C';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal grid lines
    ctx.strokeStyle = '#14181F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.lineTo(width, height * 0.25);
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.moveTo(0, height * 0.75);
    ctx.lineTo(width, height * 0.75);
    ctx.stroke();

    const midY = height / 2;
    const maxAmp = height * 0.42;

    const playheadX = duration > 0 ? ((activeTime - viewStart) / visibleDuration) * width : 0;

    // Optional Loop / Section Region Highlight (A/B)
    if (loopRegion.enabled && duration > 0) {
      const startX = ((loopRegion.start - viewStart) / visibleDuration) * width;
      const endX = ((loopRegion.end - viewStart) / visibleDuration) * width;
      ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      ctx.fillRect(startX, 0, endX - startX, height);

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, 0, endX - startX, height);
    }

    if (!waveformPeaks) {
      // Synthetic stereo preview waveform when no file is loaded yet
      const numBars = 160;
      const barWidth = width / numBars;
      for (let i = 0; i < numBars; i++) {
        const time = (i / numBars) * totalDurationRender;
        const x = ((time - viewStart) / visibleDuration) * width;
        const norm = i / numBars;
        const env = Math.sin(norm * Math.PI);
        const rand = 0.3 + 0.7 * Math.abs(Math.sin(i * 12.3));
        const barH = env * rand * maxAmp;

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? 'var(--accent-lime-hover)' : '#4C1D95';
        ctx.fillRect(x + 1, midY - barH, barWidth - 1.5, barH * 2);
      }
    } else {
      const { mins, maxs, numBuckets } = waveformPeaks;
      const barWidth = Math.max(1, width / numBuckets);

      for (let i = 0; i < numBuckets; i++) {
        const time = (i / numBuckets) * totalDurationRender;
        const x = ((time - viewStart) / visibleDuration) * width;
        const minVal = mins[i];
        const maxVal = maxs[i];
        const yTop = midY - maxVal * maxAmp;
        const yBot = midY - minVal * maxAmp;
        const barH = Math.max(1.5, yBot - yTop);

        const isPlayed = x <= playheadX;
        if (isBypassed) {
          ctx.fillStyle = isPlayed ? '#9CA3AF' : '#374151';
        } else {
          ctx.fillStyle = isPlayed ? '#D4FF5C' : '#8CA800';
        }
        ctx.fillRect(x, yTop, barWidth, barH);
      }
    }

    // Playhead Line & Glow
    if (duration > 0 || isPlaying) {
      ctx.strokeStyle = 'var(--accent-lime-hover)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top Playhead Diamond
      ctx.fillStyle = '#D4FF5C';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 4, 7);
      ctx.lineTo(playheadX + 4, 7);
      ctx.closePath();
      ctx.fill();
    }
  }, [waveformPeaks, activeTime, duration, isBypassed, isPlaying, loopRegion, zoomLevel, viewStart, visibleDuration, totalDurationRender]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = viewStart + ratio * visibleDuration;
    soundHaptics.playSliderTick(1800);
    onSeek(targetTime);
    setIsDragging(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = viewStart + ratio * visibleDuration;

    setHoverX(x);
    setHoverTime(targetTime);

    if (isDragging) {
      const nowMs = Date.now();
      if (nowMs - lastScrubTickRef.current > 70) {
        lastScrubTickRef.current = nowMs;
        soundHaptics.playSliderTick(1600);
      }
      onSeek(targetTime);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  const formatRulerTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-3 sm:p-3.5 space-y-2 shadow-sm">
      {/* Top Header of Card: Timeline, Loop & Zoom */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)]" />
            Timeline
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">|</span>
          <span className="text-[#D4FF5C] font-medium tabular-nums">
            {formatPrecisionTime(activeTime)}
          </span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-tertiary)] tabular-nums">{formatPrecisionTime(totalDurationRender)}</span>
        </div>

        {/* Zoom Controls & Loop Toggle */}
        <div className="flex items-center gap-1">
          {onToggleLoop && (
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                onToggleLoop();
              }}
              className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                loopRegion.enabled
                  ? 'bg-[var(--accent-lime)]/20 text-[#D4FF5C] border border-[var(--accent-lime)]/40'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--bg-elevated)]'
              }`}
              title="Toggle A/B Loop Region"
            >
              <Split className="w-3 h-3" />
              <span>A/B</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded p-0.5">
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setZoomLevel((z) => Math.max(1, z - 0.5));
              }}
              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition cursor-pointer active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 text-[var(--text-secondary)] font-mono">{zoomLevel}x</span>
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setZoomLevel((z) => Math.min(8, z + 0.5));
              }}
              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition cursor-pointer active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-32 sm:h-40 rounded-sm overflow-hidden bg-[#07090C] border border-[#181C22] cursor-crosshair select-none touch-none"
        onPointerLeave={() => {
          setHoverTime(null);
          setHoverX(null);
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Hover Time Tooltip */}
        {hoverTime !== null && hoverX !== null && (
          <div
            className="absolute top-2 -translate-x-1/2 px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[#2F353C] rounded text-[10px] font-mono text-[var(--text-primary)] pointer-events-none shadow-md z-10 tabular-nums"
            style={{ left: `${hoverX}px` }}
          >
            {formatPrecisionTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time Markers Ruler (Dynamic based on zoom) */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[var(--text-tertiary)] select-none">
        <span>{formatRulerTime(viewStart)}</span>
        <span>{formatRulerTime(viewStart + visibleDuration * 0.25)}</span>
        <span>{formatRulerTime(viewStart + visibleDuration * 0.5)}</span>
        <span>{formatRulerTime(viewStart + visibleDuration * 0.75)}</span>
        <span>{formatRulerTime(viewStart + visibleDuration)}</span>
      </div>
    </div>
  );
};
