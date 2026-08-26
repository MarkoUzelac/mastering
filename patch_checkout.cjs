const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

code = code.replace(
  /<img src="https:\/\/upload.wikimedia.org\/wikipedia\/commons\/f\/f2\/Google_Pay_Logo.svg" alt="GPay" className="h-3" \/>/g,
  `<img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Play" className="h-3" />\n                    <span className="text-[10px] font-bold ml-1">Play Billing</span>`
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
console.log('patched checkout');
