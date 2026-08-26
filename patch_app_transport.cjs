const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<TransportBar\n                  isPlaying={isPlaying}/,
  '<div className="sticky bottom-16 md:static z-30"><TransportBar\n                  isPlaying={isPlaying}'
);

code = code.replace(
  /                  onToggleMono={handleToggleMono}\n                \/>/,
  '                  onToggleMono={handleToggleMono}\n                /></div>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app transport sticky');
