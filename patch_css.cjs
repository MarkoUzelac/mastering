const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');
code = code.replace(
  /--font-mono: 'JetBrains Mono', monospace;/,
  "--font-mono: 'JetBrains Mono', monospace;\n  --font-serif: 'Playfair Display', serif;"
);
code += `\n.font-serif { font-family: var(--font-serif); }\n`;
fs.writeFileSync('src/index.css', code);
console.log('patched index.css');
