const fs = require('fs');
let code = fs.readFileSync('src/components/WaveformHero.tsx', 'utf8');

code = code.replace(
  /currentTime,\n  duration,/,
  'currentTime = 0,\n  duration,'
);

fs.writeFileSync('src/components/WaveformHero.tsx', code);
console.log('patched waveform default time');
