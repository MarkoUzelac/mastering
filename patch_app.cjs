const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /onOpenSettingsModal=\{.*?\}/g,
  `onOpenSettingsModal={() => handleOpenAccount('subscription')}
        onOpenAdmin={() => {}}
        onOpenBilling={() => handleOpenAccount('subscription')}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app');
