const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /<span className="text-sm font-black tracking-widest text-\[var\(--text-primary\)\] uppercase">/,
  '<span className="text-xl font-bold font-serif tracking-wide text-[var(--text-primary)]">'
);

fs.writeFileSync('src/components/Header.tsx', code);
console.log('patched header');
