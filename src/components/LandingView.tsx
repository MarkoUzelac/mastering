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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      {/* Hero Section */}
      <div className="flex flex-col space-y-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#222420] text-[10px] font-mono text-[#B7F000] w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B7F000] animate-pulse"></span>
          <span className="uppercase tracking-wider">MasteringLocal.Pro — Editorial Release</span>
        </div>

        <div className="flex flex-col tracking-tighter leading-[0.85] sm:leading-[0.85] select-none">
          <span className="text-[clamp(3rem,9vw,9rem)] font-extrabold text-[#F2F2EE] uppercase">
            MASTER.
          </span>
          <span 
            className="text-[clamp(3rem,9vw,9rem)] font-extrabold text-transparent uppercase opacity-80 z-0 relative -mt-2 sm:-mt-4"
            style={{ WebkitTextStroke: '1.5px #A5A69F' }}
          >
            YOUR
          </span>
          <span className="text-[clamp(3rem,9vw,9rem)] font-extrabold text-[#B7F000] uppercase z-10 relative -mt-2 sm:-mt-4">
            SOUND.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-2xl">
          <p className="text-base sm:text-lg text-[#A5A69F] leading-relaxed max-w-xl">
            High-precision 64-bit C++/WebAssembly DSP audio mastering console. Zero cloud uploads,
            zero server latency, and uncompromising acoustic purity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={onStartMastering}
              className="px-8 py-4 bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] font-mono font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm"
            >
              <span>LAUNCH STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPricingModal}
              className="px-6 py-4 bg-transparent hover:bg-[#151714] text-[#F2F2EE] border border-[#222420] font-mono font-medium text-xs sm:text-sm transition-colors cursor-pointer rounded-sm"
            >
              EXPLORE PRO
            </button>
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-[#222420] pt-12">
        <div className="space-y-4">
          <div className="w-10 h-10 border border-[#222420] flex items-center justify-center text-[#B7F000] rounded-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wide">
            C++ WASM Core
          </h3>
          <p className="text-sm text-[#686A63] leading-relaxed">
            Compiled from high-performance algorithms with 64-bit double precision, zero drift.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[#222420] flex items-center justify-center text-[#B7F000] rounded-sm">
            <Waves className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wide">
            EBU R128 & True Peak
          </h3>
          <p className="text-sm text-[#686A63] leading-relaxed">
            Integrated multi-band processing, 4x polyphase inter-sample peak detection.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[#222420] flex items-center justify-center text-[#B7F000] rounded-sm">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wide">
            Glitch-Free A/B
          </h3>
          <p className="text-sm text-[#686A63] leading-relaxed">
            Switch instantaneously between uncompressed dry reference and finalized master.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[#222420] flex items-center justify-center text-[#B7F000] rounded-sm">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#F2F2EE] tracking-wide">
            100% Client-Side Privacy
          </h3>
          <p className="text-sm text-[#686A63] leading-relaxed">
            Your audio files never touch a remote server. All DSP math executes locally on your CPU.
          </p>
        </div>
      </div>
    </div>
  );
};
