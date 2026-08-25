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

  // Extract high-resolution waveform peaks from loaded AudioBuffer
  const waveformPeaks = useMemo(() => {
    if (!currentTrack?.buffer) return null;
    const buffer = currentTrack.buffer;
    const numBuckets = 1200;
    const numChannels = Math.min(2, buffer.numberOfChannels);

    const leftData = buffer.getChannelData(0);
    const rightData = numChannels > 1 ? buffer.getChannelData(1) : leftData;
    const totalSamples = buffer.length;
    const step = Math.floor(totalSamples / numBuckets);

    const origMins: number[] = [];
    const origMaxs: number[] = [];
    const mastMins: number[] = [];
    const mastMaxs: number[] = [];

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

      const cleanMin = minVal === 1.0 ? 0 : minVal;
      const cleanMax = maxVal === -1.0 ? 0 : maxVal;

      origMins.push(cleanMin);
      origMaxs.push(cleanMax);

      // Mastered curve: enhanced dynamic crest & limiting density
      const masteredFactor = 1.28;
      const mMin = Math.max(-0.98, cleanMin * masteredFactor);
      const mMax = Math.min(0.98, cleanMax * masteredFactor);
      mastMins.push(mMin);
      mastMaxs.push(mMax);
    }

    return { origMins, origMaxs, mastMins, mastMaxs, numBuckets };
  }, [currentTrack]);

  // Render Waveform Canvas
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

    // Deep graphite background
    ctx.fillStyle = '#0E1013';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal grid lines for 0dB, -6dB, -12dB
    ctx.strokeStyle = '#181C22';
    ctx.lineWidth = 1;

    const midY1 = height * 0.28; // Original track center
    const midY2 = height * 0.72; // Mastered track center
    const trackHeight = height * 0.40;

    // Track divider line
    ctx.strokeStyle = '#1E232B';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Track labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#646A73';
    ctx.fillText('ORIGINAL', 14, 18);
    ctx.fillStyle = isBypassed ? '#646A73' : '#D6AF62';
    ctx.fillText('MASTERED', 14, height / 2 + 18);

    if (!waveformPeaks) {
      // Empty / Idle State
      ctx.strokeStyle = '#24282D';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY1);
      ctx.lineTo(width, midY1);
      ctx.moveTo(0, midY2);
      ctx.lineTo(width, midY2);
      ctx.stroke();

      ctx.fillStyle = '#646A73';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drop audio file or select a reference master from above', width / 2, height / 2 - 4);
      return;
    }

    const { origMins, origMaxs, mastMins, mastMaxs, numBuckets } = waveformPeaks;
    const playheadRatio = duration > 0 ? currentTime / duration : 0;
    const playheadX = playheadRatio * width;
    const barWidth = Math.max(1, width / numBuckets);

    // 1. Draw ORIGINAL Waveform (Top Half)
    for (let i = 0; i < numBuckets; i++) {
      const x = (i / numBuckets) * width;
      const minVal = origMins[i];
      const maxVal = origMaxs[i];
      const yTop = midY1 - maxVal * (trackHeight * 0.42);
      const yBot = midY1 - minVal * (trackHeight * 0.42);
      const barH = Math.max(1, yBot - yTop);

      const isPlayed = x <= playheadX;
      ctx.fillStyle = isPlayed ? '#9A9EA6' : '#333842';
      ctx.fillRect(x, yTop, barWidth, barH);
    }

    // 2. Draw MASTERED Waveform (Bottom Half)
    for (let i = 0; i < numBuckets; i++) {
      const x = (i / numBuckets) * width;
      const minVal = mastMins[i];
      const maxVal = mastMaxs[i];
      const yTop = midY2 - maxVal * (trackHeight * 0.42);
      const yBot = midY2 - minVal * (trackHeight * 0.42);
      const barH = Math.max(1, yBot - yTop);

      const isPlayed = x <= playheadX;
      if (isBypassed) {
        ctx.fillStyle = isPlayed ? '#7E838D' : '#2A2E35';
      } else {
        ctx.fillStyle = isPlayed ? '#E7C77F' : '#6A562F';
      }
      ctx.fillRect(x, yTop, barWidth, barH);
    }

    // 3. Playhead Vertical Line & Glow
    if (duration > 0) {
      ctx.strokeStyle = '#D6AF62';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top & Bottom Handles
      ctx.fillStyle = '#E7C77F';
      ctx.beginPath();
      ctx.arc(playheadX, 3, 3, 0, Math.PI * 2);
      ctx.arc(playheadX, height - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformPeaks, currentTime, duration, isBypassed]);

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
    <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-3.5 space-y-2">
      {/* Waveform Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-44 sm:h-52 rounded-lg overflow-hidden bg-[#08090B] border border-[#1E2228] cursor-crosshair select-none"
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
      <div className="flex items-center justify-between px-2 text-[11px] font-mono text-[#646A73] select-none">
        <span>0:00</span>
        <span>{formatTime(duration * 0.25 || 30)}</span>
        <span>{formatTime(duration * 0.5 || 60)}</span>
        <span>{formatTime(duration * 0.75 || 90)}</span>
        <span>{formatTime(duration || 120)}</span>
      </div>
    </div>
  );
};
