const fs = require('fs');
let code = fs.readFileSync('src/legal/PrivacyPolicyView.tsx', 'utf8');

// Find section 5 and remove it
const section5Start = code.indexOf('<h2 className="text-lg font-semibold text-[var(--text-primary)]">5. Your Statutory Rights Under GDPR</h2>');
const section6Start = code.indexOf('<h2 className="text-lg font-semibold text-[var(--text-primary)]">6. Third-Party Data Processors</h2>');

if (section5Start !== -1 && section6Start !== -1) {
    code = code.substring(0, section5Start) + code.substring(section6Start);
    code = code.replace('6. Third-Party', '5. Third-Party');
    code = code.replace('7. Cookies', '6. Cookies');
    code = code.replace('8. Changes', '7. Changes');
    fs.writeFileSync('src/legal/PrivacyPolicyView.tsx', code);
    console.log('patched privacy');
} else {
    console.log('could not find gdpr section');
}
