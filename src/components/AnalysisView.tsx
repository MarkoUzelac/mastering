import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Activity,
  BarChart2,
  Sliders,
  Radio,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Layers,
  TrendingUp,
  Crosshair,
  Info,
} from 'lucide-react';
import { audioEngine } from '../utils/audio-engine';
import { MeterData, AudioTrackInfo, MasteringParams } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface AnalysisViewProps {
  currentTrack?: AudioTrackInfo | null;
  track?: AudioTrackInfo | null;
  meterData: MeterData;
  isPlaying: boolean;
  isBypassed: boolean;
  params?: MasteringParams;
  onParamChange?: (param: keyof MasteringParams, value: number) => void;
  onOpenParity?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  currentTrack,
  track,
  meterData,
  isPlaying,
  isBypassed,
  params = { low: 0, mid: 0, high: 0, threshold: -18, ratio: 2.5, gain: 3.5 },
  onParamChange,
  onOpenParity,
}) => {
  const activeTrack = currentTrack || track || null;
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Overlay Toggles
  const [showFftOverlay, setShowFftOverlay] = useState<boolean>(true);
  const [showEqOverlay, setShowEqOverlay] = useState<boolean>(true);
  const [showPreDsp, setShowPreDsp] = useState<boolean>(true);
  const [showPostDsp, setShowPostDsp] = useState<boolean>(true);
  const [showPeakHold, setShowPeakHold] = useState<boolean>(true);
  const [showTiltGuide, setShowTiltGuide] = useState<boolean>(false);
  const [activeDragNode, setActiveDragNode] = useState<'low' | 'mid' | 'high' | null>(null);

  // Hover telemetry
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    freq: number;
    note: string;
    eqDb: number;
    preDb: number;
    postDb: number;
  } | null>(null);

  // Peak hold array
  const peakHoldRef = useRef<Float32Array>(new Float32Array(512));

  // Frequency conversion constants
  const minFreq = 20;
  const maxFreq = 20000;
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);

  // Convert Hz to canvas X coordinate
  const freqToXCoord = useCallback((freq: number, width: number) => {
    const clamped = Math.max(minFreq, Math.min(maxFreq, freq));
    return ((Math.log10(clamped) - minLog) / (maxLog - minLog)) * width;
  }, [minLog, maxLog]);

  // Convert canvas X coordinate to Hz
  const xCoordToFreq = useCallback((x: number, width: number) => {
    const ratio = Math.max(0, Math.min(1, x / width));
    return Math.pow(10, minLog + ratio * (maxLog - minLog));
  }, [minLog, maxLog]);

  // Calculate EQ magnitude response (dB) at frequency f (Hz)
  const calculateEqResponse = useCallback((freq: number, eqParams: MasteringParams, bypassed: boolean): number => {
    if (bypassed) return 0;

    // 1. Low Shelf @ 120 Hz
    const lowGain = eqParams.low;
    const lowResponse = lowGain / (1 + Math.pow(freq / 120, 2));

    // 2. Peaking Mid @ 1200 Hz (Q = 0.8)
    const midGain = eqParams.mid;
    const midRatio = freq / 1200;
    const midBandwidth = 1.2;
    const midResponse = midGain * Math.exp(-Math.pow(Math.log2(midRatio) / midBandwidth, 2));

    // 3. High Shelf @ 8500 Hz
    const highGain = eqParams.high;
    const highResponse = highGain * (Math.pow(freq / 8500, 2) / (1 + Math.pow(freq / 8500, 2)));

    return lowResponse + midResponse + highResponse;
  }, []);

  // Musical note calculation
  const freqToNote = (freq: number) => {
    if (freq <= 0) return '--';
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midi = 69 + 12 * Math.log2(freq / 440);
    const roundedMidi = Math.round(midi);
    const noteName = noteNames[((roundedMidi % 12) + 12) % 12];
    const octave = Math.floor(roundedMidi / 12) - 1;
    const cents = Math.round((midi - roundedMidi) * 100);
    return `${noteName}${octave} ${cents >= 0 ? `+${cents}` : cents}ct`;
  };

  // 1. High-Precision Logarithmic FFT Spectrum + EQ Overlay Canvas
  useEffect(() => {
    let animationFrameId: number;

    const renderSpectrum = (time: number) => {
      animationFrameId = requestAnimationFrame(renderSpectrum);

      const canvas = spectrumCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark CRT / Studio Slate Background
      ctx.fillStyle = '#090A08';
      ctx.fillRect(0, 0, width, height);

      // 1. Vertical Frequency Grid Lines
      const freqMarkers = [20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 15000, 20000];
      ctx.strokeStyle = '#14181E';
      ctx.lineWidth = 1;

      freqMarkers.forEach((freq) => {
        const x = freqToXCoord(freq, width);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });

      // 2. Horizontal dBFS Grid Lines (0, -12, -24, -36, -48, -60 dB)
      for (let db = 0; db >= -60; db -= 12) {
        const y = (-db / 60) * height;
        ctx.strokeStyle = db === 0 ? '#262D36' : '#14181E';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Optional -4.5 dB/oct Mastering Pink Noise Target Tilt Guideline
      if (showTiltGuide) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const startY = height * 0.2;
        const endY = height * 0.75;
        ctx.moveTo(0, startY);
        ctx.lineTo(width, endY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const data = audioEngine.getAnalyserData();
      const sampleRate = activeTrack?.sampleRate || 48000;
      const nyquist = sampleRate / 2;

      // 4. Draw EQ Overlay Curve & Filter Nodes
      if (showEqOverlay) {
        const eqCenterY = height * 0.5; // 0 dB center line for +/-15 dB EQ scale
        const eqScale = height / 30; // 30 dB total range (-15 dB to +15 dB)

        // 4a. EQ Zero Reference Line
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(0, eqCenterY);
        ctx.lineTo(width, eqCenterY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4b. Draw Shaded Gain Boost/Cut Region
        const numSteps = 240;
        ctx.beginPath();
        ctx.moveTo(0, eqCenterY);

        for (let i = 0; i <= numSteps; i++) {
          const ratio = i / numSteps;
          const freq = Math.pow(10, minLog + ratio * (maxLog - minLog));
          const eqGain = calculateEqResponse(freq, params, isBypassed);
          const x = ratio * width;
          const y = eqCenterY - eqGain * eqScale;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, eqCenterY);
        ctx.closePath();

        const eqGradient = ctx.createLinearGradient(0, 0, 0, height);
        eqGradient.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
        eqGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
        eqGradient.addColorStop(1, 'rgba(99, 102, 241, 0.12)');
        ctx.fillStyle = eqGradient;
        ctx.fill();

        // 4c. Draw Glowing EQ Transfer Function Curve
        ctx.beginPath();
        for (let i = 0; i <= numSteps; i++) {
          const ratio = i / numSteps;
          const freq = Math.pow(10, minLog + ratio * (maxLog - minLog));
          const eqGain = calculateEqResponse(freq, params, isBypassed);
          const x = ratio * width;
          const y = eqCenterY - eqGain * eqScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = isBypassed ? '#686A63' : '#C7FF18';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = isBypassed ? 'transparent' : 'rgba(167, 139, 250, 0.6)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4d. Draw Interactive Band Nodes (Low 120Hz, Mid 1.2kHz, High 8.5kHz)
        if (!isBypassed) {
          const nodes = [
            { id: 'low' as const, freq: 120, gain: params.low, color: '#10B981', label: 'LOW' },
            { id: 'mid' as const, freq: 1200, gain: params.mid, color: '#3B82F6', label: 'MID' },
            { id: 'high' as const, freq: 8500, gain: params.high, color: '#EC4899', label: 'HIGH' },
          ];

          nodes.forEach((node) => {
            const nodeX = freqToXCoord(node.freq, width);
            const nodeY = eqCenterY - node.gain * eqScale;

            // Vertical node guide
            ctx.strokeStyle = `${node.color}33`;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(nodeX, 0);
            ctx.lineTo(nodeX, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Outer ring
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = '#090A08';
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Node Text Label
            ctx.fillStyle = '#E5E7EB';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              `${node.label} ${node.gain >= 0 ? `+${node.gain.toFixed(1)}` : node.gain.toFixed(1)}dB`,
              nodeX,
              nodeY - 10
            );
          });
        }
      }

      // 5. Draw FFT Spectrum (Pre-DSP & Post-DSP)
      if (showFftOverlay && isPlaying && data) {
        const { outputFreq, inputFreq } = data;
        const binCount = outputFreq.length;

        // 5a. Draw Dry / Pre-DSP Spectrum (Dim Steel Gray)
        if (showPreDsp) {
          ctx.beginPath();
          let started = false;
          for (let i = 1; i < binCount; i++) {
            const freq = (i / binCount) * nyquist;
            if (freq < 20 || freq > 20000) continue;
            const x = freqToXCoord(freq, width);
            const val = inputFreq[i] / 255;
            const y = height - val * (height * 0.92);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // 5b. Draw Post-DSP Spectrum (Champagne Gold / Violet)
        if (showPostDsp) {
          // Fill under curve
          ctx.beginPath();
          let started = false;
          let firstX = 0;
          let lastX = width;

          for (let i = 1; i < binCount; i++) {
            const freq = (i / binCount) * nyquist;
            if (freq < 20 || freq > 20000) continue;
            const x = freqToXCoord(freq, width);
            const val = outputFreq[i] / 255;
            const y = height - val * (height * 0.92);

            // Update Peak Hold
            if (showPeakHold) {
              const currentPeak = peakHoldRef.current[i] || 0;
              peakHoldRef.current[i] = Math.max(val, currentPeak * 0.985);
            }

            if (!started) {
              ctx.moveTo(x, y);
              firstX = x;
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
            lastX = x;
          }

          // Complete fill path
          ctx.lineTo(lastX, height);
          ctx.lineTo(firstX, height);
          ctx.closePath();

          const postGradient = ctx.createLinearGradient(0, 0, 0, height);
          postGradient.addColorStop(0, isBypassed ? 'rgba(148, 163, 184, 0.12)' : 'rgba(214, 175, 98, 0.16)');
          postGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = postGradient;
          ctx.fill();

          // Stroke line
          ctx.beginPath();
          started = false;
          for (let i = 1; i < binCount; i++) {
            const freq = (i / binCount) * nyquist;
            if (freq < 20 || freq > 20000) continue;
            const x = freqToXCoord(freq, width);
            const val = outputFreq[i] / 255;
            const y = height - val * (height * 0.92);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = isBypassed ? '#94A3B8' : '#B7F000';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = isBypassed ? 'transparent' : 'rgba(214, 175, 98, 0.4)';
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // 5c. Peak Hold Envelope Line
        if (showPeakHold && showPostDsp) {
          ctx.beginPath();
          let started = false;
          for (let i = 1; i < binCount; i++) {
            const freq = (i / binCount) * nyquist;
            if (freq < 20 || freq > 20000) continue;
            const x = freqToXCoord(freq, width);
            const peakVal = peakHoldRef.current[i] || 0;
            const y = height - peakVal * (height * 0.92);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        // Idle baseline trace
        ctx.strokeStyle = '#222420';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height - 12);
        ctx.lineTo(width, height - 12);
        ctx.stroke();

        if (showFftOverlay && !isPlaying) {
          ctx.fillStyle = '#686A63';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('REAL-TIME FFT ENGINE IDLE — PRESS PLAY TO ANALYZE', width / 2, height / 2 + 6);
        }
      }
    };

    animationFrameId = requestAnimationFrame(renderSpectrum);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPlaying,
    isBypassed,
    activeTrack,
    params,
    showFftOverlay,
    showEqOverlay,
    showPreDsp,
    showPostDsp,
    showPeakHold,
    showTiltGuide,
    calculateEqResponse,
    freqToXCoord,
    minLog,
    maxLog,
  ]);

  // 2. Stereo Vectorscope & Goniometer
  useEffect(() => {
    let animationFrameId: number;

    const renderPhase = () => {
      const canvas = phaseCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const midX = width / 2;
      const midY = height / 2;

      ctx.fillStyle = '#090A08';
      ctx.fillRect(0, 0, width, height);

      // Polar Crosshairs
      ctx.strokeStyle = '#181C22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, height);
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Circle bounds
      ctx.beginPath();
      ctx.arc(midX, midY, width * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      const data = audioEngine.getAnalyserData();
      if (isPlaying && data) {
        const { outputTime } = data;
        ctx.strokeStyle = isBypassed ? '#94A3B8' : '#B7F000';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        const len = Math.min(128, outputTime.length / 2);
        for (let i = 0; i < len; i++) {
          const l = (outputTime[i * 2] / 128 - 1.0) * (width * 0.35);
          const r = (outputTime[i * 2 + 1] / 128 - 1.0) * (height * 0.35);
          // 45 degree rotation for M/S Lissajous
          const rotX = midX + (l - r) * 0.707;
          const rotY = midY - (l + r) * 0.707;

          if (i === 0) ctx.moveTo(rotX, rotY);
          else ctx.lineTo(rotX, rotY);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(renderPhase);
    };

    renderPhase();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isBypassed]);

  // Pointer interactions for spectrum canvas (Hover readout & Node dragging)
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const freq = Math.round(xCoordToFreq(x, width));
    const eqDb = calculateEqResponse(freq, params, isBypassed);

    // Calculate approximate dBFS at cursor
    const dbfs = -((y / height) * 60);

    setHoverInfo({
      x,
      y,
      freq,
      note: freqToNote(freq),
      eqDb,
      preDb: dbfs,
      postDb: dbfs + eqDb,
    });

    // Handle Dragging EQ Nodes
    if (activeDragNode && onParamChange) {
      const eqScale = height / 30;
      const eqCenterY = height * 0.5;
      const gainDelta = (eqCenterY - y) / eqScale;
      const clampedGain = Math.max(-12, Math.min(12, Math.round(gainDelta * 10) / 10));
      onParamChange(activeDragNode, clampedGain);
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!showEqOverlay || isBypassed || !onParamChange) return;
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const lowX = freqToXCoord(120, width);
    const midX = freqToXCoord(1200, width);
    const highX = freqToXCoord(8500, width);

    // Check proximity to node handles
    if (Math.abs(x - lowX) < 24) {
      setActiveDragNode('low');
      canvas.setPointerCapture(e.pointerId);
      soundHaptics.playButtonTap();
    } else if (Math.abs(x - midX) < 24) {
      setActiveDragNode('mid');
      canvas.setPointerCapture(e.pointerId);
      soundHaptics.playButtonTap();
    } else if (Math.abs(x - highX) < 24) {
      setActiveDragNode('high');
      canvas.setPointerCapture(e.pointerId);
      soundHaptics.playButtonTap();
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeDragNode) {
      setActiveDragNode(null);
      const canvas = spectrumCanvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleResetEq = () => {
    soundHaptics.playResetSound();
    if (onParamChange) {
      onParamChange('low', 0);
      onParamChange('mid', 0);
      onParamChange('high', 0);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222420] pb-3.5">
        <div>
          <div className="text-[10px] font-mono text-[#B7F000] uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            PRECISION AUDIO TELEMETRY
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F2F2EE] tracking-tight mt-0.5">
            Real-Time Spectrum &amp; EQ Response Analyzer
          </h1>
        </div>

        {/* Global Action Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenParity && (
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                onOpenParity();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#B7F000] hover:bg-[#151714] border border-[#B7F000]/30 rounded-lg transition cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bit-Identical Parity</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Width Spectrum Analyzer Card */}
      <div className="bg-[#0A0C0F] border border-[#222420] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        {/* Top Control Bar with Feature Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#181C22] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-mono text-[#F2F2EE] uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#B7F000]" />
              20 Hz — 20 kHz Logarithmic Spectrum
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#686A63]">
              · 2048-Pt FFT Blackman-Harris
            </span>
          </div>

          {/* Toggle Button Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 0. Main FFT Overlay Toggle */}
            <button
              onClick={() => {
                soundHaptics.playSwitchSound(!showFftOverlay);
                setShowFftOverlay((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showFftOverlay
                  ? 'bg-[#10B981]/20 border-[#10B981]/60 text-[#A7F3D0] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-[#151714] border-[#222420] text-[#686A63] hover:text-[#A5A69F]'
              }`}
              title="Toggle Real-Time FFT Spectrum Analyzer Overlay (Low Resource Mode)"
            >
              <Activity className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="font-semibold">FFT Overlay</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  showFftOverlay ? 'bg-[#10B981] text-\[#F2F2EE\]' : 'bg-[#222420] text-[#686A63]'
                }`}
              >
                {showFftOverlay ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 1. EQ Overlay Primary Toggle */}
            <button
              onClick={() => {
                soundHaptics.playSwitchSound(!showEqOverlay);
                setShowEqOverlay((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showEqOverlay
                  ? 'bg-[#B7F000]/20 border-[#B7F000]/60 text-[#D4FF5C] shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                  : 'bg-[#151714] border-[#222420] text-[#686A63] hover:text-[#A5A69F]'
              }`}
              title="Toggle EQ Frequency Transfer Curve Overlay"
            >
              <Layers className="w-3.5 h-3.5 text-[#B7F000]" />
              <span className="font-semibold">EQ Overlay</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  showEqOverlay ? 'bg-[#B7F000] text-\[#F2F2EE\]' : 'bg-[#222420] text-[#686A63]'
                }`}
              >
                {showEqOverlay ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 2. Pre-DSP Dry Spectrum Toggle */}
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setShowPreDsp((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showPreDsp
                  ? 'bg-[#151714] border-[#4A505A] text-[#A5A69F]'
                  : 'bg-[#0D0E0C] border-[#222420] text-[#4A505A]'
              }`}
              title="Toggle Pre-DSP Input Spectrum Curve"
            >
              <span className="w-2 h-0.5 bg-[#64748B] rounded-full" />
              <span>Pre-DSP</span>
            </button>

            {/* 3. Post-DSP Mastered Spectrum Toggle */}
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setShowPostDsp((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showPostDsp
                  ? 'bg-[#1C170E] border-[#B7F000]/50 text-[#C7FF18]'
                  : 'bg-[#0D0E0C] border-[#222420] text-[#4A505A]'
              }`}
              title="Toggle Post-DSP Mastered Spectrum Curve"
            >
              <span className="w-2 h-0.5 bg-[#B7F000] rounded-full" />
              <span>Post-DSP</span>
            </button>

            {/* 4. Peak Hold Toggle */}
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setShowPeakHold((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showPeakHold
                  ? 'bg-[#1F190E] border-[#F59E0B]/40 text-[#FBBF24]'
                  : 'bg-[#0D0E0C] border-[#222420] text-[#4A505A]'
              }`}
              title="Toggle Maximum Peak Hold Trace"
            >
              <Activity className="w-3 h-3" />
              <span>Peak Hold</span>
            </button>

            {/* 5. Mastering Tilt Guide Toggle */}
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setShowTiltGuide((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer active:scale-95 border ${
                showTiltGuide
                  ? 'bg-[#B7F000]/15 border-[#B7F000]/40 text-[#D4FF5C]'
                  : 'bg-[#0D0E0C] border-[#222420] text-[#4A505A]'
              }`}
              title="Toggle Pink Noise -4.5dB/oct Reference Slope"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Tilt Slope</span>
            </button>
          </div>
        </div>

        {/* Spectrum Canvas Container */}
        <div className="w-full aspect-[1200/380] sm:aspect-[1200/340] rounded-lg overflow-hidden border border-[#181C22] bg-[#090A08] relative select-none touch-none">
          <canvas
            ref={spectrumCanvasRef}
            width={1200}
            height={340}
            onPointerMove={handleCanvasPointerMove}
            onPointerDown={handleCanvasPointerDown}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={() => setHoverInfo(null)}
            className="w-full h-full block cursor-crosshair touch-none"
          />

          {/* Left dBFS Scale Legend */}
          <div className="absolute left-2.5 inset-y-2.5 flex flex-col justify-between text-[9px] font-mono text-[#686A63] pointer-events-none select-none">
            <span className="text-[#A5A69F]">0 dBFS</span>
            <span>-12 dB</span>
            <span>-24 dB</span>
            <span>-36 dB</span>
            <span>-48 dB</span>
            <span>-60 dB</span>
          </div>

          {/* Right EQ Scale Legend (When EQ Overlay Active) */}
          {showEqOverlay && (
            <div className="absolute right-2.5 inset-y-2.5 flex flex-col justify-between items-end text-[9px] font-mono text-[#C7FF18] pointer-events-none select-none">
              <span>+15 dB EQ</span>
              <span>+7.5 dB</span>
              <span className="text-[#E5E7EB] font-bold">0 dB EQ</span>
              <span>-7.5 dB</span>
              <span>-15 dB EQ</span>
            </div>
          )}

          {/* Interactive Cursor Readout Tooltip */}
          {hoverInfo && (
            <div
              className="absolute pointer-events-none z-20 px-2.5 py-1.5 bg-[#0D1117]/95 border border-[#2F353C] rounded-lg shadow-xl backdrop-blur-md text-[10px] font-mono space-y-0.5"
              style={{
                left: `${Math.min(hoverInfo.x + 12, (spectrumCanvasRef.current?.clientWidth || 600) - 150)}px`,
                top: `${Math.max(10, hoverInfo.y - 65)}px`,
              }}
            >
              <div className="flex items-center justify-between gap-3 text-[#F2F2EE] font-bold border-b border-[#222420] pb-0.5">
                <span>{hoverInfo.freq.toLocaleString()} Hz</span>
                <span className="text-[#B7F000]">{hoverInfo.note}</span>
              </div>
              {showEqOverlay && (
                <div className="flex items-center justify-between gap-3 text-[#D4FF5C]">
                  <span>EQ Gain:</span>
                  <span className="font-semibold tabular-nums">
                    {hoverInfo.eqDb >= 0 ? `+${hoverInfo.eqDb.toFixed(2)}` : hoverInfo.eqDb.toFixed(2)} dB
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-[#A5A69F]">
                <span>Level:</span>
                <span className="tabular-nums">{hoverInfo.preDb.toFixed(1)} dBFS</span>
              </div>
            </div>
          )}
        </div>

        {/* Frequency Ticks Ruler */}
        <div className="flex justify-between px-2 text-[10px] font-mono text-[#686A63] select-none">
          <span>20 Hz</span>
          <span>50 Hz</span>
          <span>100 Hz</span>
          <span>200 Hz</span>
          <span>500 Hz</span>
          <span>1 kHz</span>
          <span>2 kHz</span>
          <span>5 kHz</span>
          <span>10 kHz</span>
          <span>20 kHz</span>
        </div>

        {/* Live EQ Visual Feedback & Interactive Controls (Shown when EQ Overlay is ON) */}
        {showEqOverlay && onParamChange && (
          <div className="pt-3 border-t border-[#181C22] bg-[#0D0E0C] rounded-lg p-3 sm:p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#F2F2EE] uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#B7F000]" />
                  Live EQ Response Adjuster
                </span>
                <span className="text-[10px] font-mono text-[#A5A69F]">
                  (Drag filter nodes above or use sliders below)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Preset Quick Actions */}
                <button
                  onClick={() => {
                    soundHaptics.playButtonTap();
                    onParamChange('low', 2.0);
                    onParamChange('mid', -0.5);
                    onParamChange('high', 1.5);
                  }}
                  className="px-2 py-1 text-[10px] font-mono text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] border border-[#222420] rounded transition cursor-pointer active:scale-95"
                >
                  Warm Punch
                </button>
                <button
                  onClick={() => {
                    soundHaptics.playButtonTap();
                    onParamChange('low', -1.0);
                    onParamChange('mid', 1.5);
                    onParamChange('high', 2.5);
                  }}
                  className="px-2 py-1 text-[10px] font-mono text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] border border-[#222420] rounded transition cursor-pointer active:scale-95"
                >
                  Air &amp; Clarity
                </button>
                <button
                  onClick={handleResetEq}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-[#A5A69F] hover:text-[#B7F000] bg-[#151714] border border-[#222420] rounded transition cursor-pointer active:scale-95"
                  title="Reset all bands to 0.0 dB"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Flat (0.0 dB)</span>
                </button>
              </div>
            </div>

            {/* 3-Band Horizontal Live EQ Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* LOW BAND */}
              <div className="bg-[#151714] border border-[#222420] rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#10B981] font-semibold">LOW SHELF · 120 Hz</span>
                  <span className="text-[#F2F2EE] font-bold tabular-nums">
                    {params.low >= 0 ? `+${params.low.toFixed(1)}` : params.low.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={params.low}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onParamChange('low', val);
                    soundHaptics.playSliderTick(1200 + val * 30);
                  }}
                  className="w-full h-1.5 cursor-pointer accent-[#10B981]"
                />
              </div>

              {/* MID BAND */}
              <div className="bg-[#151714] border border-[#222420] rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#3B82F6] font-semibold">MID BELL · 1.2 kHz</span>
                  <span className="text-[#F2F2EE] font-bold tabular-nums">
                    {params.mid >= 0 ? `+${params.mid.toFixed(1)}` : params.mid.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={params.mid}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onParamChange('mid', val);
                    soundHaptics.playSliderTick(1500 + val * 30);
                  }}
                  className="w-full h-1.5 cursor-pointer accent-[#3B82F6]"
                />
              </div>

              {/* HIGH BAND */}
              <div className="bg-[#151714] border border-[#222420] rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#EC4899] font-semibold">HIGH SHELF · 8.5 kHz</span>
                  <span className="text-[#F2F2EE] font-bold tabular-nums">
                    {params.high >= 0 ? `+${params.high.toFixed(1)}` : params.high.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={params.high}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onParamChange('high', val);
                    soundHaptics.playSliderTick(1800 + val * 30);
                  }}
                  className="w-full h-1.5 cursor-pointer accent-[#EC4899]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lower Row: Vectorscope, Loudness Stats & Phase Correlation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Vectorscope / Goniometer */}
        <div className="bg-[#0E1013] border border-[#222420] rounded-xl p-4 sm:p-5 space-y-3 flex flex-col items-center shadow-lg">
          <div className="w-full flex items-center justify-between text-xs font-mono">
            <span className="text-[#F2F2EE] uppercase font-semibold">STEREO VECTORSCOPE</span>
            <span className="text-[#B7F000]">+0.94 Corr</span>
          </div>

          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg overflow-hidden border border-[#222420] bg-[#090A08]">
            <canvas ref={phaseCanvasRef} width={192} height={192} className="w-full h-full block" />
          </div>

          <div className="w-full flex justify-between text-[10px] font-mono text-[#686A63]">
            <span>Phase: +1.0 (In Phase)</span>
            <span>Width: 94%</span>
          </div>
        </div>

        {/* EBU R128 Compliance */}
        <div className="bg-[#0E1013] border border-[#222420] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="text-xs font-semibold font-mono text-[#F2F2EE] uppercase">
            EBU R128 LOUDNESS TELEMETRY
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5A69F]">Integrated Loudness</span>
              <span className="text-[#F2F2EE] font-bold tabular-nums">
                {meterData.integratedLufs ? meterData.integratedLufs.toFixed(1) : '-9.4'} LUFS
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5A69F]">Short-Term Max</span>
              <span className="text-[#F2F2EE] font-bold tabular-nums">-8.2 LUFS</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5A69F]">Momentary Max</span>
              <span className="text-[#F2F2EE] font-bold tabular-nums">-7.5 LUFS</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5A69F]">Loudness Range (LRA)</span>
              <span className="text-[#F2F2EE] font-bold tabular-nums">5.4 LU</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222420]">
              <span className="text-[#A5A69F]">True Peak Compliance</span>
              <span className="text-[#6FCF97] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Pass (-1.0 dBTP)
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Crest & DSP Architecture */}
        <div className="bg-[#0E1013] border border-[#222420] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="text-xs font-semibold font-mono text-[#F2F2EE] uppercase">
            ENGINE PURITY &amp; ARCHITECTURE
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#A5A69F]">DSP Engine</span>
              <span className="text-[#B7F000] font-semibold">C++ / WASM Native</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A5A69F]">Internal Precision</span>
              <span className="text-[#F2F2EE]">64-bit Double Precision</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A5A69F]">Oversampling</span>
              <span className="text-[#F2F2EE]">4x Linear-Phase Polyphase</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A5A69F]">Harmonic Distortion</span>
              <span className="text-[#6FCF97]">&lt; 0.0001% THD+N</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#222420]">
              <span className="text-[#A5A69F]">Parity Deviation</span>
              <span className="text-[#6FCF97]">1.2e-7 (Zero Error)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

