import React, { useState, useEffect } from 'react';
import {
  IconPlay as Play,
  IconPause as Pause,
  IconSquare as Square,
  IconRepeat as Repeat,
  IconSkipBack as SkipBack,
  IconSkipForward as SkipForward,
  IconVolume2 as Volume2,
  IconVolumeX as VolumeX,
  IconScale as Scale,
  IconHeadphones as Headphones,
  IconShieldCheck as ShieldCheck,
  IconCheck as Check,
} from './Icons';
import { AudioTrackInfo } from '../types';
import { soundHaptics } from '../utils/sound-haptics';
import { audioEngineEvents } from '../utils/audio-engine';

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
  isLooping?: boolean;
  onToggleLoop?: () => void;
  isMono?: boolean;
  onToggleMono?: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isBypassed,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onToggleBypass,
  isLooping = false,
  onToggleLoop,
  isMono = false,
  onToggleMono,
}) => {
  const [volume, setVolume] = useState<number>(1.0);
  const [localTime, setLocalTime] = useState<number>(0);
  useEffect(() => {
    const handler = (e: any) => setLocalTime(e.detail.currentTime);
    audioEngineEvents.addEventListener('timeupdate', handler);
    return () => audioEngineEvents.removeEventListener('timeupdate', handler);
  }, []);
  const activeTime = localTime;
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
    soundHaptics.playButtonTap();
    onSeek(Math.max(0, activeTime - 5));
  };

  const handleSkipForward = () => {
    soundHaptics.playButtonTap();
    onSeek(Math.min(duration || 225.782, activeTime + 5));
  };

  const handleStopClick = () => {
    soundHaptics.playButtonTap();
    if (onStop) onStop();
    else {
      onPause();
      onSeek(0);
    }
  };

  const toggleMute = () => {
    soundHaptics.playSwitchSound(!isMuted);
    setIsMuted(!isMuted);
  };

  const handlePlayClick = () => {
    soundHaptics.playButtonTap();
    onPlay();
  };

  const handlePauseClick = () => {
    soundHaptics.playButtonTap();
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
      {/* Main Transport Controls Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm shadow-lg">
        {/* Left: Transport Buttons & Timecode */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            {/* Rewind */}
            <button
              onClick={handleSkipBack}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-sm transition cursor-pointer active:scale-95"
              title="Rewind 5 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            {!isPlaying ? (
              <button
                onClick={handlePlayClick}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] flex items-center justify-center transition cursor-pointer active:scale-95"
                title="Play Master Preview (Space)"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handlePauseClick}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] flex items-center justify-center transition cursor-pointer active:scale-95"
                title="Pause Master Preview (Space)"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Stop */}
            <button
              onClick={handleStopClick}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-sm transition cursor-pointer active:scale-95"
              title="Stop Playback"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Forward */}
            <button
              onClick={handleSkipForward}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-sm transition cursor-pointer active:scale-95"
              title="Forward 5 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Loop Toggle */}
            {onToggleLoop && (
              <button
                onClick={() => {
                  soundHaptics.playButtonTap();
                  onToggleLoop();
                }}
                className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-sm transition cursor-pointer active:scale-95 ${
                  isLooping
                    ? 'text-[#D4FF5C] bg-[var(--accent-lime)]/20 border border-[var(--accent-lime)]/40'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
                title="Toggle Repeat Loop"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabular Timecode */}
          <div className="text-xs font-mono font-medium tracking-tight text-[var(--text-primary)] tabular-nums pl-2 border-l border-[var(--border-subtle)]">
            <span>{formatTimecode(activeTime)}</span>
            <span className="text-[var(--text-tertiary)] mx-1">/</span>
            <span className="text-[var(--text-secondary)]">{formatTimecode(duration || 225.782)}</span>
          </div>
        </div>

        {/* Right: Master/Original Switch, Mono Check, Volume */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3">
          {/* Mastered vs Original Bypass Toggle */}
          <div className="flex items-center p-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-sm text-xs font-medium">
            <button
              onClick={() => handleBypassSwitch(true)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                isBypassed
                  ? 'bg-[var(--border-subtle)] text-[var(--text-primary)] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Original (A)</span>
            </button>
            <button
              onClick={() => handleBypassSwitch(false)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                !isBypassed
                  ? 'bg-[var(--accent-lime)] text-black shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Mastered (B)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse" />
            </button>
          </div>

          {/* Mono / Stereo Check Toggle */}
          {onToggleMono && (
            <button
              onClick={() => {
                soundHaptics.playSwitchSound(!isMono);
                onToggleMono();
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-sm transition cursor-pointer border active:scale-95 ${
                isMono
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#FBBF24]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
              title="Sum to Mono (Phase check)"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">{isMono ? 'Mono' : 'Stereo'}</span>
            </button>
          )}

          {/* Volume Slider */}
          <div
            className="flex items-center gap-1.5"
            onDoubleClick={handleVolumeDoubleClick}
            title="Double-click to reset volume (100%)"
          >
            <button
              onClick={toggleMute}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer active:scale-95"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#EF4444]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[var(--accent-lime)]" />
              )}
            </button>
            <div className="w-14 sm:w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 cursor-pointer accent-[var(--accent-lime)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Trust Status Bar (Very Bottom) */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-1 text-[11px] font-mono text-[var(--text-tertiary)] border-t border-[var(--border-subtle)]/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> Client-Side Processing
          </span>
          <span className="flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> WASM DSP Engine
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[#10B981]">
            <Check className="w-3.5 h-3.5" /> 24-bit Float
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mt-1 sm:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-lime)]" />
          <span>Your audio never leaves your browser. 100% private.</span>
        </div>
      </div>
    </div>
  );
};

