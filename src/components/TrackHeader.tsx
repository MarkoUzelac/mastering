import React, { useRef, useState } from 'react';
import { Upload, ChevronDown, Music2, FileAudio, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { AudioTrackInfo } from '../types';

interface TrackHeaderProps {
  track: AudioTrackInfo | null;
  duration?: number;
  isMastering?: boolean;
  onFileUpload: (file: File) => void;
  onSelectDemo: (type: 'synthwave' | 'acoustic' | 'parity') => void;
  onTriggerMaster: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  duration,
  isMastering = false,
  onFileUpload,
  onSelectDemo,
  onTriggerMaster,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const trackDuration = duration !== undefined ? duration : track?.duration || 225.782;
  const trackName = track?.name || 'Track.wav';
  const sampleRate = track?.sampleRate || 44100;
  const channels = track?.channels || 2;

  const formatTimecode = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0C0F] border border-[#1E2530] rounded-xl p-3.5 shadow-sm">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.flac,.mp3,.aif,.aiff,.ogg,.m4a"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileUpload(file);
        }}
        className="hidden"
      />

      {/* Left: Track Name & Specs */}
      <div className="flex items-center gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <h2 className="text-sm sm:text-base font-semibold text-[#F4F3EF] tracking-tight">
              {trackName}
            </h2>
          </div>
          <div className="text-[11px] font-mono text-[#646A73]">
            {sampleRate} Hz · 24-bit · {channels > 1 ? 'Stereo' : 'Mono'}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block w-[1px] h-8 bg-[#1E2530]" />

        {/* Metadata Telemetry Columns */}
        <div className="hidden sm:flex items-center gap-6 text-xs font-mono">
          <div>
            <div className="text-[9px] text-[#646A73] uppercase">Duration</div>
            <div className="text-[#E5E7EB] font-medium">{formatTimecode(trackDuration)}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#646A73] uppercase">Channels</div>
            <div className="text-[#E5E7EB] font-medium">{channels > 1 ? 'Stereo' : 'Mono'}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#646A73] uppercase">Peak</div>
            <div className="text-[#E5E7EB] font-medium">-3.2 dB</div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Import New Button */}
        <div className="relative">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1C2026] border border-[#24282D] rounded-lg transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Import New</span>
          </button>
        </div>

        {/* Demo Tracks Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1.5 text-xs text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1C2026] border border-[#24282D] rounded-lg transition cursor-pointer"
            title="Select Reference Demos"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#0E1116] border border-[#1E2530] rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-[#646A73] uppercase tracking-wider">
                Reference Audio Tracks
              </div>
              <button
                onClick={() => {
                  onSelectDemo('synthwave');
                  setDropdownOpen(false);
                }}
                className="w-full text-left p-2 text-xs text-[#F4F3EF] hover:bg-[#14171B] rounded-lg flex items-center gap-2 transition"
              >
                <Music2 className="w-4 h-4 text-[#8B5CF6]" />
                <div>
                  <div className="font-medium">Synthwave Master Demo</div>
                  <div className="text-[10px] text-[#646A73]">Electronic dynamic stem</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onSelectDemo('acoustic');
                  setDropdownOpen(false);
                }}
                className="w-full text-left p-2 text-xs text-[#F4F3EF] hover:bg-[#14171B] rounded-lg flex items-center gap-2 transition"
              >
                <FileAudio className="w-4 h-4 text-[#8B5CF6]" />
                <div>
                  <div className="font-medium">Acoustic Harmonics</div>
                  <div className="text-[10px] text-[#646A73]">Natural string timbre</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Master CTA Button (Rich Violet) */}
        <button
          onClick={onTriggerMaster}
          disabled={isMastering}
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition shadow-[0_0_15px_rgba(139,92,246,0.35)] cursor-pointer ${
            isMastering
              ? 'bg-[#6D28D9] animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#8B5CF6]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isMastering ? 'Mastering...' : 'Master'}</span>
        </button>
      </div>
    </div>
  );
};
