const fs = require('fs');
let code = fs.readFileSync('src/components/WaveformHero.tsx', 'utf8');

if (!code.includes('import { audioEngineEvents }')) {
  code = code.replace(
    /import \{ soundHaptics \} from '\.\.\/utils\/sound-haptics';/,
    "import { soundHaptics } from '../utils/sound-haptics';\nimport { audioEngineEvents } from '../utils/audio-engine';"
  );
}

if (!code.includes('const [localTime, setLocalTime]')) {
  code = code.replace(
    /const \[isDragging, setIsDragging\] = useState<boolean>\(false\);/,
    "const [isDragging, setIsDragging] = useState<boolean>(false);\n  const [localTime, setLocalTime] = useState<number>(0);\n  useEffect(() => {\n    const handler = (e: any) => setLocalTime(e.detail.currentTime);\n    audioEngineEvents.addEventListener('timeupdate', handler);\n    return () => audioEngineEvents.removeEventListener('timeupdate', handler);\n  }, []);\n  // Ensure localTime is used instead of currentTime prop\n  const activeTime = localTime;"
  );
}

// Replace currentTime with activeTime in the file where appropriate
code = code.replace(/currentTime - viewStart/g, 'activeTime - viewStart');
code = code.replace(/currentTime \+ 5/g, 'activeTime + 5');
code = code.replace(/currentTime - 5/g, 'activeTime - 5');
code = code.replace(/currentTime,/g, 'activeTime,');
code = code.replace(/formatPrecisionTime\(currentTime\)/g, 'formatPrecisionTime(activeTime)');

fs.writeFileSync('src/components/WaveformHero.tsx', code);
console.log('patched waveform');
