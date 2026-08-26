const fs = require('fs');
let code = fs.readFileSync('src/components/AccountModal.tsx', 'utf8');

const balanceHtml = `
              <div className="bg-[#121418] p-5 rounded-sm border border-[var(--border-subtle)] flex items-center justify-between mt-4">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono tracking-wider">Account Balance</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">€0.00</div>
                </div>
                <div className="p-3 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-lime)]">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
`;

code = code.replace(
  /\{\/\* Payment Method \*\/\}/,
  balanceHtml + '\n              {/* Payment Method */}'
);

fs.writeFileSync('src/components/AccountModal.tsx', code);
console.log('patched account modal');
