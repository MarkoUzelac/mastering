cat << 'CSS' > src/index.css
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Mathematical Spacing Scale */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-24: 96px;
  --spacing-32: 128px;
  --spacing-40: 160px;
  
  /* Border Radii */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
}

@layer base {
  :root {
    --bg-primary: #090A08;
    --bg-secondary: #0D0E0C;
    --bg-elevated: #151714;
    
    --border-subtle: #222420;
    
    --text-primary: #F2F2EE;
    --text-secondary: #A5A69F;
    --text-tertiary: #686A63;
    
    --accent-lime: #B7F000;
    --accent-lime-hover: #C7FF18;
    --radius-sm: 4px;
    --radius-xs: 2px;
  }

  /* DARK THEME (Phosphor) */
  :root[data-studio-skin="phosphor-dark"] {
    --bg-primary: #090A08;
    --bg-secondary: #0D0E0C;
    --bg-elevated: #151714;
    
    --border-subtle: #222420;
    
    --text-primary: #F2F2EE;
    --text-secondary: #A5A69F;
    --text-tertiary: #686A63;
    
    --accent-lime: #B7F000;
    --accent-lime-hover: #C7FF18;
  }

  /* LIGHT THEME (Phosphor) */
  :root[data-studio-skin="phosphor-light"] {
    --bg-primary: #F5F5F3;
    --bg-secondary: #FFFFFF;
    --bg-elevated: #FFFFFF;
    
    --border-subtle: #EBE0E6;
    
    --text-primary: #0A0A0B;
    --text-secondary: #4B4D45;
    --text-tertiary: #686A63;
    
    --accent-lime: #B7F000;
    --accent-lime-hover: #98C700;
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow-x: hidden;
    letter-spacing: -0.01em;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  code, pre, .font-mono, .num-tabular {
    font-family: var(--font-mono);
    font-feature-settings: 'tnum' on, 'zero' on;
  }
}

/* Tabular figures for telemetry & numbers */
.num-tabular {
  font-feature-settings: 'tnum' on, 'zero' on;
  font-variant-numeric: tabular-nums;
}

/* Custom minimal scrollbars */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: var(--bg-primary);
}
::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: var(--radius-xs);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* Premium Audio Sliders (Horizontal) */
input[type=range] {
  -webkit-appearance: none;
  background: transparent;
}
input[type=range]:focus {
  outline: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  border: 2px solid var(--bg-secondary);
  margin-top: -5px;
  transition: transform 0.1s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-lime);
  box-shadow: 0 0 8px rgba(183, 240, 0, 0.4);
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: var(--bg-elevated);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

/* Vertical range slider for EQ faders */
input[type=range].fader-vertical {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 4px;
  height: 100%;
  padding: 0 10px;
}
input[type=range].fader-vertical::-webkit-slider-thumb {
  margin-left: -5px;
  margin-top: 0;
  width: 18px;
  height: 10px;
  border-radius: var(--radius-xs);
  background: var(--text-primary);
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  border: 1px solid var(--bg-primary);
}
input[type=range].fader-vertical::-webkit-slider-thumb:hover {
  background: var(--accent-lime);
  box-shadow: 0 0 10px rgba(183, 240, 0, 0.6);
}
input[type=range].fader-vertical::-webkit-slider-runnable-track {
  width: 4px;
  height: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

/* Signature Outline Typography */
.text-outline {
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px var(--text-tertiary);
}
.text-outline:hover {
  -webkit-text-stroke: 1px var(--text-secondary);
}
.text-outline-active {
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px var(--accent-lime);
}

@layer components {
  .btn-primary {
    @apply flex items-center justify-center gap-2 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[#090A08] font-mono font-bold transition-colors cursor-pointer rounded-xs min-h-[44px] px-6 py-2;
  }
  .btn-secondary {
    @apply flex items-center justify-center gap-2 bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-mono font-medium transition-colors cursor-pointer rounded-xs min-h-[44px] px-6 py-2;
  }
  .btn-icon {
    @apply flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer rounded-xs min-h-[44px] min-w-[44px] p-2;
  }
}
CSS
