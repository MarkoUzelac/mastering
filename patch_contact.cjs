const fs = require('fs');
let code = fs.readFileSync('src/legal/ContactView.tsx', 'utf8');

const updatedSubmit = `
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    
    // Use mailto for client-side sending without backend API keys
    const subject = encodeURIComponent(\`[\${topic.toUpperCase()}] Inquiry from \${name || 'User'}\`);
    const body = encodeURIComponent(\`Name: \${name}\\nEmail: \${email}\\nTopic: \${topic}\\n\\nMessage:\\n\${message}\`);
    window.location.href = \`mailto:info@markouzelacuzy.com?subject=\${subject}&body=\${body}\`;
    
    setIsSubmitted(true);
  };
`;
code = code.replace(/const handleSubmit = \([^\{]+\{\s*e\.preventDefault\(\);\s*if \(\!email \|\| \!message\) return;\s*setIsSubmitted\(true\);\s*\};/m, updatedSubmit);

const whatsappCard = `
          <div className="p-4 rounded-sm bg-[#121418] border border-[var(--border-subtle)] space-y-1.5">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Direct Chat</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">WhatsApp Support</div>
            <a href="https://wa.me/385989630462" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-lime)] underline block flex items-center gap-1 mt-1">
              <MessageSquare className="w-3.5 h-3.5" /> +385 98 963 0462
            </a>
            <div className="text-[11px] text-[var(--text-tertiary)]">Fast text support</div>
          </div>
`;
code = code.replace(/<div className="text-\[11px\] text-\[var\(--text-tertiary\)\]">Data subject access \& erasure<\/div>\s*<\/div>/, `<div className="text-[11px] text-[var(--text-tertiary)]">Data subject access & erasure</div>\n          </div>\n${whatsappCard}`);

fs.writeFileSync('src/legal/ContactView.tsx', code);
console.log('patched contact view');
