const fs = require('fs');
let code = fs.readFileSync('src/legal/PrivacyPolicyView.tsx', 'utf8');

const regex = /\{\/\* 5\. Data Subject Rights \*\/\}[\s\S]*?\{\/\* 6\. Supervisory Authority \*\/\}/;
code = code.replace(regex, '{/* 6. Supervisory Authority */}');
code = code.replace('6. Right to Lodge a Complaint', '5. Right to Lodge a Complaint');

fs.writeFileSync('src/legal/PrivacyPolicyView.tsx', code);
console.log('patched privacy 3');
