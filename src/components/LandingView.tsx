import React from 'react';
import { Sparkles, Shield, Cpu, Waves, Disc, Check, ArrowRight, Zap, Lock } from 'lucide-react';

interface LandingViewProps {
  onStartMastering: () => void;
  onOpenPricingModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartMastering,
  onOpenPricingModal,
}) => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-16 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171B] border border-[#24282D] text-xs font-mono text-[#D6AF62]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6AF62] animate-pulse"></span>
          <span>MASTERINGLOCAL.PRO — EDITORIAL RELEASE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F3EF] leading-tight">
          Studio-grade audio mastering. <br />
          <span className="text-[#D6AF62]">Directly in your browser.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#9A9EA6] leading-relaxed">
          High-precision 64-bit C++/WebAssembly DSP audio mastering console. Zero cloud uploads,
          zero server latency, and uncompromising acoustic purity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onStartMastering}
            className="w-full sm:w-auto px-6 py-3 bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] font-mono font-semibold text-xs sm:text-sm rounded-lg transition shadow-lg shadow-[#D6AF62]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>LAUNCH MASTERING STUDIO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPricingModal}
            className="w-full sm:w-auto px-5 py-3 bg-[#14171B] hover:bg-[#1B1F24] text-[#F4F3EF] border border-[#24282D] font-mono font-medium text-xs sm:text-sm rounded-lg transition cursor-pointer"
          >
            VIEW PRO TIERS
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Box */}
      <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62] shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#F4F3EF] uppercase">
              100% CLIENT-SIDE PRIVACY ARCHITECTURE
            </div>
            <div className="text-xs text-[#9A9EA6] mt-0.5">
              Your audio files never touch a remote server. All DSP math executes locally on your CPU via WebAssembly.
            </div>
          </div>
        </div>
        <div className="shrink-0 px-3 py-1 rounded bg-[#14171B] border border-[#24282D] text-[11px] font-mono text-[#6FCF97]">
          Zero Data Ingestion
        </div>
      </div>

      {/* 4 Technical Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F3EF]">
            Deterministic C++ & WASM DSP Core
          </h3>
          <p className="text-xs text-[#9A9EA6] leading-relaxed">
            Compiled from high-performance C++ mastering algorithms with 64-bit double precision,
            verified against 100k test vectors with zero floating-point drift.
          </p>
        </div>

        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
            <Waves className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F3EF]">
            EBU R128 & True Peak Limiting
          </h3>
          <p className="text-xs text-[#9A9EA6] leading-relaxed">
            Integrated multi-band processing, 4x polyphase inter-sample peak detection, and -1.0 dBTP
            brickwall lookahead limiting for clean streaming delivery.
          </p>
        </div>

        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F3EF]">
            Instant Glitch-Free A/B Evaluation
          </h3>
          <p className="text-xs text-[#9A9EA6] leading-relaxed">
            Switch instantaneously between uncompressed dry reference and the finalized master with
            phase-aligned buffers and smart Fletcher-Munson gain matching.
          </p>
        </div>

        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62]">
            <Disc className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F3EF]">
            Studio Format Multi-Export
          </h3>
          <p className="text-xs text-[#9A9EA6] leading-relaxed">
            Export broadcast-ready WAV 24-bit, 32-bit float, FLAC, and streaming MP3 files with TPDF
            dithering directly from your local memory.
          </p>
        </div>
      </div>
    </div>
  );
};
