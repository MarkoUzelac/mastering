import React, { useRef } from 'react';

interface PhosphorSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  displayValue?: string | number;
  disabled?: boolean;
  onChange: (val: number) => void;
  color?: string;
  size?: string;
}

export const PhosphorSlider: React.FC<PhosphorSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  displayValue,
  disabled = false,
  onChange,
  color = 'cyan',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const COLOR_MAP: Record<string, string> = {
    cyan: '#06B6D4',
    green: '#10B981',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    red: '#EF4444',
    lime: 'var(--accent-lime)'
  };

  const accentColor = COLOR_MAP[color] || 'var(--accent-lime)';
  const fraction = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));

  const emitValue = (nextValue: number) => {
    const clamped = Math.max(min, Math.min(max, nextValue));
    const quantized = Math.round(clamped / step) * step;
    onChange(Number(quantized.toFixed(3)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromPointer(e);
  };

  const updateFromPointer = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    emitValue(min + pos * (max - min));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    let nextValue: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue = value - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue = value + step;
        break;
      case 'Home':
        nextValue = min;
        break;
      case 'End':
        nextValue = max;
        break;
      case 'PageDown':
        nextValue = value - step * 10;
        break;
      case 'PageUp':
        nextValue = value + step * 10;
        break;
      default:
        return;
    }

    e.preventDefault();
    emitValue(nextValue);
  };

  const handleDoubleClick = () => {
    const defaultVal = min > 0 ? min : max < 0 ? max : 0;
    emitValue(defaultVal);
  };

  const formattedDisplay = displayValue !== undefined
    ? displayValue
    : (value > 0 && min < 0 ? '+' : '') + value.toFixed(step < 1 ? 1 : 0) + unit;

  return (
    <div className={`flex w-full select-none flex-col gap-1 touch-none ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
      <div className="flex items-baseline justify-between px-0.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">{label}</span>
        <span className="text-[10px] font-mono font-medium tabular-nums" style={{ color: accentColor }}>
          {formattedDisplay}
        </span>
      </div>

      <div
        ref={containerRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={String(formattedDisplay)}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`group relative flex h-11 min-h-11 w-full items-center rounded-lg ${disabled ? '' : 'cursor-ew-resize'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        <div
          className="pointer-events-none absolute left-0 right-0 h-px opacity-20"
          style={{
            background: 'linear-gradient(to right, var(--text-primary) 50%, transparent 50%)',
            backgroundSize: '4px 100%'
          }}
        />

        <div className="pointer-events-none absolute left-0 right-0 h-0.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className="absolute inset-y-0 left-0 origin-left transition-transform duration-75"
            style={{
              backgroundColor: disabled ? 'var(--text-tertiary)' : accentColor,
              width: '100%',
              transform: `scaleX(${fraction})`
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 rounded-sm bg-[var(--bg-primary)] shadow-[0_0_0_3px_rgba(255,255,255,0.02),0_0_10px_rgba(0,0,0,0.55)] transition-transform duration-75 group-hover:scale-110"
          style={{
            left: `${fraction * 100}%`,
            border: `1.5px solid ${disabled ? 'var(--text-tertiary)' : accentColor}`
          }}
        />
      </div>
    </div>
  );
};
