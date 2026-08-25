import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Split } from 'lucide-react';
import { AudioTrackInfo } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface WaveformHeroProps {
  currentTrack: AudioTrackInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBypassed: boolean;
  onSeek: (time: number) => void;
  loopRegion?: { start: number; end: number; enabled: boolean };
  onToggleLoop?: () => void;
}

export const WaveformHero: React.FC<WaveformHeroProps> = ({
  currentTrack,
  currentTime,
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
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const lastScrubTickRef = useRef<number>(0);

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

    const playheadRatio = duration > 0 ? currentTime / duration : 0;
    const playheadX = playheadRatio * width;

    // Optional Loop / Section Region Highlight (A/B)
    if (loopRegion.enabled && duration > 0) {
      const startX = (loopRegion.start / duration) * width;
      const endX = (loopRegion.end / duration) * width;
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
        const x = i * barWidth;
        const norm = i / numBars;
        const env = Math.sin(norm * Math.PI);
        const rand = 0.3 + 0.7 * Math.abs(Math.sin(i * 12.3));
        const barH = env * rand * maxAmp;

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? '#C7FF18' : '#4C1D95';
        ctx.fillRect(x + 1, midY - barH, barWidth - 1.5, barH * 2);
      }
    } else {
      const { mins, maxs, numBuckets } = waveformPeaks;
      const barWidth = Math.max(1, width / numBuckets);

      for (let i = 0; i < numBuckets; i++) {
        const x = (i / numBuckets) * width;
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
      ctx.strokeStyle = '#C7FF18';
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
  }, [waveformPeaks, currentTime, duration, isBypassed, isPlaying, loopRegion, zoomLevel]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    soundHaptics.playSliderTick(1800);
    onSeek(ratio * duration);
    setIsDragging(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    setHoverX(x);
    setHoverTime(ratio * duration);

    if (isDragging) {
      const nowMs = Date.now();
      if (nowMs - lastScrubTickRef.current > 70) {
        lastScrubTickRef.current = nowMs;
        soundHaptics.playSliderTick(1600);
      }
      onSeek(ratio * duration);
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

  const totalDuration = duration > 0 ? duration : 225.782;

  return (
    <div className="bg-[#0D0E0C] border border-[#222420] rounded-xl p-3 sm:p-3.5 space-y-2 shadow-sm">
      {/* Top Header of Card: Timeline, Loop & Zoom */}
      <div className="flex items-center justify-between text-xs font-mono text-[#A5A69F]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7F000]" />
            Timeline
          </span>
          <span className="text-[10px] text-[#686A63]">|</span>
          <span className="text-[#D4FF5C] font-medium tabular-nums">
            {formatPrecisionTime(currentTime)}
          </span>
          <span className="text-[#686A63]">/</span>
          <span className="text-[#686A63] tabular-nums">{formatPrecisionTime(totalDuration)}</span>
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
                  ? 'bg-[#B7F000]/20 text-[#D4FF5C] border border-[#B7F000]/40'
                  : 'text-[#686A63] hover:text-[#A5A69F] bg-[#151714]'
              }`}
              title="Toggle A/B Loop Region"
            >
              <Split className="w-3 h-3" />
              <span>A/B</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 bg-[#151714] border border-[#222420] rounded p-0.5">
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setZoomLevel((z) => Math.max(1, z - 0.5));
              }}
              className="p-1 text-[#686A63] hover:text-[#E5E7EB] rounded transition cursor-pointer active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 text-[#A5A69F] font-mono">{zoomLevel}x</span>
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setZoomLevel((z) => Math.min(4, z + 0.5));
              }}
              className="p-1 text-[#686A63] hover:text-[#E5E7EB] rounded transition cursor-pointer active:scale-95"
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
        className="relative w-full h-32 sm:h-40 rounded-lg overflow-hidden bg-[#07090C] border border-[#181C22] cursor-crosshair select-none touch-none"
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
            className="absolute top-2 -translate-x-1/2 px-1.5 py-0.5 bg-[#151714] border border-[#2F353C] rounded text-[10px] font-mono text-[#F2F2EE] pointer-events-none shadow-md z-10 tabular-nums"
            style={{ left: `${hoverX}px` }}
          >
            {formatPrecisionTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time Markers Ruler */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#686A63] select-none">
        <span>0:00</span>
        <span>{formatRulerTime(totalDuration * 0.25)}</span>
        <span>{formatRulerTime(totalDuration * 0.5)}</span>
        <span>{formatRulerTime(totalDuration * 0.75)}</span>
        <span>{formatRulerTime(totalDuration)}</span>
      </div>
    </div>
  );
};
