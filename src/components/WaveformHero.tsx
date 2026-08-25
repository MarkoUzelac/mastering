import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AudioTrackInfo } from '../types';

interface WaveformHeroProps {
  currentTrack: AudioTrackInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBypassed: boolean;
  onSeek: (time: number) => void;
}

export const WaveformHero: React.FC<WaveformHeroProps> = ({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  isBypassed,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

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

    if (!waveformPeaks) {
      // Synthetic stereo preview waveform when no file is loaded yet
      const numBars = 180;
      const barWidth = width / numBars;
      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const norm = i / numBars;
        const env = Math.sin(norm * Math.PI);
        const rand = 0.3 + 0.7 * Math.abs(Math.sin(i * 12.3));
        const barH = env * rand * maxAmp;

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? '#A78BFA' : '#4C1D95';
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
          ctx.fillStyle = isPlayed ? '#C4B5FD' : '#6D28D9';
        }
        ctx.fillRect(x, yTop, barWidth, barH);
      }
    }

    // Playhead Line & Glow
    if (duration > 0 || isPlaying) {
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top & Bottom Handles
      ctx.fillStyle = '#C4B5FD';
      ctx.beginPath();
      ctx.arc(playheadX, 3, 3, 0, Math.PI * 2);
      ctx.arc(playheadX, height - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformPeaks, currentTime, duration, isBypassed, isPlaying]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0E1116] border border-[#1E2530] rounded-xl p-3.5 space-y-2 shadow-sm">
      {/* Waveform Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-36 sm:h-44 rounded-lg overflow-hidden bg-[#07090C] border border-[#181C22] cursor-crosshair select-none"
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
          className="w-full h-full block"
        />

        {/* Hover Time Tooltip */}
        {hoverTime !== null && hoverX !== null && (
          <div
            className="absolute top-2 -translate-x-1/2 px-1.5 py-0.5 bg-[#14171B] border border-[#2F353C] rounded text-[10px] font-mono text-[#F4F3EF] pointer-events-none shadow-md z-10"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time Markers Ruler */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#646A73] select-none">
        <span>0:00</span>
        <span>0:30</span>
        <span>1:00</span>
        <span>1:30</span>
        <span>2:00</span>
        <span>2:30</span>
        <span>3:00</span>
        <span>3:30</span>
        <span>{formatTime(duration || 225.782)}</span>
      </div>
    </div>
  );
};
