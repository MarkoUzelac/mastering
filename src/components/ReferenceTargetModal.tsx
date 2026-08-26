import React from 'react';
import { X, Check, Target, Radio, Globe } from 'lucide-react';

export interface ReferenceTarget {
  id: string;
  platform: string;
  targetLufs: number;
  truePeakCeiling: number;
  description: string;
  badge?: string;
}

export const REFERENCE_TARGETS: ReferenceTarget[] = [
  {
    id: 'spotify',
    platform: 'Spotify',
    targetLufs: -14.0,
    truePeakCeiling: -1.0,
    description: 'Industry standard streaming normalization target with dynamic headroom.',
    badge: 'Popular',
  },
  {
    id: 'apple-music',
    platform: 'Apple Music / Sound Check',
    targetLufs: -16.0,
    truePeakCeiling: -1.0,
    description: 'Apple Digital Masters standard for maximum dynamic range and spatial fidelity.',
  },
  {
    id: 'youtube',
    platform: 'YouTube Music & Video',
    targetLufs: -14.0,
    truePeakCeiling: -1.0,
    description: 'Optimized for YouTube playback normalization without downstream compressor attenuation.',
  },
  {
    id: 'club-edm',
    platform: 'Club & Festival Sound Systems',
    targetLufs: -9.0,
    truePeakCeiling: -0.3,
    description: 'Competitive loudness and maximum RMS energy for DJ booths and large PA systems.',
    badge: 'Club Ready',
  },
  {
    id: 'broadcast-ebu',
    platform: 'Broadcast & Podcast (EBU R128)',
    targetLufs: -16.0,
    truePeakCeiling: -1.0,
    description: 'Strict international broadcast delivery standard for television, radio, and podcasts.',
  },
  {
    id: 'cd-master',
    platform: 'Physical CD / High-Res Vinyl',
    targetLufs: -9.5,
    truePeakCeiling: -0.1,
    description: 'Full code dynamic range with maximum digital ceiling utilization.',
  },
];

interface ReferenceTargetModalProps {
  selectedTargetId: string;
  onSelectTarget: (target: ReferenceTarget) => void;
  onClose: () => void;
}

export const ReferenceTargetModal: React.FC<ReferenceTargetModalProps> = ({
  selectedTargetId,
  onSelectTarget,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-[var(--accent-lime)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Loudness Target Reference</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Platform delivery standards &amp; streaming targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {REFERENCE_TARGETS.map((target) => {
            const isSelected = target.id === selectedTargetId;

            return (
              <div
                key={target.id}
                onClick={() => {
                  onSelectTarget(target);
                  onClose();
                }}
                className={`p-3 rounded-sm border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[var(--bg-elevated)] border-[var(--accent-lime)] text-[var(--text-primary)]'
                    : 'bg-[#07090C] border-[#181C22] hover:border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{target.platform}</span>
                    {target.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--accent-lime)] text-[var(--text-primary)]">
                        {target.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1">{target.description}</p>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-xs font-mono font-bold text-[var(--accent-lime)]">
                      {target.targetLufs.toFixed(1)} LUFS
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      Ceil: {target.truePeakCeiling.toFixed(1)} dBTP
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--accent-lime)]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--accent-lime)] hover:bg-[#7C3AED] rounded-sm transition shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
