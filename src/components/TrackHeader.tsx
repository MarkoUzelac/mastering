import React, { useRef, useState } from 'react';
import { Upload, ChevronDown, Music2, FileAudio, Sparkles, CheckCircle2, Download } from 'lucide-react';
import { AudioTrackInfo } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

export type MasteringStage = 'READY' | 'ANALYZING' | 'MASTERING' | 'MEASURING' | 'FINALIZING' | 'MASTER READY';

interface TrackHeaderProps {
  track: AudioTrackInfo | null;
  duration?: number;
  isMastering?: boolean;
  masterStage?: MasteringStage;
  onFileUpload: (file: File) => void;
  onSelectDemo: (type: 'synthwave' | 'acoustic' | 'parity') => void;
  onTriggerMaster: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  duration,
  isMastering = false,
  masterStage = 'READY',
  onFileUpload,
  onSelectDemo,
  onTriggerMaster,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const trackDuration = duration !== undefined ? duration : track?.duration || 225.782;
  const trackName = track?.name || 'Synthwave Neon Horizon Master.wav';
  const sampleRate = track?.sampleRate || 48000;
  const channels = track?.channels || 2;

  const formatTimecode = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const getStageLabel = () => {
    switch (masterStage) {
      case 'ANALYZING': return 'ANALYZING...';
      case 'MASTERING': return 'MASTERING...';
      case 'MEASURING': return 'MEASURING...';
      case 'FINALIZING': return 'FINALIZING...';
      case 'MASTER READY': return 'EXPORT MASTER';
      default: return 'RENDER MASTER';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 space-y-2.5">
        {/* Hidden File Input */}
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Track Name & Specs */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)] animate-pulse shrink-0" />
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate">
                  {trackName}
                </h2>
              </div>
              <div className="text-[10px] font-mono text-[var(--text-tertiary)] tracking-widest uppercase">
                {sampleRate} HZ / 24-BIT / {channels > 1 ? 'STEREO' : 'MONO'}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-[1px] h-10 bg-[var(--border-subtle)]" />

            {/* Metadata Telemetry Columns (Medium & Large screens) */}
            <div className="hidden md:flex items-center gap-8 text-[11px] font-mono">
              <div>
                <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest">DURATION</div>
                <div className="text-[var(--text-primary)] font-medium mt-0.5">{formatTimecode(trackDuration)}</div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest">CHANNELS</div>
                <div className="text-[var(--text-primary)] font-medium mt-0.5">{channels > 1 ? 'STEREO' : 'MONO'}</div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Import New Button */}
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-[10px] font-mono tracking-widest uppercase text-[var(--text-primary)] bg-transparent border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] transition cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>NEW</span>
            </button>

            {/* Demo Tracks Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  soundHaptics.playButtonTap();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="p-2 px-3 min-h-[40px] flex items-center justify-center text-[10px] font-mono tracking-widest text-[var(--text-primary)] uppercase bg-transparent border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] transition cursor-pointer active:scale-95 gap-2"
              >
                <span>DEMOS</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-2xl p-1.5 z-40 space-y-1">
                  <div className="px-2 py-1 text-[9px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">
                    Reference Audio Tracks
                  </div>
                  <button
                    onClick={() => {
                      soundHaptics.playPresetClick();
                      onSelectDemo('synthwave');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] flex items-center gap-2 transition"
                  >
                    <Music2 className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
                    <div>
                      <div className="font-mono uppercase">Synthwave Master</div>
                      <div className="text-[9px] font-mono text-[var(--text-tertiary)]">48 kHz 24-bit</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      soundHaptics.playPresetClick();
                      onSelectDemo('acoustic');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] flex items-center gap-2 transition"
                  >
                    <FileAudio className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
                    <div>
                      <div className="font-mono uppercase">Acoustic Harmonics</div>
                      <div className="text-[9px] font-mono text-[var(--text-tertiary)]">Natural string timbre</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
