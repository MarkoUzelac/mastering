import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Scale } from 'lucide-react';
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
  onStop: () => void;
  onSeek: (time: number) => void;
  onToggleBypass: () => void;
  onSelectDemo: (demoType: 'synthwave' | 'acoustic' | 'parity') => void;
  onFileUpload: (file: File) => void;
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
}) => {
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gainMatch, setGainMatch] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2.5 px-4 bg-[#0E1013] border border-[#24282D] rounded-xl shadow-md">
      {/* Left: Transport Buttons & Timecode */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-1">
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
              className="w-10 h-10 rounded-full bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] flex items-center justify-center transition shadow-md shadow-[#D6AF62]/20 cursor-pointer active:scale-95"
              title="Play Master Preview (Space)"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          ) : (
            <button
              onClick={handlePauseClick}
              className="w-10 h-10 rounded-full bg-[#E7C77F] hover:bg-[#D6AF62] text-[#08090B] flex items-center justify-center transition shadow-md shadow-[#D6AF62]/20 cursor-pointer active:scale-95"
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
        <div className="text-xs font-mono font-medium tracking-tight text-[#F4F3EF] num-tabular pl-2 border-l border-[#24282D]">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[#646A73] mx-1.5">/</span>
          <span className="text-[#9A9EA6]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: A/B Comparison Toggle, Gain Match & Volume */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* A/B Switch Pill */}
        <div className="flex items-center p-1 bg-[#14171B] border border-[#24282D] rounded-lg text-xs font-medium">
          <button
            onClick={() => handleBypassSwitch(true)}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              isBypassed
                ? 'bg-[#24282D] text-[#F4F3EF] shadow-sm font-semibold'
                : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => handleBypassSwitch(false)}
            className={`px-3 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
              !isBypassed
                ? 'bg-[#D6AF62] text-[#08090B] shadow-sm font-semibold'
                : 'text-[#9A9EA6] hover:text-[#F4F3EF]'
            }`}
          >
            <span>Mastered</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#08090B] opacity-70"></span>
          </button>
        </div>

        {/* Gain Match Toggle */}
        <button
          onClick={() => {
            soundHaptics.playSwitchSound(!gainMatch);
            setGainMatch(!gainMatch);
          }}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition cursor-pointer border ${
            gainMatch
              ? 'bg-[#1C170E] border-[#D6AF62]/40 text-[#E7C77F]'
              : 'bg-transparent border-transparent text-[#646A73] hover:text-[#9A9EA6]'
          }`}
          title="Match perceived loudness between Original and Mastered to avoid Fletcher-Munson loudness bias"
        >
          <Scale className="w-3.5 h-3.5" />
          <span className="text-[11px]">Gain Match</span>
        </button>

        {/* Volume Fader with Double Click Reset to 100% */}
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
              <VolumeX className="w-4 h-4 text-[#E56B6B]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="w-20 sm:w-24">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
