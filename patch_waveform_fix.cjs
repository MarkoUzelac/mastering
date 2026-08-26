const fs = require('fs');
let code = fs.readFileSync('src/components/WaveformHero.tsx', 'utf8');

code = code.replace(
  /activeTime,\n  duration,/,
  'currentTime,\n  duration,'
);

code = code.replace(
  /currentTime: number;\n  duration: number;/,
  'currentTime?: number;\n  duration: number;'
);

fs.writeFileSync('src/components/WaveformHero.tsx', code);
console.log('patched waveform props');
