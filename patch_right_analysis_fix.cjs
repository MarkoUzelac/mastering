const fs = require('fs');
let code = fs.readFileSync('src/components/RightAnalysisPanel.tsx', 'utf8');

code = code.replace(
  /const correlationCanvasRef = useRef<HTMLCanvasElement \|const canvasRef = useRef<HTMLCanvasElement \| null>\(null\);/,
  'const correlationCanvasRef = useRef<HTMLCanvasElement | null>(null);\nconst canvasRef = useRef<HTMLCanvasElement | null>(null);'
);

fs.writeFileSync('src/components/RightAnalysisPanel.tsx', code);
console.log('patched right analysis syntax');
