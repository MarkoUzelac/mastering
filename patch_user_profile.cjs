const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfileMenu.tsx', 'utf8');

code = code.replace(
  /import \{ LogIn, LogOut, Settings, LayoutDashboard, Crown, CreditCard \} from 'lucide-react';/,
  "import { LogIn, LogOut, Settings, LayoutDashboard, Crown, CreditCard } from 'lucide-react';\nimport { GoogleIcon } from './Icons';"
);

code = code.replace(
  /<LogIn className="w-4 h-4" \/>/,
  '<GoogleIcon className="w-4 h-4" />'
);

code = code.replace(
  /Sign In with Google/g,
  'Sign In with Google'
);

code = code.replace(
  /className="flex items-center gap-2 px-3 py-1\.5 bg-\[var\(--accent-lime\)\]\/10 hover:bg-\[var\(--accent-lime\)\]\/20 text-\[var\(--accent-lime-hover\)\] border border-\[var\(--accent-lime\)\]\/30 rounded-sm text-sm font-semibold transition-colors"/,
  'className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-sm text-sm font-semibold transition-colors shadow-sm"'
);

fs.writeFileSync('src/components/UserProfileMenu.tsx', code);
console.log('patched user profile');
