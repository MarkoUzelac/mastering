export type PhosphorTheme = 'phosphor-dark' | 'phosphor-light';

export interface TelemetryData {
  integrated: number;
  shortTerm: number;
  momentary: number;
  lra: number;
  truePeakL: number;
  truePeakR: number;
  correlation: number;
  crestFactor: number;
  dynamicRange: number;
}

export interface MasteringParams {
  low: number;
  mid: number;
  high: number;
  threshold: number;
  ratio: number;
  gain: number;
}

export interface MasteringPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  targetLufs: number;
  isPro?: boolean;
  proOnly?: boolean;
  params: MasteringParams;
}

export interface MeterData {
  inputPeakL: number;
  inputPeakR: number;
  inputRmsL: number;
  inputRmsR: number;
  outputPeakL: number;
  outputPeakR: number;
  outputRmsL: number;
  outputRmsR: number;
  gainReductionDb: number;
  limiterActive: boolean;
  integrated?: number;
  shortTerm?: number;
  momentary?: number;
  integratedLufs: number;
  momentaryLufs: number;
  lra?: number;
  truePeakL?: number;
  truePeakR?: number;
  correlation?: number;
  crestFactor: number;
  dynamicRange?: number;
  leftPeak?: number;
  rightPeak?: number;
  lufs?: number;
}

export interface AudioTrackInfo {
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format?: string;
  bitDepth?: number;
  buffer?: any;
  sourceType?: string;
  fileSize?: number;
}

export interface ParityResult {
  passed: boolean;
  maxDiff?: number;
  avgDiff?: number;
  samplesChecked?: number;
  message?: string;
  totalSamples: number;
  maxAbsError: number;
  meanAbsError: number;
  rmsError: number;
  gates: any[];
  snrDb: number;
  timestamp: number;
  testDetails?: any;
}
