const DEFAULT_PARAMS = Object.freeze({
  low: 0,
  mid: 0,
  high: 0,
  threshold: -24,
  ratio: 3,
  gain: 0,
  attack: 25,
  release: 120,
  knee: 4,
  drive: 35,
  warmth: 40,
  mix: 100,
  width: 110,
  balance: 0,
  phaseInvert: false,
  ceiling: -1,
  limiterRelease: 80,
  truePeak: true,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dbToGain = (value) => 10 ** (value / 20);
const gainToDb = (value) => 20 * Math.log10(Math.max(value, 1e-8));

class Biquad {
  constructor(sampleRate, type, frequency, q = 0.707) { this.sampleRate=sampleRate; this.type=type; this.frequency=frequency; this.q=q; this.z1=0; this.z2=0; this.setGain(0); }
  setGain(gainDb) {
    const A=10**(gainDb/40), omega=2*Math.PI*this.frequency/this.sampleRate, c=Math.cos(omega), s=Math.sin(omega), alpha=s/(2*this.q), rootA=Math.sqrt(A);
    let b0,b1,b2,a0,a1,a2;
    if(this.type==='peaking'){ b0=1+alpha*A;b1=-2*c;b2=1-alpha*A;a0=1+alpha/A;a1=-2*c;a2=1-alpha/A; }
    else if(this.type==='lowshelf'){ const slope=2*rootA*alpha;b0=A*((A+1)-(A-1)*c+slope);b1=2*A*((A-1)-(A+1)*c);b2=A*((A+1)-(A-1)*c-slope);a0=(A+1)+(A-1)*c+slope;a1=-2*((A-1)+(A+1)*c);a2=(A+1)+(A-1)*c-slope; }
    else { const slope=2*rootA*alpha;b0=A*((A+1)+(A-1)*c+slope);b1=-2*A*((A-1)+(A+1)*c);b2=A*((A+1)+(A-1)*c-slope);a0=(A+1)-(A-1)*c+slope;a1=2*((A-1)-(A+1)*c);a2=(A+1)-(A-1)*c-slope; }
    this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0;
  }
  process(sample){const output=sample*this.b0+this.z1;this.z1=sample*this.b1-output*this.a1+this.z2;this.z2=sample*this.b2-output*this.a2;return output;}
}

export class MasteringDSP {
  constructor(sampleRate, channelCount=2, params={}) {
    this.sampleRate=sampleRate; this.channelCount=Math.max(1,Math.min(2,channelCount)); this.params={...DEFAULT_PARAMS,...params}; this.envelope=0; this.limiterGain=1; this.previousL=0; this.previousR=0;
    this.filters=Array.from({length:this.channelCount},()=>({low:new Biquad(sampleRate,'lowshelf',120),mid:new Biquad(sampleRate,'peaking',1200,0.8),high:new Biquad(sampleRate,'highshelf',8500)})); this.update(this.params);
  }
  update(params={}) {
    Object.assign(this.params,params);
    this.filters.forEach(f=>{f.low.setGain(this.params.low);f.mid.setGain(this.params.mid);f.high.setGain(this.params.high);});
    this.makeup=dbToGain(this.params.gain); this.attack=Math.exp(-1/(Math.max(1,this.params.attack||25)/1000*this.sampleRate)); this.release=Math.exp(-1/(Math.max(1,this.params.release||120)/1000*this.sampleRate)); this.limitRelease=Math.exp(-1/(Math.max(10,this.params.limiterRelease||80)/1000*this.sampleRate)); this.ceiling=dbToGain(clamp(this.params.ceiling??-1,-60,0));
    this.drive=clamp(this.params.drive??35,0,100);this.warmth=clamp(this.params.warmth??40,0,100);this.mix=clamp(this.params.mix??100,0,100)/100;this.width=clamp(this.params.width??110,0,200)/100;this.balance=clamp(this.params.balance??0,-100,100)/100;this.knee=Math.max(0,this.params.knee??4);this.truePeak=this.params.truePeak!==false;
  }
  saturate(x){if(this.drive===0&&this.warmth===0)return x;const k=1+(2*this.drive+this.warmth)/100;const wet=Math.tanh(x*k)/Math.tanh(k);return x+(wet-x)*this.mix;}
  truePeakEstimate(current,previous){if(!this.truePeak)return Math.abs(current);let peak=Math.max(Math.abs(previous),Math.abs(current));for(let p=1;p<4;p+=1)peak=Math.max(peak,Math.abs(previous+(current-previous)*(p/4)));return peak;}
  compressDb(levelDb){const t=this.params.threshold,r=Math.max(1,this.params.ratio),k=this.knee;if(k<=0)return levelDb>t?t+(levelDb-t)/r:levelDb;const half=k/2;if(levelDb<t-half)return levelDb;if(levelDb>t+half)return t+(levelDb-t)/r;const x=levelDb-t+half;return levelDb+(1/r-1)*(x*x)/(2*k);}
  process(inputs,outputs){const frames=inputs[0]?.length||0;for(let i=0;i<frames;i+=1){let L=inputs[0][i]||0;let R=(inputs[1]?.[i]??L);if(this.params.phaseInvert)R=-R;L=this.saturate(this.filters[0].high.process(this.filters[0].mid.process(this.filters[0].low.process(L))));R=this.saturate(this.filters[Math.min(1,this.filters.length-1)].high.process(this.filters[Math.min(1,this.filters.length-1)].mid.process(this.filters[Math.min(1,this.filters.length-1)].low.process(R))));const mid=(L+R)*0.5,side=(L-R)*0.5*this.width;L=mid+side;R=mid-side;if(this.balance<0)R*=1+this.balance;else if(this.balance>0)L*=1-this.balance;const detector=Math.max(Math.abs(L),Math.abs(R));const coeff=detector>this.envelope?this.attack:this.release;this.envelope=detector+coeff*(this.envelope-detector);const compressedDb=this.compressDb(gainToDb(this.envelope));const reductionDb=compressedDb-gainToDb(this.envelope);const compressorGain=dbToGain(reductionDb)*this.makeup;const scaledL=L*compressorGain,scaledR=R*compressorGain;const peak=Math.max(this.truePeakEstimate(scaledL,this.previousL),this.truePeakEstimate(scaledR,this.previousR));const target=peak>this.ceiling?this.ceiling/peak:1;this.limiterGain=target<this.limiterGain?target:1+this.limitRelease*(this.limiterGain-1);L=scaledL*this.limiterGain;R=scaledR*this.limiterGain;const finalPeak=Math.max(Math.abs(L),Math.abs(R));if(finalPeak>this.ceiling){const s=this.ceiling/finalPeak;L*=s;R*=s;this.limiterGain*=s;}outputs[0][i]=clamp(L,-1,1);if(outputs[1])outputs[1][i]=clamp(R,-1,1);this.previousL=L;this.previousR=R;}}
}

export { DEFAULT_PARAMS };
