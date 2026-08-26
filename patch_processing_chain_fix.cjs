const fs = require('fs');
let code = fs.readFileSync('src/components/ProcessingChain.tsx', 'utf8');

if (!code.includes('const [localMeters, setLocalMeters]')) {
  code = code.replace(
    /const bypasses = externalBypasses \|\| internalBypasses;/,
    "const bypasses = externalBypasses || internalBypasses;\n  const [localMeters, setLocalMeters] = React.useState<any>(null);\n  React.useEffect(() => {\n    const handler = (e: any) => setLocalMeters(e.detail);\n    audioEngineEvents.addEventListener('meterupdate', handler);\n    return () => audioEngineEvents.removeEventListener('meterupdate', handler);\n  }, []);\n  const activeMeters = localMeters || meterData;"
  );
}

code = code.replace(/meterData\.gainReductionDb/g, 'activeMeters?.gainReductionDb');

fs.writeFileSync('src/components/ProcessingChain.tsx', code);
console.log('patched processing chain react');
