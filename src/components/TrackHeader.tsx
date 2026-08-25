import React, { useRef, useState } from 'react';
import { Upload, ChevronDown, Music2, FileAudio, Sparkles, CheckCircle2 } from 'lucide-react';
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
      case 'ANALYZING':
        return 'Analyzing...';
      case 'MASTERING':
        return 'Mastering...';
      case 'MEASURING':
        return 'Measuring...';
      case 'FINALIZING':
        return 'Finalizing...';
      case 'MASTER READY':
        return 'Master Ready!';
      default:
        return 'Master';
    }
  };

  return (
    <div className="bg-[#0A0C0F] border border-[#222420] rounded-xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Track Name & Specs */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse shrink-0" />
              <h2 className="text-sm font-semibold text-[#F2F2EE] tracking-tight truncate">
                {trackName}
              </h2>
            </div>
            <div className="text-[11px] font-mono text-[#686A63]">
              {sampleRate} Hz · 24-bit · {channels > 1 ? 'Stereo' : 'Mono'}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-[1px] h-8 bg-[#222420]" />

          {/* Metadata Telemetry Columns (Medium & Large screens) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            <div>
              <div className="text-[9px] text-[#686A63] uppercase">Duration</div>
              <div className="text-[#E5E7EB] font-medium">{formatTimecode(trackDuration)}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#686A63] uppercase">Channels</div>
              <div className="text-[#E5E7EB] font-medium">{channels > 1 ? 'Stereo' : 'Mono'}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#686A63] uppercase">Peak</div>
              <div className="text-[#E5E7EB] font-medium">-3.2 dB</div>
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
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[36px] text-xs font-medium text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-[#B7F000]" />
            <span>Import New</span>
          </button>

          {/* Demo Tracks Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                soundHaptics.playButtonTap();
                setDropdownOpen(!dropdownOpen);
              }}
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-xs text-[#A5A69F] hover:text-[#F2F2EE] bg-[#151714] hover:bg-[#1C2026] border border-[#222420] rounded-lg transition cursor-pointer active:scale-95"
              title="Select Reference Demos"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-[#0D0E0C] border border-[#222420] rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono text-[#686A63] uppercase tracking-wider">
                  Reference Audio Tracks
                </div>
                <button
                  onClick={() => {
                    soundHaptics.playPresetClick();
                    onSelectDemo('synthwave');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 text-xs text-[#F2F2EE] hover:bg-[#151714] rounded-lg flex items-center gap-2 transition"
                >
                  <Music2 className="w-4 h-4 text-[#B7F000]" />
                  <div>
                    <div className="font-medium">Synthwave Master Demo</div>
                    <div className="text-[10px] text-[#686A63]">48 kHz 24-bit Electronic Stem</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    soundHaptics.playPresetClick();
                    onSelectDemo('acoustic');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 text-xs text-[#F2F2EE] hover:bg-[#151714] rounded-lg flex items-center gap-2 transition"
                >
                  <FileAudio className="w-4 h-4 text-[#B7F000]" />
                  <div>
                    <div className="font-medium">Acoustic Harmonics</div>
                    <div className="text-[10px] text-[#686A63]">Natural string timbre</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Master CTA Button (Rich Violet with strong glow and active scale) */}
          <button
            onClick={() => {
              soundHaptics.playMasterStart();
              onTriggerMaster();
            }}
            disabled={isMastering}
            className={`flex items-center gap-2 px-4 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[36px] text-xs font-semibold rounded-lg text-\[#F2F2EE\] transition shadow-[0_0_16px_rgba(139,92,246,0.45)] cursor-pointer active:scale-95 select-none ${
              isMastering
                ? 'bg-[#8CA800] animate-pulse cursor-wait'
                : masterStage === 'MASTER READY'
                ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                : 'bg-gradient-to-r from-[#B7F000] via-[#7C3AED] to-[#8CA800] hover:from-[#9333EA] hover:to-[#B7F000]'
            }`}
          >
            {masterStage === 'MASTER READY' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-\[#F2F2EE\]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isMastering ? '2s' : '0s' }} />
            )}
            <span className="tracking-wide uppercase font-bold">{getStageLabel()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

