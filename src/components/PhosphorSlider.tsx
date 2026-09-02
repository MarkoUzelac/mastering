import React, { useCallback, useRef } from 'react';

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

const COLOR_MAP: Record<string, string> = {
  cyan: '#06B6D4',
  green: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  red: '#EF4444',
  lime: 'var(--accent-lime)',
};

export const PhosphorSlider: React.FC<PhosphorSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  unit = '',
  displayValue,
  disabled = false,
  onChange,
  color = 'lime',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const accentColor = COLOR_MAP[color] || 'var(--accent-lime)';
  const range = max - min;
  const fraction = range === 0 ? 0 : Math.max(0, Math.min(1, (value - min) / range));
  const precision = step < 1 ? Math.max(1, String(step).split('.')[1]?.length ?? 1) : 0;

  const emitValue = useCallback((nextValue: number) => {
    const clamped = Math.max(min, Math.min(max, nextValue));
    const quantized = Math.round((clamped - min) / step) * step + min;
    onChange(Number(quantized.toFixed(Math.min(precision + 2, 6))));
  }, [max, min, onChange, precision, step]);

  const updateFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current || disabled || range === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const usable = Math.max(1, rect.width);
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / usable));
    emitValue(min + position * range);
  }, [disabled, emitValue, min, range]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let nextValue: number | null = null;
    switch (event.key) {
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
    event.preventDefault();
    emitValue(nextValue);
  };

  const handleDoubleClick = () => {
    const resetValue = defaultValue ?? (min <= 0 && max >= 0 ? 0 : min);
    emitValue(resetValue);
  };

  const formattedDisplay = displayValue !== undefined
    ? String(displayValue)
    : `${value > 0 && min < 0 ? '+' : ''}${value.toFixed(precision)}${unit}`;

  return (
    <div className={`flex w-full min-w-0 select-none flex-col gap-1.5 touch-none ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
      <div className="flex min-w-0 items-baseline justify-between gap-3 px-0.5">
        <span className="min-w-0 truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)]">{label}</span>
        <span className="shrink-0 text-[11px] font-mono font-semibold tabular-nums" style={{ color: accentColor }}>
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
        aria-valuetext={formattedDisplay}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`group relative flex h-11 w-full min-w-0 items-center rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${disabled ? '' : 'cursor-ew-resize'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="pointer-events-none absolute inset-x-1 h-1 rounded-full bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)]" />
        {min < 0 && max > 0 && (
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--text-tertiary)] opacity-60"
            style={{ left: `${((0 - min) / range) * 100}%` }}
          />
        )}
        <div
          className="pointer-events-none absolute left-1 h-1 rounded-full transition-[width] duration-75"
          style={{
            width: `calc(${fraction * 100}% - 4px)`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 70%, transparent), ${accentColor})`,
          }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bg-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-transform duration-100 group-hover:scale-110 group-active:scale-125"
          style={{
            left: `calc(${fraction * 100}% )`,
            border: `2px solid ${disabled ? 'var(--text-tertiary)' : accentColor}`,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 10%, transparent), 0 2px 8px rgba(0,0,0,0.45)`,
          }}
        />
      </div>

      {defaultValue !== undefined && (
        <div className="flex items-center justify-between px-0.5 text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>{min}</span>
          <button
            type="button"
            className="min-h-[24px] rounded px-1.5 py-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-1 focus-visible:outline-[var(--accent-lime)]"
            onClick={() => emitValue(defaultValue)}
            disabled={disabled}
            aria-label={`Reset ${label}`}
          >
            RESET
          </button>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};
