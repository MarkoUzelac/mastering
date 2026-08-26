const fs = require('fs');
let code = fs.readFileSync('src/components/TransportBar.tsx', 'utf8');

if (!code.includes('import { audioEngineEvents }')) {
  code = code.replace(
    /import \{ soundHaptics \} from '\.\.\/utils\/sound-haptics';/,
    "import { soundHaptics } from '../utils/sound-haptics';\nimport { audioEngineEvents } from '../utils/audio-engine';"
  );
}

if (!code.includes('const [localTime, setLocalTime]')) {
  code = code.replace(
    /const \[volume, setVolume\] = useState<number>\(1\.0\);/,
    "const [volume, setVolume] = useState<number>(1.0);\n  const [localTime, setLocalTime] = useState<number>(0);\n  useEffect(() => {\n    const handler = (e: any) => setLocalTime(e.detail.currentTime);\n    audioEngineEvents.addEventListener('timeupdate', handler);\n    return () => audioEngineEvents.removeEventListener('timeupdate', handler);\n  }, []);\n  const activeTime = localTime;"
  );
}

code = code.replace(/formatTimecode\(currentTime\)/g, 'formatTimecode(activeTime)');
code = code.replace(/currentTime - 5/g, 'activeTime - 5');
code = code.replace(/currentTime \+ 5/g, 'activeTime + 5');

fs.writeFileSync('src/components/TransportBar.tsx', code);
console.log('patched transport bar');
