import React from 'react';
import { Sparkles, Shield, Cpu, Waves, Disc, Check, ArrowRight, Zap, Lock } from 'lucide-react';
import { OutlineText } from './OutlineText';

interface LandingViewProps {
  onStartMastering: () => void;
  onOpenPricingModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartMastering,
  onOpenPricingModal,
}) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Hero Section */}
      <div className="md:col-span-8 xl:col-span-9 flex flex-col space-y-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--accent-lime)] w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)] animate-pulse"></span>
          <span className="uppercase tracking-wider">MasteringLocal.Pro — Editorial Release</span>
        </div>

        <div className="flex flex-col tracking-tighter leading-[0.85] select-none">
          <span className="text-[clamp(3rem,9vw,9rem)] font-extrabold text-[var(--text-primary)] uppercase">
            MASTER.
          </span>
          <OutlineText 
            text="YOUR" 
            className="text-[clamp(3rem,9vw,9rem)] opacity-80 z-0 -mt-2 sm:-mt-4" 
          />
          <span className="text-[clamp(3rem,9vw,9rem)] font-extrabold text-[var(--accent-lime)] uppercase z-10 relative -mt-2 sm:-mt-4">
            SOUND.
          </span>
        </div>

        <div className="flex flex-col xl:flex-row items-start gap-6 max-w-3xl">
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
            High-precision 64-bit C++/WebAssembly DSP audio mastering console. Zero cloud uploads,
            zero server latency, and uncompromising acoustic purity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={onStartMastering}
              className="btn-primary px-8 py-4"
            >
              <span>LAUNCH STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPricingModal}
              className="btn-secondary px-6 py-4"
            >
              EXPLORE PRO
            </button>
          </div>
        </div>
      </div>

      {/* Asymmetric Features Sidebar */}
      <div className="md:col-span-4 xl:col-span-3 flex flex-col gap-12 pt-12 md:pt-0">
        <div className="space-y-4">
          <div className="w-10 h-10 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] rounded-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            C++ WASM Core
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            Compiled from high-performance algorithms with 64-bit double precision, zero drift.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] rounded-sm">
            <Waves className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            EBU R128 & True Peak
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            Integrated multi-band processing, 4x polyphase inter-sample peak detection.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] rounded-sm">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            Glitch-Free A/B
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            Switch instantaneously between uncompressed dry reference and finalized master.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] rounded-sm">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            100% Client-Side Privacy
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            Your audio files never touch a remote server. All DSP math executes locally on your CPU.
          </p>
        </div>
      </div>
    </div>
  );
};
