import React, { useState } from 'react';
import { audioEngine } from '../utils/audio-engine';
import { audioBufferToWav } from '../utils/wav-encoder';
import { MasteringParams, AudioTrackInfo } from '../types';
import { Download, X, Check, Loader2, FileAudio, Disc, AlertTriangle, Sparkles } from 'lucide-react';
import { FeatureGates } from '../billing/feature-gates';
import { entitlementService } from '../billing/entitlement-service';
import { ProBadge } from './ProBadge';
import { FeatureKey } from '../billing/billing-config';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: AudioTrackInfo | null;
  params: MasteringParams;
  onUpgradeClick?: (featureKey: FeatureKey) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  track,
  params,
  onUpgradeClick,
}) => {
  const isPro = FeatureGates.isProUser();
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(isPro ? 24 : 16);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>('');
  const [quotaError, setQuotaError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectBitDepth = (depth: 16 | 24 | 32) => {
    if (depth !== 16 && !isPro) {
      if (onUpgradeClick) {
        onUpgradeClick('HIGH_RES_EXPORT');
      }
      return;
    }
    setBitDepth(depth);
  };

  const handleStartExport = async () => {
    const buffer = audioEngine.getLoadedBuffer();
    if (!buffer) return;

    setQuotaError(null);

    const canExport = entitlementService.canExport();
    if (!canExport.allowed) {
      setQuotaError(canExport.reason || 'Monthly export quota reached.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setDownloadUrl(null);

    try {
      const masteredBuffer = await audioEngine.renderOffline(buffer, params, (pct) => {
        setProgress(pct);
      });

      const wavBlob = audioBufferToWav(masteredBuffer, bitDepth);
      const url = URL.createObjectURL(wavBlob);
      const baseName = track?.name.replace(/\.[^/.]+$/, '') || 'mastered-audio';
      const finalName = `${baseName}_mastered_${bitDepth}bit.wav`;

      await entitlementService.recordExport({
        format: `${bitDepth}-bit PCM WAV`,
        trackName: finalName,
        duration: track?.duration || 0,
        sampleRate: track?.sampleRate || 48000,
      });

      setDownloadUrl(url);
      setExportedFilename(finalName);
    } catch (err) {
      console.error('Export failed', err);
      setQuotaError('An error occurred during local DSP render.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = exportedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const usage = entitlementService.getUsage();

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-lime)]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Export Mastered Audio File
              </h3>
              <div className="text-[10px] font-mono text-[var(--text-secondary)]">Lossless PCM Broadcast WAV</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-sm hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Source Track details */}
          <div className="bg-[var(--bg-primary)] p-3.5 rounded-sm border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileAudio className="w-6 h-6 text-[var(--accent-lime)] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                  {track?.name || 'Current Track'}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {track ? `${track.sampleRate / 1000} kHz · 2 Channels · ${track.duration.toFixed(1)}s` : ''}
                </span>
              </div>
            </div>
            {isPro ? (
              <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[var(--accent-lime)] border border-[var(--accent-lime)]/40 text-[10px] font-mono font-semibold shrink-0">
                PRO ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                {usage.exportsUsed}/{usage.exportsLimit} exports used
              </span>
            )}
          </div>

          {/* Quota Error Banner */}
          {quotaError && (
            <div className="p-3 bg-[#1C1012] border border-[#E56B6B]/40 rounded-sm text-[#E56B6B] space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quotaError}</span>
              </div>
              {onUpgradeClick && (
                <button
                  onClick={() => onUpgradeClick('UNLIMITED_EXPORTS')}
                  className="w-full py-1.5 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] rounded-sm font-semibold text-xs cursor-pointer transition flex items-center justify-center gap-1.5 font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>UPGRADE FOR UNLIMITED EXPORTS</span>
                </button>
              )}
            </div>
          )}

          {/* Bit Depth Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider block">
                Output Format & Resolution
              </label>
              {!isPro && (
                <span className="text-[10px] font-mono text-[var(--accent-lime)]">24/32-bit requires Pro</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { depth: 16 as const, title: '16-bit PCM', desc: 'CD / Standard', isProOnly: false },
                { depth: 24 as const, title: '24-bit PCM', desc: 'Studio Standard', isProOnly: true },
                { depth: 32 as const, title: '32-bit Float', desc: 'Full Headroom', isProOnly: true },
              ].map((item) => {
                const locked = item.isProOnly && !isPro;
                return (
                  <button
                    key={item.depth}
                    onClick={() => handleSelectBitDepth(item.depth)}
                    disabled={isExporting}
                    className={`p-3 rounded-sm border text-left transition cursor-pointer relative ${
                      bitDepth === item.depth
                        ? 'bg-[#1C170E] border-[var(--accent-lime)] text-[var(--text-primary)] shadow-sm'
                        : locked
                        ? 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--accent-lime)]/40'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold block text-[var(--text-primary)]">{item.title}</span>
                      {item.isProOnly && <ProBadge size="xs" locked={locked} />}
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Settings Summary */}
          <div className="bg-[var(--bg-primary)] p-3 rounded-sm border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-1">
            <div className="text-[var(--accent-lime)] font-semibold text-[10px] uppercase">Active Master Chain:</div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span>EQ Low / Mid / High:</span>
              <span className="text-[var(--text-primary)]">
                {params.low > 0 ? `+${params.low}` : params.low} / {params.mid > 0 ? `+${params.mid}` : params.mid} / {params.high > 0 ? `+${params.high}` : params.high} dB
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span>Compression:</span>
              <span className="text-[var(--text-primary)]">{params.threshold} dB · {params.ratio}:1 · +{params.gain} dB</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span>Limiter Ceiling:</span>
              <span className="text-[var(--accent-lime)]">-1.0 dBTP (EBU R128 Compliant)</span>
            </div>
          </div>

          {/* Render progress bar */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs font-mono text-[var(--accent-lime)] gap-1">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">Rendering DSP Master Offline in Web Worker...</span>
                </span>
                <span className="self-end sm:self-auto">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="h-full bg-[var(--accent-lime)] rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Download Banner */}
          {downloadUrl && (
            <div className="bg-[#1C170E] p-3.5 rounded-sm border border-[var(--accent-lime)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full min-w-0">
                <Check className="w-4 h-4 text-[#6FCF97] shrink-0" />
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {exportedFilename}
                </span>
              </div>
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] text-xs font-semibold rounded-sm transition cursor-pointer font-mono shadow-sm shrink-0"
              >
                SAVE FILE
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] sm:bg-transparent sm:hover:bg-transparent border border-[var(--border-subtle)] sm:border-transparent rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            {!downloadUrl ? (
              <button
                onClick={handleStartExport}
                disabled={isExporting || !track}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold font-mono bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] rounded-sm shadow-md shadow-[var(--accent-lime)]/20 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Disc className="w-4 h-4 shrink-0" />}
                <span className="truncate">{isExporting ? 'PROCESSING DSP...' : `RENDER ${bitDepth}-BIT MASTER`}</span>
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold font-mono bg-[var(--accent-lime)] hover:bg-[var(--accent-lime-hover)] text-[var(--bg-primary)] rounded-sm shadow-md shadow-[var(--accent-lime)]/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>DOWNLOAD MASTER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
