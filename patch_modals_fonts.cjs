const fs = require('fs');

let auth = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');
auth = auth.replace(
  /<h2 className="text-2xl font-bold text-\[var\(--text-primary\)\] tracking-tight">/g,
  '<h2 className="text-3xl font-bold font-serif text-[var(--text-primary)] tracking-tight">'
);
fs.writeFileSync('src/components/AuthModal.tsx', auth);

let pricing = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');
pricing = pricing.replace(
  /<h2 className="text-2xl md:text-3xl font-bold text-\[var\(--text-primary\)\] tracking-tight">/g,
  '<h2 className="text-3xl md:text-4xl font-bold font-serif text-[var(--text-primary)] tracking-tight">'
);
fs.writeFileSync('src/components/PricingModal.tsx', pricing);

let checkout = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');
checkout = checkout.replace(
  /<h2 className="text-2xl font-bold text-\[var\(--text-primary\)\]">/g,
  '<h2 className="text-3xl font-bold font-serif text-[var(--text-primary)]">'
);
fs.writeFileSync('src/components/CheckoutModal.tsx', checkout);

console.log('patched modals fonts');
