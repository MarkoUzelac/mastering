const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

code = code.replace(
  /Clicking checkout will open the Google Pay dialog to complete your purchase securely./g,
  "Clicking checkout will open the Google Play Billing dialog to complete your purchase securely via your Google account or mobile carrier."
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
console.log('patched checkout2');
