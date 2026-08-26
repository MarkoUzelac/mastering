const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /hasAudio=\{!!currentTrack\}/,
  'hasAudio={!!currentTrack}\n        isPlaying={isPlaying}'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched header props');
