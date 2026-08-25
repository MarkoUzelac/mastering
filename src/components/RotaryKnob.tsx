import React, { useState, useRef, useCallback } from 'react';

export type KnobAccentColor = 'cyan' | 'green' | 'amber' | 'violet' | 'red' | 'purple' | 'gray';

interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  displayValue?: string | number;
  color?: KnobAccentColor;
  size?: 'sm' | 'md' | 'lg';
  onChange: (value: number) => void;
  disabled?: boolean;
}

const COLOR_MAP: Record<KnobAccentColor, { arc: string; glow: string; text: string; dot: string }> = {
  cyan: {
    arc: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.4)',
    text: '#22D3EE',
    dot: '#67E8F9',
  },
  green: {
    arc: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: '#34D399',
    dot: '#6EE7B7',
  },
  amber: {
    arc: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: '#FBBF24',
    dot: '#FDE68A',
  },
  violet: {
    arc: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.4)',
    text: '#A78BFA',
    dot: '#C4B5FD',
  },
  purple: {
    arc: '#9333EA',
    glow: 'rgba(147, 51, 234, 0.4)',
    text: '#C084FC',
    dot: '#E9D5FF',
  },
  red: {
    arc: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    text: '#F87171',
    dot: '#FCA5A5',
  },
  gray: {
    arc: '#9CA3AF',
    glow: 'rgba(156, 163, 175, 0.3)',
    text: '#E5E7EB',
    dot: '#F3F4F6',
  },
};

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  defaultValue = 0,
  unit = '',
  displayValue,
  color = 'cyan',
  size = 'md',
  onChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  const colors = COLOR_MAP[color] || COLOR_MAP.cyan;

  // Knob sizes
  const dimensions = {
    sm: { diameter: 38, radius: 15, stroke: 2.5, cx: 19, cy: 19 },
    md: { diameter: 44, radius: 17, stroke: 3, cx: 22, cy: 22 },
    lg: { diameter: 52, radius: 21, stroke: 3.5, cx: 26, cy: 26 },
  }[size];

  // Map value to normalized fraction 0..1
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Angles in degrees (-135° to +135°, total 270° sweep)
  const startAngle = -135;
  const endAngle = 135;
  const currentAngle = startAngle + fraction * (endAngle - startAngle);

  // Convert polar coordinates to Cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  // Generate SVG arc path
  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const bgArcPath = describeArc(dimensions.cx, dimensions.cy, dimensions.radius, startAngle, endAngle);
  const activeArcPath =
    currentAngle > startAngle
      ? describeArc(dimensions.cx, dimensions.cy, dimensions.radius, startAngle, currentAngle)
      : '';

  // Needle / indicator dot position
  const indicatorPos = polarToCartesian(dimensions.cx, dimensions.cy, dimensions.radius - 5, currentAngle);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 140; // 140px vertical drag for full range
      const rawNewVal = startValRef.current + deltaY * sensitivity;
      const clampedVal = Math.max(min, Math.min(max, rawNewVal));
      const steppedVal = Math.round(clampedVal / step) * step;
      onChange(Number(steppedVal.toFixed(2)));
    },
    [isDragging, disabled, max, min, step, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  const handleDoubleClick = () => {
    if (disabled) return;
    onChange(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(max, Number((value + step).toFixed(2))));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(min, Number((value - step).toFixed(2))));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(defaultValue);
    }
  };

  const formattedDisplay =
    displayValue !== undefined
      ? displayValue
      : `${value > 0 && unit.includes('dB') ? '+' : ''}${value.toFixed(1)}${unit ? ' ' + unit : ''}`;

  return (
    <div
      className={`flex flex-col items-center select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-ns-resize'}`}
      onDoubleClick={handleDoubleClick}
      title={`${label}: ${formattedDisplay} (Drag up/down, Double-click to reset)`}
    >
      {/* Upper Label */}
      <span className="text-[11px] font-medium text-[#9A9EA6] tracking-tight mb-1 text-center truncate max-w-[68px]">
        {label}
      </span>

      {/* Rotary Dial */}
      <div
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative flex items-center justify-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[#8B5CF6] transition-transform ${
          isDragging ? 'scale-105' : 'hover:scale-[1.02]'
        }`}
        style={{ width: dimensions.diameter, height: dimensions.diameter }}
      >
        <svg
          width={dimensions.diameter}
          height={dimensions.diameter}
          className="overflow-visible pointer-events-none"
        >
          {/* Background Track Arc */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="#1F242D"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          {activeArcPath && (
            <path
              d={activeArcPath}
              fill="none"
              stroke={colors.arc}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
              style={{
                filter: isDragging ? `drop-shadow(0 0 4px ${colors.glow})` : undefined,
              }}
            />
          )}

          {/* Inner Knob Face */}
          <circle
            cx={dimensions.cx}
            cy={dimensions.cy}
            r={dimensions.radius - 3.5}
            fill="#0F1216"
            stroke="#282E38"
            strokeWidth="1"
          />

          {/* Radial Center Shadow */}
          <circle
            cx={dimensions.cx}
            cy={dimensions.cy}
            r={dimensions.radius - 6}
            fill="#0A0C0F"
          />

          {/* Value Indicator Dot */}
          <circle
            cx={indicatorPos.x}
            cy={indicatorPos.y}
            r={1.8}
            fill={colors.dot}
            style={{
              filter: `drop-shadow(0 0 2px ${colors.glow})`,
            }}
          />
        </svg>
      </div>

      {/* Numeric Readout */}
      <span className="text-[11px] font-mono font-medium text-[#E5E7EB] mt-1 tracking-tight tabular-nums text-center">
        {formattedDisplay}
      </span>
    </div>
  );
};
