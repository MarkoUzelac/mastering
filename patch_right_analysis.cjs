const fs = require('fs');
let code = fs.readFileSync('src/components/RightAnalysisPanel.tsx', 'utf8');

if (!code.includes('import { audioEngineEvents }')) {
  code = code.replace(
    /import \{ MeterData \} from '\.\.\/types';/,
    "import { MeterData } from '../types';\nimport { audioEngineEvents } from '../utils/audio-engine';"
  );
}

if (!code.includes('const [localMeters, setLocalMeters]')) {
  code = code.replace(
    /const canvasRef = useRef<HTMLCanvasElement | null>\(null\);/,
    "const canvasRef = useRef<HTMLCanvasElement | null>(null);\n  const [localMeters, setLocalMeters] = React.useState<any>(null);\n  React.useEffect(() => {\n    const handler = (e: any) => setLocalMeters(e.detail);\n    audioEngineEvents.addEventListener('meterupdate', handler);\n    return () => audioEngineEvents.removeEventListener('meterupdate', handler);\n  }, []);\n  const activeMeters = localMeters || meterData;"
  );
}

code = code.replace(/meterData\.outputPeakL/g, 'activeMeters?.outputPeakL');
code = code.replace(/meterData\.outputPeakR/g, 'activeMeters?.outputPeakR');
code = code.replace(/meterData\.integratedLufs/g, 'activeMeters?.integratedLufs');
code = code.replace(/meterData\.momentaryLufs/g, 'activeMeters?.momentaryLufs');

fs.writeFileSync('src/components/RightAnalysisPanel.tsx', code);
console.log('patched right analysis');
