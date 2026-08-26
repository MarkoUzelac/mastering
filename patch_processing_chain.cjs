const fs = require('fs');
let code = fs.readFileSync('src/components/ProcessingChain.tsx', 'utf8');

if (!code.includes('import { audioEngineEvents }')) {
  code = code.replace(
    /import \{ PhosphorSlider \} from '\.\/PhosphorSlider';/,
    "import { PhosphorSlider } from './PhosphorSlider';\nimport { audioEngineEvents } from '../utils/audio-engine';"
  );
}

if (!code.includes('const [localMeters, setLocalMeters]')) {
  code = code.replace(
    /const \{ eq, dynamics, saturation, stereo, limiter \} = isBypassed;/,
    "const { eq, dynamics, saturation, stereo, limiter } = isBypassed;\n  const [localMeters, setLocalMeters] = React.useState<any>(null);\n  React.useEffect(() => {\n    const handler = (e: any) => setLocalMeters(e.detail);\n    audioEngineEvents.addEventListener('meterupdate', handler);\n    return () => audioEngineEvents.removeEventListener('meterupdate', handler);\n  }, []);\n  const activeMeters = localMeters || meterData;"
  );
}

code = code.replace(/meterData\?\.gainReductionDb/g, 'activeMeters?.gainReductionDb');

fs.writeFileSync('src/components/ProcessingChain.tsx', code);
console.log('patched processing chain');
