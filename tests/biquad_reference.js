import { writeFile } from 'node:fs/promises';

const PI = 3.141592653589793238462643383279502884;
const SAMPLE_RATE = 48000;
const NUM_SAMPLES = 100000;

class Biquad {
  constructor() { this.b0=1; this.b1=0; this.b2=0; this.a1=0; this.a2=0; this.z1=0; this.z2=0; }
  normalize(b0,b1,b2,a0,a1,a2) { this.b0=b0/a0; this.b1=b1/a0; this.b2=b2/a0; this.a1=a1/a0; this.a2=a2/a0; }
  setLowShelf(sr,f,g,q) {
    const A=Math.pow(10,g/40), w0=2*PI*f/sr, cs=Math.cos(w0), sn=Math.sin(w0), alpha=sn/(2*q), sqrtA=Math.sqrt(A);
    this.normalize(A*((A+1)-(A-1)*cs+2*sqrtA*alpha),2*A*((A-1)-(A+1)*cs),A*((A+1)-(A-1)*cs-2*sqrtA*alpha),(A+1)+(A-1)*cs+2*sqrtA*alpha,-2*((A-1)+(A+1)*cs),(A+1)+(A-1)*cs-2*sqrtA*alpha);
  }
  setPeaking(sr,f,g,q) {
    const A=Math.pow(10,g/40), w0=2*PI*f/sr, cs=Math.cos(w0), sn=Math.sin(w0), alpha=sn/(2*q);
    this.normalize(1+alpha*A,-2*cs,1-alpha*A,1+alpha/A,-2*cs,1-alpha/A);
  }
  setHighShelf(sr,f,g,q) {
    const A=Math.pow(10,g/40), w0=2*PI*f/sr, cs=Math.cos(w0), sn=Math.sin(w0), alpha=sn/(2*q), sqrtA=Math.sqrt(A);
    this.normalize(A*((A+1)+(A-1)*cs+2*sqrtA*alpha),-2*A*((A-1)+(A+1)*cs),A*((A+1)+(A-1)*cs-2*sqrtA*alpha),(A+1)-(A-1)*cs+2*sqrtA*alpha,2*((A-1)-(A+1)*cs),(A+1)-(A-1)*cs-2*sqrtA*alpha);
  }
  process(x) {
    const y=this.b0*x+this.z1;
    const z1=this.b1*x-this.a1*y+this.z2;
    const z2=this.b2*x-this.a2*y;
    this.z1=z1; this.z2=z2;
    return Math.fround(y);
  }
}

const input=new Float32Array(NUM_SAMPLES);
for(let i=0;i<NUM_SAMPLES;i++){const t=i/SAMPLE_RATE; input[i]=0.25*Math.sin(2*Math.PI*440*t)+0.15*Math.sin(2*Math.PI*1000*t);}
input[0]=1;
const low=new Biquad(), mid=new Biquad(), high=new Biquad();
low.setLowShelf(SAMPLE_RATE,120,3,0.707); mid.setPeaking(SAMPLE_RATE,1200,-2,0.8); high.setHighShelf(SAMPLE_RATE,8500,1.5,0.707);
const output=new Float32Array(NUM_SAMPLES);
for(let i=0;i<NUM_SAMPLES;i++){let y=low.process(input[i]); y=mid.process(y); y=high.process(y); output[i]=y;}
await writeFile('tests/reference-input.bin',Buffer.from(input.buffer));
await writeFile('tests/reference-output.bin',Buffer.from(output.buffer));
console.log(`Generated ${NUM_SAMPLES} samples`);
