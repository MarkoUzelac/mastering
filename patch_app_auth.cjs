const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// import AuthModal
code = code.replace(
  /import \{ AccountModal \} from '\.\/components\/AccountModal';/,
  "import { AccountModal } from './components/AccountModal';\nimport { AuthModal } from './components/AuthModal';"
);

// state
code = code.replace(
  /const \[isStemsModalOpen, setIsStemsModalOpen\] = useState<boolean>\(false\);/,
  "const [isStemsModalOpen, setIsStemsModalOpen] = useState<boolean>(false);\n  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);"
);

// effect for auto pop up
const useEffectBlock = `
  useEffect(() => {
    if (!loading && !user) {
      const hasPrompted = localStorage.getItem('mastering_auth_prompted');
      if (!hasPrompted) {
        setIsAuthModalOpen(true);
        localStorage.setItem('mastering_auth_prompted', 'true');
      }
    }
  }, [loading, user]);
`;
code = code.replace(
  /const \[activeAdvancedModal, setActiveAdvancedModal\] = useState<\n    'eq' \| 'compressor' \| 'saturation' \| 'stereo' \| 'limiter' \| null\n  >\(null\);/,
  "const [activeAdvancedModal, setActiveAdvancedModal] = useState<'eq' | 'compressor' | 'saturation' | 'stereo' | 'limiter' | null>(null);\n" + useEffectBlock
);

// modal rendering
code = code.replace(
  /<AccountModal\s*isOpen=\{isAccountModalOpen\}/,
  "<AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />\n      <AccountModal isOpen={isAccountModalOpen}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app auth');
