const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /seo\.title/g,
  'getSeoInfo().title'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app ui 2');
