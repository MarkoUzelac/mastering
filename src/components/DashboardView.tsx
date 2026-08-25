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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E1013] border border-[#24282D] rounded-xl p-6">
        <div>
          <div className="text-[10px] font-mono text-[#D6AF62] uppercase tracking-widest">
            PROJECT OVERVIEW
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F3EF] mt-1">
            Mastering Projects &amp; Library
          </h1>
          <p className="text-xs sm:text-sm text-[#9A9EA6] mt-1">
            Manage your audio tracks, review loudness history, and export final release masters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTriggerDemo('synthwave')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#D6AF62] hover:bg-[#E7C77F] text-[#08090B] rounded-lg transition shadow-md cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>NEW MASTER</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Masters */}
        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#9A9EA6]">
            <span className="uppercase tracking-wider">TOTAL MASTERS</span>
            <span className="text-[#D6AF62]">+4 this week</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#F4F3EF] num-tabular">
            14
          </div>
          <div className="text-xs text-[#646A73]">
            Processed locally in high-precision 64-bit float
          </div>
        </div>

        {/* Total Exports */}
        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#9A9EA6]">
            <span className="uppercase tracking-wider">EXPORTS THIS MONTH</span>
            <span className="text-[#6FCF97]">Active</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#F4F3EF] num-tabular">
            {usage.exportsUsed} <span className="text-sm font-normal text-[#9A9EA6]">/ {isPro ? '∞' : usage.exportsLimit}</span>
          </div>
          <div className="text-xs text-[#646A73]">
            {isPro ? 'Unlimited Pro exports enabled' : `${remaining} free exports remaining`}
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-[#0E1013] border border-[#24282D] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#9A9EA6]">
            <span className="uppercase tracking-wider">STORAGE USED</span>
            <span className="text-[#9A9EA6]">12%</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#F4F3EF] num-tabular">
            1.2 <span className="text-sm font-normal text-[#9A9EA6]">of 10 GB</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#14171B] rounded-full overflow-hidden">
            <div className="w-[12%] h-full bg-[#D6AF62] rounded-full" />
          </div>
        </div>
      </div>

      {/* Recent Masters Table */}
      <div className="bg-[#0E1013] border border-[#24282D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#24282D] flex items-center justify-between">
          <div className="text-xs font-semibold font-mono tracking-wider text-[#F4F3EF] uppercase">
            RECENT MASTERS
          </div>
          <span className="text-xs text-[#9A9EA6] font-mono">3 Tracks</span>
        </div>

        <div className="divide-y divide-[#1E2228] text-xs">
          {recentMasters.map((track) => (
            <div
              key={track.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#14171B]/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded bg-[#14171B] border border-[#24282D] flex items-center justify-center text-[#D6AF62] shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#F4F3EF] truncate">{track.title}</div>
                  <div className="text-[11px] text-[#9A9EA6] flex items-center gap-2 mt-0.5">
                    <span>{track.genre}</span>
                    <span>·</span>
                    <span className="font-mono">{track.format}</span>
                  </div>
                </div>
              </div>

              {/* Center Metrics */}
              <div className="flex items-center gap-6 font-mono text-[11px]">
                <div>
                  <span className="text-[#646A73] block text-[9px] uppercase">LOUDNESS</span>
                  <span className="text-[#F4F3EF]">{track.lufs}</span>
                </div>
                <div>
                  <span className="text-[#646A73] block text-[9px] uppercase">TRUE PEAK</span>
                  <span className="text-[#D6AF62]">{track.truePeak}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[#646A73] block text-[9px] uppercase">MODIFIED</span>
                  <span className="text-[#9A9EA6]">{track.date}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerDemo('synthwave')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14171B] hover:bg-[#1B1F24] text-[#F4F3EF] border border-[#24282D] rounded-lg transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#D6AF62]" />
                  <span>Open</span>
                </button>
                <button
                  onClick={onOpenExportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D6AF62]/10 hover:bg-[#D6AF62]/20 text-[#E7C77F] border border-[#D6AF62]/30 rounded-lg transition cursor-pointer"
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
