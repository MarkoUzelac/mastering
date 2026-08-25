import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../utils/audio-engine';
import { Activity, BarChart2, Radio } from 'lucide-react';

interface SpectrumVisualizerProps {
  isPlaying: boolean;
  isBypassed: boolean;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  isPlaying,
  isBypassed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'spectrum' | 'oscilloscope'>('spectrum');

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Phosphor CRT persistent dark screen
      ctx.fillStyle = '#030d06';
      ctx.fillRect(0, 0, width, height);

      // Subtle phosphor CRT grid
      ctx.strokeStyle = '#072410';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const data = audioEngine.getAnalyserData();

      if (!isPlaying || !data) {
        // Idle phosphor trace line
        ctx.strokeStyle = '#0d381c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.fillStyle = '#008833';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DSP SPECTRUM ANALYZER IDLE — PRESS PLAY', width / 2, height / 2 - 10);

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (viewMode === 'spectrum') {
        const { outputFreq, inputFreq } = data;
        const binCount = outputFreq.length;
        const barWidth = width / (binCount / 2);

        // 1. Draw Dry / Input reference bars (dim ghost line)
        ctx.fillStyle = 'rgba(0, 100, 40, 0.35)';
        for (let i = 0; i < binCount / 2; i++) {
          const val = inputFreq[i] / 255;
          const barHeight = val * (height - 20);
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }

        // 2. Draw Mastered Phosphor Spectrum with Glowing Phosphor Green Bars
        ctx.fillStyle = isBypassed ? '#006622' : '#00ff66';
        ctx.shadowColor = isBypassed ? 'transparent' : 'rgba(0, 255, 102, 0.7)';
        ctx.shadowBlur = isBypassed ? 0 : 8;

        for (let i = 0; i < binCount / 2; i++) {
          const val = outputFreq[i] / 255;
          const barHeight = val * (height - 20);
          const x = i * barWidth;
          const y = height - barHeight;

          ctx.fillRect(x, y, barWidth - 1, barHeight);

          // Top peak phosphor dot
          if (val > 0.05) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 2, barWidth - 1, 2);
            ctx.fillStyle = isBypassed ? '#006622' : '#00ff66';
          }
        }
        ctx.shadowBlur = 0;
      } else {
        // Oscilloscope Mode with phosphor CRT beam effect
        const { outputTime } = data;
        const sliceWidth = width / outputTime.length;

        ctx.lineWidth = 2;
        ctx.strokeStyle = isBypassed ? '#008833' : '#00ff66';
        ctx.shadowColor = isBypassed ? 'transparent' : 'rgba(0, 255, 102, 0.8)';
        ctx.shadowBlur = isBypassed ? 0 : 10;

        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < outputTime.length; i++) {
          const v = outputTime[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isBypassed, viewMode]);

  return (
    <div className="bg-[#07170c] rounded-sm p-4 border border-[#0d381c] shadow-lg crt-overlay">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#00ff66] flex items-center gap-1.5 glow-phosphor">
            <Radio className="w-3.5 h-3.5" />
            Live FFT Spectrum & CRT Oscilloscope
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#030d06] p-0.5 rounded-sm border border-[#0f4020] text-[11px] font-mono">
          <button
            onClick={() => setViewMode('spectrum')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer font-semibold ${
              viewMode === 'spectrum'
                ? 'bg-[#0f4020] text-[#00ff66] shadow-sm'
                : 'text-[#00aa44] hover:text-[#00ff66]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            FFT Spectrum
          </button>
          <button
            onClick={() => setViewMode('oscilloscope')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer font-semibold ${
              viewMode === 'oscilloscope'
                ? 'bg-[#0f4020] text-[#00ff66] shadow-sm'
                : 'text-[#00aa44] hover:text-[#00ff66]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Oscilloscope
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-[800/180] select-none rounded-sm overflow-hidden border border-[#0f4020]">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full block bg-[#030d06]"
        />
      </div>
    </div>
  );
};
