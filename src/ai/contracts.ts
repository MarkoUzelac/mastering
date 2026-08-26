export type AiSourceKind = 'measured' | 'interpretation' | 'general_advice';

export interface StructuredAudioSnapshot {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  integratedLufs: number | null;
  momentaryLufs: number | null;
  truePeakDbtp: number | null;
  rmsDb: number | null;
  crestFactorDb: number | null;
  clippingDetected: boolean | null;
  dcOffsetDetected: boolean | null;
  stereoWidth: number | null;
  dynamicRangeDb: number | null;
}

export interface MasteringAiRequest {
  question: string;
  audio?: StructuredAudioSnapshot | null;
  targetLufs?: number;
  referencePlatform?: string;
}

export interface MasteringAiResponse {
  answer: string;
  measuredData: string[];
  interpretation: string[];
  generalAdvice: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ReleaseAssistantRequest {
  artist: string;
  title: string;
  genre: string;
  subgenre?: string;
  mood?: string;
  bpm?: number | null;
  key?: string;
  producer?: string;
  mixingEngineer?: string;
  masteringEngineer?: string;
  copyright?: string;
}

export interface ReleaseAssistantResponse {
  genre: string;
  subgenre: string;
  mood: string;
  description: string;
  shortBio: string;
  socialCaption: string;
  copyrightLine: string;
  metadataNotes: string[];
  coverArtPrompt: string;
}
