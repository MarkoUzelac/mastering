import React, { useRef, useState } from 'react';
import { Upload, Save, ChevronDown, Check, Music2, FileAudio, ShieldAlert, Download } from 'lucide-react';
import { AudioTrackInfo } from '../types';

interface TrackHeaderProps {
  track: AudioTrackInfo | null;
  duration?: number;
  onFileUpload: (file: File) => void;
  onSelectDemo: (type: 'synthwave' | 'acoustic' | 'parity') => void;
  onOpenParity?: () => void;
  onOpenExportModal?: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  duration,
  onFileUpload,
  onSelectDemo,
  onOpenParity,
  onOpenExportModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const trackDuration = duration !== undefined ? duration : (track?.duration || 0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveProject = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#24282D]">
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

      {/* Track Info Display */}
      <div>
        <div className="text-[10px] font-mono font-medium tracking-widest text-[#9A9EA6] uppercase">
          YOUR MASTER
        </div>
        <div className="flex items-baseline gap-3 mt-0.5">
          <h2 className="text-base sm:text-lg font-semibold text-[#F4F3EF] truncate max-w-md">
            {track ? track.name : 'No Audio Loaded'}
          </h2>
          <span className="text-xs font-mono text-[#9A9EA6] tracking-tight">
            {track
              ? `${(track.sampleRate / 1000).toFixed(0)} kHz · 24-bit · ${formatTime(trackDuration)}`
              : '48 kHz · 24-bit · 00:00'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F4F3EF] bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] hover:border-[#3A4048] rounded transition cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#D6AF62]" />
          <span>Upload Audio</span>
        </button>

        <button
          onClick={handleSaveProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] hover:border-[#3A4048] rounded transition cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#6FCF97]" />
              <span className="text-[#6FCF97]">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Demo Tracks Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#9A9EA6] hover:text-[#F4F3EF] bg-[#14171B] hover:bg-[#1B1F24] border border-[#24282D] rounded transition cursor-pointer"
            title="Load Reference Demos or Parity Test"
          >
            <span>Demos</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-[#14171B] border border-[#24282D] rounded-lg shadow-xl shadow-black/70 p-1 z-30 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-mono text-[#646A73] uppercase tracking-wider">
                Reference Audio Demos
              </div>
              <button
                onClick={() => {
                  onSelectDemo('synthwave');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#F4F3EF] hover:bg-[#1B1F24] rounded flex items-center gap-2"
              >
                <Music2 className="w-3.5 h-3.5 text-[#D6AF62]" />
                <div>
                  <div className="font-medium">Synthwave Neon Master</div>
                  <div className="text-[10px] text-[#9A9EA6]">Full dynamic electronic track</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectDemo('acoustic');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#F4F3EF] hover:bg-[#1B1F24] rounded flex items-center gap-2"
              >
                <FileAudio className="w-3.5 h-3.5 text-[#D6AF62]" />
                <div>
                  <div className="font-medium">Acoustic Harmonics</div>
                  <div className="text-[10px] text-[#9A9EA6]">Warm acoustic guitar timbre</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectDemo('parity');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#F4F3EF] hover:bg-[#1B1F24] rounded flex items-center gap-2 border-t border-[#24282D]/80 mt-1 pt-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#6FCF97]" />
                <div>
                  <div className="font-medium">100k Benchmark Vector</div>
                  <div className="text-[10px] text-[#6FCF97]">Analytical test signal</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
