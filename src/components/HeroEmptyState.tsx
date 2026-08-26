import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { soundHaptics } from '../utils/sound-haptics';

interface HeroEmptyStateProps {
  onFileUpload: (file: File) => void;
}

export const HeroEmptyState: React.FC<HeroEmptyStateProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col xl:flex-row gap-12 w-full max-w-6xl mx-auto py-12 md:py-24">
      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.flac,.mp3,.aif,.aiff,.ogg,.m4a"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            soundHaptics.playPresetClick();
            onFileUpload(file);
          }
        }}
        className="hidden"
      />

      {/* Left Typography */}
      <div className="flex-1 space-y-6">
        <div className="text-[10px] font-mono tracking-widest text-[var(--accent-lime)] uppercase mb-8">
          Local Browser Mastering / 01
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] text-[var(--text-primary)]">
          Loud. Clean.<br/>
          <span className="text-outline">Still</span><br/>
          <span className="text-outline">yours.</span>
        </h1>
        
        <p className="text-[var(--text-secondary)] font-mono text-sm max-w-sm mt-8 leading-relaxed">
          Non-destructive mastering directly
          in your browser. No accounts, no
          uploads, and no locked exports.
        </p>
      </div>

      {/* Right Dropzone */}
      <div className="flex-1 flex flex-col items-start xl:items-end justify-center">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-[var(--accent-lime)] rounded-xs border-dashed bg-transparent p-12 flex flex-col sm:flex-row items-center gap-6 cursor-pointer hover:bg-[var(--accent-lime)]/5 transition w-full max-w-md"
        >
          <div className="w-12 h-12 border border-[var(--accent-lime)] rounded-xs flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-[var(--accent-lime)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Drop track here</h3>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              WAV, MP3, FLAC, OGG<br/>
              (PROCESSED LOCALLY)
            </p>
          </div>
          
          <button className="hidden sm:block ml-auto border border-[var(--border-subtle)] text-xs font-mono px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xs transition">
            CHOOSE FILE
          </button>
        </div>
      </div>
    </div>
  );
};
