const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

code = code.replace(
  /const isAdmin = profile\?\.role === 'admin';/,
  "const isAdmin = profile?.role === 'admin' || user?.email === 'info@markouzelacuzy.com';"
);

fs.writeFileSync('src/hooks/useAuth.ts', code);
console.log('patched auth hook admin fallback');
