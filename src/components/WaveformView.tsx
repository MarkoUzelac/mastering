import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AudioTrackInfo } from '../types';
import { Waves, ZoomIn, ZoomOut, Eye, Volume2 } from 'lucide-react';

interface WaveformViewProps {
  currentTrack: AudioTrackInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBypassed: boolean;
  onSeek: (time: number) => void;
}

export const WaveformView: React.FC<WaveformViewProps> = ({
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showChannelsSeparated, setShowChannelsSeparated] = useState<boolean>(true);

  // Compute waveform peaks from the loaded AudioBuffer
  const waveformPeaks = useMemo(() => {
    if (!currentTrack?.buffer) return null;
    const buffer = currentTrack.buffer;
    const numBuckets = 1000;
    const numChannels = Math.min(2, buffer.numberOfChannels);

    const leftData = buffer.getChannelData(0);
    const rightData = numChannels > 1 ? buffer.getChannelData(1) : leftData;
    const totalSamples = buffer.length;
    const step = Math.floor(totalSamples / numBuckets);

    const leftMin: number[] = [];
    const leftMax: number[] = [];
    const rightMin: number[] = [];
    const rightMax: number[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const start = i * step;
      const end = Math.min(start + step, totalSamples);
      let minL = 1.0;
      let maxL = -1.0;
      let minR = 1.0;
      let maxR = -1.0;

      for (let j = start; j < end; j += 4) {
        const valL = leftData[j];
        const valR = rightData[j];
        if (valL < minL) minL = valL;
        if (valL > maxL) maxL = valL;
        if (valR < minR) minR = valR;
        if (valR > maxR) maxR = valR;
      }

      leftMin.push(minL === 1.0 ? 0 : minL);
      leftMax.push(maxL === -1.0 ? 0 : maxL);
      rightMin.push(minR === 1.0 ? 0 : minR);
      rightMax.push(maxR === -1.0 ? 0 : maxR);
    }

    return { leftMin, leftMax, rightMin, rightMax, numBuckets };
  }, [currentTrack]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark phosphor CRT background
    ctx.fillStyle = '#051409';
    ctx.fillRect(0, 0, width, height);

    // Subtle CRT background grid
    ctx.strokeStyle = '#0a2914';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!waveformPeaks) {
      // Idle line
      ctx.strokeStyle = '#0f4020';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.fillStyle = '#227744';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO AUDIO LOADED — SELECT DEMO OR IMPORT WAV', width / 2, height / 2 - 10);
      return;
    }

    const { leftMin, leftMax, rightMin, rightMax, numBuckets } = waveformPeaks;
    const playheadRatio = duration > 0 ? currentTime / duration : 0;
    const playheadX = playheadRatio * width;

    if (showChannelsSeparated) {
      // Split into Left (top half) and Right (bottom half)
      const halfHeight = height / 2;
      const midL = halfHeight / 2;
      const midR = halfHeight + halfHeight / 2;

      // Channel divider
      ctx.strokeStyle = '#0f4020';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      ctx.lineTo(width, halfHeight);
      ctx.stroke();

      // Left channel
      for (let i = 0; i < numBuckets; i++) {
        const x = (i / numBuckets) * width;
        const minL = leftMin[i];
        const maxL = leftMax[i];
        const yTop = midL - maxL * (halfHeight * 0.45);
        const yBot = midL - minL * (halfHeight * 0.45);

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? '#00ff66' : '#006622';
        ctx.fillRect(x, yTop, Math.max(1, width / numBuckets), Math.max(1, yBot - yTop));
      }

      // Right channel
      for (let i = 0; i < numBuckets; i++) {
        const x = (i / numBuckets) * width;
        const minR = rightMin[i];
        const maxR = rightMax[i];
        const yTop = midR - maxR * (halfHeight * 0.45);
        const yBot = midR - minR * (halfHeight * 0.45);

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? '#00ee55' : '#00551c';
        ctx.fillRect(x, yTop, Math.max(1, width / numBuckets), Math.max(1, yBot - yTop));
      }

      // Labels
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00aa44';
      ctx.fillText('CH 1 (L)', 8, 14);
      ctx.fillText('CH 2 (R)', 8, halfHeight + 14);
    } else {
      // Combined mono / stereo envelope
      const midY = height / 2;
      for (let i = 0; i < numBuckets; i++) {
        const x = (i / numBuckets) * width;
        const maxVal = Math.max(Math.abs(leftMax[i]), Math.abs(rightMax[i]));
        const minVal = Math.min(leftMin[i], rightMin[i]);

        const yTop = midY - maxVal * (height * 0.45);
        const yBot = midY - minVal * (height * 0.45);

        const isPlayed = x <= playheadX;
        ctx.fillStyle = isPlayed ? '#00ff66' : '#005522';
        ctx.fillRect(x, yTop, Math.max(1, width / numBuckets), Math.max(1, yBot - yTop));
      }
    }

    // Draw Glowing Playhead Cursor
    if (duration > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead top triangle handle
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }, [waveformPeaks, currentTime, duration, showChannelsSeparated, isBypassed]);

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
    if (!isDragging || duration <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
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
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-[#07170c] rounded-sm p-4 border border-[#0d381c] shadow-lg relative overflow-hidden crt-overlay">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-[#00ff66]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#00ff66] glow-phosphor">
            Stereo Waveform & Scrub Timeline
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setShowChannelsSeparated(!showChannelsSeparated)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#030d06] text-[#00dd55] hover:text-[#00ff66] border border-[#0f4020] transition cursor-pointer text-[10px]"
            title="Toggle L/R split or merged waveform view"
          >
            <Eye className="w-3 h-3" />
            <span>{showChannelsSeparated ? 'Stereo L/R Split' : 'Combined Mono'}</span>
          </button>
          <span className="text-[#00aa44] text-[11px]">
            {formatRulerTime(currentTime)} / {formatRulerTime(duration)}
          </span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[800/140] rounded-sm overflow-hidden border border-[#0f4020] bg-[#030d06] cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block"
        />

        {/* Time ruler overlay on bottom */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#030a05]/80 border-t border-[#0f4020] flex justify-between px-2 text-[9px] font-mono text-[#00aa44] pointer-events-none">
          <span>0:00.0</span>
          <span>{formatRulerTime(duration * 0.25)}</span>
          <span>{formatRulerTime(duration * 0.5)}</span>
          <span>{formatRulerTime(duration * 0.75)}</span>
          <span>{formatRulerTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
