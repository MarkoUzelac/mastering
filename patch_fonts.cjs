const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(
  /<link href="https:\/\/fonts.googleapis.com\/css2\?family=JetBrains\+Mono:wght@400;500;600;700&family=Plus\+Jakarta\+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">/,
  '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">'
);
fs.writeFileSync('index.html', code);
console.log('patched fonts');
