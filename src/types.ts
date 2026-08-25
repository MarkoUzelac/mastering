export interface MasteringParams {
  low: number;        // Low shelf gain in dB (-12 to +12)
  mid: number;        // Mid peak gain in dB (-12 to +12)
  high: number;       // High shelf gain in dB (-12 to +12)
  threshold: number;  // Compressor threshold in dB (-60 to 0)
  ratio: number;      // Compressor ratio (1 to 20)
  gain: number;       // Makeup gain in dB (0 to 24)
}

export interface MasteringPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  params: MasteringParams;
  isPro?: boolean;
  proOnly?: boolean;
  targetLufs?: number;
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
  momentaryLufs?: number;
  integratedLufs?: number;
  crestFactor?: number;
}

export interface AudioTrackInfo {
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
  buffer: AudioBuffer | null;
  sourceType: 'file' | 'demo' | 'synthetic';
  fileSize?: number;
  fileFormat?: string;
}

export interface GateStatus {
  id: string;
  name: string;
  category: string;
  thresholdStr: string;
  measuredError: number;
  tolerance: number;
  passed: boolean;
  notes: string;
}

export interface ParityResult {
  passed: boolean;
  totalSamples: number;
  maxAbsError: number;
  meanAbsError: number;
  rmsError: number;
  snrDb: number;
  timestamp: number;
  firstDivergenceSample?: number;
  gates: GateStatus[];
  testDetails?: {
    name: string;
    description: string;
    passed: boolean;
    maxAbsError: number;
    tolerance: number;
  }[];
}

export type PhosphorTheme = 'p1-green' | 'p3-amber' | 'cyan-studio' | 'matrix-dark';
