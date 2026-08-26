const fs = require('fs');
let code = fs.readFileSync('src/components/MasteringKnobs.tsx', 'utf8');
code = code.replace(
  /import \{ soundHaptics \} from '\.\.\/utils\/sound-haptics';/,
  "import { soundHaptics } from '../utils/sound-haptics';\nimport { RotaryKnob } from './RotaryKnob';"
);

const newKnobsHtml = `
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative">
        {isBypassed && (
          <div className="absolute inset-0 z-10 bg-[var(--bg-secondary)]/50 backdrop-blur-[1px]" />
        )}
        
        {/* Analog EQ Section */}
        <div className="space-y-6 bg-[var(--bg-primary)] p-5 rounded-sm border border-[var(--border-subtle)] shadow-inner">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2">
            <span className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
              3-Band Parametric EQ
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">RBJ Biquad</span>
          </div>

          <div className="flex items-center justify-around gap-2">
            <RotaryKnob
              label="Low Shelf"
              value={params.low}
              min={-12}
              max={12}
              step={0.1}
              defaultValue={0}
              unit="dB"
              color="cyan"
              onChange={(v) => handleSliderChange('low', v)}
              disabled={isBypassed}
            />
            <RotaryKnob
              label="Mid Peak"
              value={params.mid}
              min={-12}
              max={12}
              step={0.1}
              defaultValue={0}
              unit="dB"
              color="green"
              onChange={(v) => handleSliderChange('mid', v)}
              disabled={isBypassed}
            />
            <RotaryKnob
              label="High Shelf"
              value={params.high}
              min={-12}
              max={12}
              step={0.1}
              defaultValue={0}
              unit="dB"
              color="cyan"
              onChange={(v) => handleSliderChange('high', v)}
              disabled={isBypassed}
            />
          </div>
        </div>

        {/* Dynamics & Maximizer Section */}
        <div className="space-y-6 bg-[var(--bg-primary)] p-5 rounded-sm border border-[var(--border-subtle)] shadow-inner">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2">
            <span className="text-xs font-bold font-mono text-[var(--accent-lime)] uppercase tracking-wider">
              Dynamics & Maximizer
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">Feedback Comp</span>
          </div>

          <div className="flex items-center justify-around gap-2">
            <RotaryKnob
              label="Threshold"
              value={params.threshold}
              min={-60}
              max={0}
              step={0.5}
              defaultValue={-24}
              unit="dB"
              color="amber"
              onChange={(v) => handleSliderChange('threshold', v)}
              disabled={isBypassed}
            />
            <RotaryKnob
              label="Ratio"
              value={params.ratio}
              min={1}
              max={20}
              step={0.1}
              defaultValue={2}
              unit=":1"
              color="violet"
              onChange={(v) => handleSliderChange('ratio', v)}
              disabled={isBypassed}
            />
            <RotaryKnob
              label="Makeup"
              value={params.gain}
              min={0}
              max={24}
              step={0.1}
              defaultValue={0}
              unit="dB"
              color="red"
              onChange={(v) => handleSliderChange('gain', v)}
              disabled={isBypassed}
            />
          </div>
        </div>
      </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\};/,
  newKnobsHtml + '\n    </div>\n  );\n};'
);

fs.writeFileSync('src/components/MasteringKnobs.tsx', code);
console.log('patched knobs');
