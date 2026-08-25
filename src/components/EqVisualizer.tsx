import React, { useMemo } from 'react';
import { MasteringParams } from '../types';
import { Sliders } from 'lucide-react';

interface EqVisualizerProps {
  params: MasteringParams;
  onParamChange: (param: keyof MasteringParams, value: number) => void;
  isBypassed: boolean;
}

export const EqVisualizer: React.FC<EqVisualizerProps> = ({
  params,
  onParamChange,
  isBypassed,
}) => {
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 25, left: 40 };

  const minFreq = 20;
  const maxFreq = 20000;
  const minDb = -15;
  const maxDb = 15;

  const freqToX = (freq: number) => {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(Math.max(minFreq, Math.min(maxFreq, freq)));
    const ratio = (logFreq - logMin) / (logMax - logMin);
    return padding.left + ratio * (width - padding.left - padding.right);
  };

  const dbToY = (db: number) => {
    const clampedDb = Math.max(minDb, Math.min(maxDb, db));
    const ratio = (clampedDb - minDb) / (maxDb - minDb);
    return height - padding.bottom - ratio * (height - padding.top - padding.bottom);
  };

  // Evaluate magnitude response for Biquads
  const curvePoints = useMemo(() => {
    const points: string[] = [];
    const numPoints = 180;

    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const freq = minFreq * Math.pow(maxFreq / minFreq, ratio);

      if (isBypassed) {
        points.push(`${freqToX(freq)},${dbToY(0)}`);
        continue;
      }

      // Simplified biquad magnitude approximation
      // 1. Low Shelf (120 Hz)
      const lowGain = params.low;
      const lowResponse = lowGain / (1 + Math.pow(freq / 120, 2));

      // 2. Peaking (1200 Hz, Q=0.8)
      const midGain = params.mid;
      const midRatio = freq / 1200;
      const midBandwidth = 1.2;
      const midResponse = midGain * Math.exp(-Math.pow(Math.log2(midRatio) / midBandwidth, 2));

      // 3. High Shelf (8500 Hz)
      const highGain = params.high;
      const highResponse = highGain * (Math.pow(freq / 8500, 2) / (1 + Math.pow(freq / 8500, 2)));

      const totalDb = lowResponse + midResponse + highResponse;
      points.push(`${freqToX(freq).toFixed(1)},${dbToY(totalDb).toFixed(1)}`);
    }

    return points.join(' ');
  }, [params.low, params.mid, params.high, isBypassed]);

  const gridFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  const gridDbs = [-12, -6, 0, 6, 12];

  return (
    <div className="bg-[#07170c] rounded-sm p-4 border border-[#0d381c] shadow-lg relative overflow-hidden crt-overlay">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#00ff66] glow-phosphor">
            Biquad EQ Frequency Response
          </span>
          {isBypassed && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#1a0808] text-[#ff5555] border border-[#882222] rounded">
              BYPASSED
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#00cc55] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] inline-block shadow-sm shadow-[#00ff66]"></span>
            LOW: 120Hz ({params.low > 0 ? `+${params.low.toFixed(1)}` : params.low.toFixed(1)} dB)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00dd55] inline-block shadow-sm shadow-[#00dd55]"></span>
            MID: 1.2kHz ({params.mid > 0 ? `+${params.mid.toFixed(1)}` : params.mid.toFixed(1)} dB)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#88ffaa] inline-block shadow-sm shadow-[#88ffaa]"></span>
            HIGH: 8.5kHz ({params.high > 0 ? `+${params.high.toFixed(1)}` : params.high.toFixed(1)} dB)
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[800/220] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full rounded-sm bg-[#030d06] border border-[#0f4020]"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="phosphorEqGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ff66" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#00ff66" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#030d06" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Vertical Frequency Grid Lines */}
          {gridFreqs.map((freq) => {
            const x = freqToX(freq);
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
            return (
              <g key={freq}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#0a2914"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={height - 8}
                  fill="#008833"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Horizontal dB Grid Lines */}
          {gridDbs.map((db) => {
            const y = dbToY(db);
            const isZero = db === 0;
            return (
              <g key={db}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isZero ? '#00aa44' : '#0a2914'}
                  strokeWidth={isZero ? 1.5 : 1}
                  strokeDasharray={isZero ? undefined : '2 2'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill={isZero ? '#00ff66' : '#007722'}
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="JetBrains Mono"
                >
                  {db > 0 ? `+${db}` : db}
                </text>
              </g>
            );
          })}

          {/* EQ Filled Area */}
          <polygon
            points={`${padding.left},${dbToY(0)} ${curvePoints} ${width - padding.right},${dbToY(0)}`}
            fill="url(#phosphorEqGradient)"
          />

          {/* EQ Response Curve Line */}
          <polyline
            points={curvePoints}
            fill="none"
            stroke="#00ff66"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0px 0px 4px rgba(0, 255, 102, 0.8))"
          />

          {/* Filter Handles */}
          {!isBypassed && (
            <>
              {/* Low Shelf Handle */}
              <circle
                cx={freqToX(120)}
                cy={dbToY(params.low)}
                r="6"
                fill="#00ff66"
                stroke="#030d06"
                strokeWidth="2"
                className="cursor-ns-resize shadow-md"
              />
              {/* Mid Peak Handle */}
              <circle
                cx={freqToX(1200)}
                cy={dbToY(params.mid)}
                r="6"
                fill="#00dd55"
                stroke="#030d06"
                strokeWidth="2"
                className="cursor-ns-resize shadow-md"
              />
              {/* High Shelf Handle */}
              <circle
                cx={freqToX(8500)}
                cy={dbToY(params.high)}
                r="6"
                fill="#88ffaa"
                stroke="#030d06"
                strokeWidth="2"
                className="cursor-ns-resize shadow-md"
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
