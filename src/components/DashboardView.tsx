import React from 'react';
import { Music, Download, Play, Plus } from 'lucide-react';
import { UserEntitlement, UserUsage } from '../billing/entitlement-service';
import { AudioTrackInfo } from '../types';

interface DashboardViewProps {
  currentTrack?: AudioTrackInfo | null;
  onOpenMastering: () => void;
  onOpenExportModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAccountModal?: (tab?: 'subscription' | 'billing' | 'usage' | 'exports') => void;
  entitlement: UserEntitlement;
  usage: UserUsage;
  onSelectDemoTrack?: (type: 'synthwave' | 'acoustic' | 'parity') => void;
  onFileUpload?: (file: File) => void;
  onLoadDemo?: (type: 'synthwave' | 'acoustic' | 'parity') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentTrack,
  onOpenMastering,
  onOpenExportModal,
  onOpenPricingModal,
  onOpenAccountModal,
  entitlement,
  usage,
  onSelectDemoTrack,
  onFileUpload,
  onLoadDemo,
}) => {
  const isPro = entitlement.status === 'PRO' || entitlement.status === 'TRIAL';
  const remaining = usage.exportsLimit === -1 ? 'Unlimited' : Math.max(0, usage.exportsLimit - usage.exportsUsed);

  const handleTriggerDemo = (type: 'synthwave' | 'acoustic' | 'parity') => {
    if (onSelectDemoTrack) onSelectDemoTrack(type);
    else if (onLoadDemo) onLoadDemo(type);
    onOpenMastering();
  };

  const recentMasters = [
    {
      id: 'm1',
      title: currentTrack ? currentTrack.name : 'Neon Horizon (Final Master).wav',
      genre: 'Synthwave / Electronic',
      date: 'Today, Active Session',
      duration: '03:47',
      format: 'WAV 24-bit · 48 kHz',
      lufs: '-9.4 LUFS',
      truePeak: '-1.0 dBTP',
      status: 'Ready',
    },
    {
      id: 'm2',
      title: 'Acoustic Harmonics Studio Take 3.wav',
      genre: 'Acoustic / Folk',
      date: 'Yesterday, 18:45',
      duration: '02:15',
      format: 'WAV 24-bit · 96 kHz',
      lufs: '-14.1 LUFS',
      truePeak: '-1.0 dBTP',
      status: 'Ready',
    },
    {
      id: 'm3',
      title: 'Midnight Echoes Vocal Stem.wav',
      genre: 'Pop / RnB',
      date: '23 Aug 2026',
      duration: '04:12',
      format: 'FLAC 24-bit · 44.1 kHz',
      lufs: '-11.2 LUFS',
      truePeak: '-1.0 dBTP',
      status: 'Archived',
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 py-4">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-6">
        <div>
          <div className="text-[10px] font-mono text-[var(--accent-lime)] uppercase tracking-widest">
            PROJECT OVERVIEW
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">
            Mastering Projects &amp; Library
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage your audio tracks, review loudness history, and export final release masters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTriggerDemo('synthwave')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] rounded-sm transition shadow-md cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>NEW MASTER</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Masters */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="uppercase tracking-wider">TOTAL MASTERS</span>
            <span className="text-[var(--accent-lime)]">+4 this week</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--text-primary)] num-tabular">
            14
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            Processed locally in high-precision 64-bit float
          </div>
        </div>

        {/* Total Exports */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="uppercase tracking-wider">EXPORTS THIS MONTH</span>
            <span className="text-[#6FCF97]">Active</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--text-primary)] num-tabular">
            {usage.exportsUsed} <span className="text-sm font-normal text-[var(--text-secondary)]">/ {isPro ? '∞' : usage.exportsLimit}</span>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {isPro ? 'Unlimited Pro exports enabled' : `${remaining} free exports remaining`}
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="uppercase tracking-wider">STORAGE USED</span>
            <span className="text-[var(--text-secondary)]">12%</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--text-primary)] num-tabular">
            1.2 <span className="text-sm font-normal text-[var(--text-secondary)]">of 10 GB</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div className="w-[12%] h-full bg-[var(--accent-lime)] rounded-full" />
          </div>
        </div>
      </div>

      {/* Recent Masters Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="text-xs font-semibold font-mono tracking-wider text-[var(--text-primary)] uppercase">
            RECENT MASTERS
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-mono">3 Tracks</span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)] text-xs">
          {recentMasters.map((track) => (
            <div
              key={track.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--bg-elevated)]/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)] shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">{track.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                    <span>{track.genre}</span>
                    <span>·</span>
                    <span className="font-mono">{track.format}</span>
                  </div>
                </div>
              </div>

              {/* Center Metrics */}
              <div className="flex items-center gap-6 font-mono text-[11px]">
                <div>
                  <span className="text-[var(--text-tertiary)] block text-[9px] uppercase">LOUDNESS</span>
                  <span className="text-[var(--text-primary)]">{track.lufs}</span>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)] block text-[9px] uppercase">TRUE PEAK</span>
                  <span className="text-[var(--accent-lime)]">{track.truePeak}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[var(--text-tertiary)] block text-[9px] uppercase">MODIFIED</span>
                  <span className="text-[var(--text-secondary)]">{track.date}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerDemo('synthwave')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[#1B1F24] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-sm transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[var(--accent-lime)]" />
                  <span>Open</span>
                </button>
                <button
                  onClick={onOpenExportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-lime)]/10 hover:bg-[var(--accent-lime)]/20 text-[var(--accent-lime-hover)] border border-[var(--accent-lime)]/30 rounded-sm transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
