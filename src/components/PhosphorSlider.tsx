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
  
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromPointer(e);
  };
  
  const updateFromPointer = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawVal = min + pos * (max - min);
    const quantized = Math.round(rawVal / step) * step;
    onChange(Number(quantized.toFixed(3)));
  };

  const handleDoubleClick = () => {
    let defaultVal = 0;
    if (min > 0) defaultVal = min;
    if (max < 0) defaultVal = max;
    onChange(defaultVal);
  };

  const formattedDisplay = displayValue !== undefined 
    ? displayValue 
    : (value > 0 && min < 0 ? '+' : '') + value.toFixed(step < 1 ? 1 : 0) + unit;

  return (
    <div className={`flex flex-col gap-1 w-full select-none touch-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="flex justify-between items-baseline px-0.5">
        <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">{label}</span>
        <span className="text-[10px] font-mono font-medium" style={{ color: accentColor }}>
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
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`relative flex h-11 min-h-11 w-full items-center group ${disabled ? '' : 'cursor-ew-resize'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
      >
        {/* Background Ticks (Dotted Line) */}
        <div 
          className="absolute left-0 right-0 h-[1px] opacity-20 pointer-events-none" 
          style={{
            background: 'linear-gradient(to right, var(--text-primary) 50%, transparent 50%)',
            backgroundSize: '4px 100%'
          }} 
        />
        
        {/* Track: remains visually thin while the slider hit area is 44px high. */}
        <div className="absolute left-0 right-0 h-[2px] bg-transparent rounded-full overflow-hidden pointer-events-none">
          {/* Fill */}
          <div 
            className="absolute left-0 top-0 bottom-0 transition-transform duration-75 origin-left"
            style={{ 
              backgroundColor: disabled ? 'var(--text-tertiary)' : accentColor,
              width: '100%',
              transform: `scaleX(${fraction})`
            }}
          />
        </div>
        
        {/* Thumb */}
        <div 
          className="absolute w-3 h-3 rounded-sm bg-[var(--bg-primary)] shadow-[0_0_8px_rgba(0,0,0,0.5)] transform -translate-x-1/2 transition-transform duration-75 group-hover:scale-125 pointer-events-none"
          style={{ 
            left: `${fraction * 100}%`,
            border: `1.5px solid ${disabled ? 'var(--text-tertiary)' : accentColor}`
          }}
        />
      </div>
    </div>
  );
};
