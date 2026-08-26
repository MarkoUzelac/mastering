const fs = require('fs');
let code = fs.readFileSync('src/components/MasteringKnobs.tsx', 'utf8');

code = code.replace(
  /import \{ RotaryKnob \} from '\.\/RotaryKnob';/,
  "import { RotaryKnob } from './RotaryKnob';\nimport { motion } from 'motion/react';"
);

code = code.replace(
  /<div className="space-y-6 bg-\[var\(--bg-primary\)\] p-5 rounded-sm border border-\[var\(--border-subtle\)\] shadow-inner">/g,
  '<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 bg-[var(--bg-primary)] p-5 rounded-sm border border-[var(--border-subtle)] shadow-2xl">'
);

fs.writeFileSync('src/components/MasteringKnobs.tsx', code);
console.log('patched animations on knobs');
