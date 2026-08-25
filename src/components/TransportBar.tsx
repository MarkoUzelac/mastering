import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scale,
  Menu,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AudioTrackInfo } from '../types';
import { soundHaptics } from '../utils/sound-haptics';

interface TransportBarProps {
  isPlaying: boolean;
  isBypassed: boolean;
  currentTime: number;
  duration: number;
  currentTrack: AudioTrackInfo | null;
  onPlay: () => void;
  onPause: () => void;
  onStop?: () => void;
  onSeek: (time: number) => void;
  onToggleBypass: () => void;
  onOpenParityModal?: () => void;
  onOpenAuditModal?: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isBypassed,
  currentTime,
  duration,
  currentTrack,
  onPlay,
  onPause,
  onSeek,
  onToggleBypass,
  onOpenAuditModal,
}) => {
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gainMatch, setGainMatch] = useState<boolean>(false);

  const formatTimecode = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00.000';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleSkipBack = () => {
    soundHaptics.playSliderTick(1000);
    onSeek(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    soundHaptics.playSliderTick(1400);
    onSeek(Math.min(duration, currentTime + 5));
  };

  const toggleMute = () => {
    soundHaptics.playSwitchSound(!isMuted);
    setIsMuted(!isMuted);
  };

  const handlePlayClick = () => {
    soundHaptics.playSwitchSound(true);
    onPlay();
  };

  const handlePauseClick = () => {
    soundHaptics.playSwitchSound(false);
    onPause();
  };

  const handleBypassSwitch = (targetBypass: boolean) => {
    if (isBypassed !== targetBypass) {
      soundHaptics.playSwitchSound(!targetBypass);
      onToggleBypass();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted) setIsMuted(false);
    soundHaptics.playSliderTick(1200 + newVol * 600);
  };

  const handleVolumeDoubleClick = () => {
    setVolume(1.0);
    setIsMuted(false);
    soundHaptics.playResetSound();
  };

  return (
    <div className="space-y-2 mt-2">
      {/* 1. Main Transport Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2.5 px-4 bg-[#0A0C0F] border border-[#1E2530] rounded-xl shadow-lg">
        {/* Left: Transport Buttons & Timecode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSkipBack}
              className="p-2 text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] rounded-lg transition cursor-pointer"
              title="Rewind 5 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {!isPlaying ? (
              <button
                onClick={handlePlayClick}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#8B5CF6] text-white flex items-center justify-center transition shadow-[0_0_12px_rgba(139,92,246,0.4)] cursor-pointer active:scale-95"
                title="Play Master Preview (Space)"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handlePauseClick}
                className="w-10 h-10 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center transition shadow-[0_0_12px_rgba(139,92,246,0.4)] cursor-pointer active:scale-95"
                title="Pause Master Preview (Space)"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={handleSkipForward}
              className="p-2 text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] rounded-lg transition cursor-pointer"
              title="Forward 5 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Tabular Timecode */}
          <div className="text-xs font-mono font-medium tracking-tight text-[#F4F3EF] num-tabular pl-3 border-l border-[#1E2530]">
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-[#646A73] mx-1.5">/</span>
            <span className="text-[#9A9EA6]">{formatTimecode(duration || 225.782)}</span>
          </div>
        </div>

        {/* Center: Mini Waveform Progress Scrub Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              onSeek(ratio * (duration || 225.782));
            }}
            className="w-full h-3 bg-[#07090C] border border-[#181C22] rounded-full overflow-hidden relative cursor-pointer group"
          >
            <div
              className="h-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] transition-all duration-75"
              style={{
                width: `${Math.max(0, Math.min(100, (currentTime / (duration || 225.782)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Right: A/B Switch, Gain Match, Volume, Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* A/B Switch Pill */}
          <div className="flex items-center p-0.5 bg-[#14171B] border border-[#24282D] rounded-lg text-xs font-medium">
            <button
              onClick={() => handleBypassSwitch(true)}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                isBypassed
                  ? 'bg-[#24282D] text-[#F4F3EF] shadow-sm font-semibold'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => handleBypassSwitch(false)}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                !isBypassed
                  ? 'bg-[#8B5CF6] text-white shadow-sm font-semibold'
                  : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
              }`}
            >
              <span>Mastered</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            </button>
          </div>

          {/* Gain Match Toggle */}
          <button
            onClick={() => {
              soundHaptics.playSwitchSound(!gainMatch);
              setGainMatch(!gainMatch);
            }}
            className={`hidden md:flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition cursor-pointer border ${
              gainMatch
                ? 'bg-[#1C162E] border-[#8B5CF6]/50 text-[#A78BFA]'
                : 'bg-[#14171B] border-[#24282D] text-[#646A73] hover:text-[#9A9EA6]'
            }`}
            title="Match perceived loudness between Original and Master"
          >
            <Scale className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-[11px]">Gain Match</span>
          </button>

          {/* Volume Slider */}
          <div
            className="flex items-center gap-2"
            onDoubleClick={handleVolumeDoubleClick}
            title="Double-click to reset volume (100%)"
          >
            <button
              onClick={toggleMute}
              className="text-[#9A9EA6] hover:text-[#F4F3EF] transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#EF4444]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
              )}
            </button>
            <div className="w-16 sm:w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 cursor-pointer accent-[#8B5CF6]"
              />
            </div>
          </div>

          {/* Audit / Menu Quick Trigger */}
          {onOpenAuditModal && (
            <button
              onClick={onOpenAuditModal}
              className="p-1.5 text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] border border-[#24282D] rounded-lg transition cursor-pointer"
              title="Audit & Workstation Settings"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Privacy & Trust Status Bar (Very Bottom) */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-1 text-[11px] font-mono text-[#646A73] border-t border-[#1E2530]/60">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> Client-Side Processing
          </span>
          <span className="flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> WASM Engine
          </span>
          <span className="hidden md:flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> 24-bit Float
          </span>
          <span className="hidden md:flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> Offline Mode
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#9A9EA6] mt-1 sm:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Your audio stays in your browser. 100% private.</span>
        </div>
      </div>
    </div>
  );
};
