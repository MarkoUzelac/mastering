const fs = require('fs');
let code = fs.readFileSync('src/legal/PrivacyPolicyView.tsx', 'utf8');

const regex = /<div className="space-y-4">[\s\n]*<h2 className="text-lg font-semibold text-\[var\(--text-primary\)\]">5\. Your Statutory Rights Under GDPR<\/h2>[\s\S]*?<\/div>\s*(?=<div className="space-y-4">\s*<h2)/;
const match = code.match(regex);
if (match) {
    code = code.replace(regex, '');
    code = code.replace('6. Third-Party', '5. Third-Party');
    code = code.replace('7. Cookies', '6. Cookies');
    code = code.replace('8. Changes', '7. Changes');
    fs.writeFileSync('src/legal/PrivacyPolicyView.tsx', code);
    console.log('patched privacy 2');
} else {
    console.log('still could not find');
}
