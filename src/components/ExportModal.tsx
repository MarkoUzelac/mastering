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
    <div className="fixed inset-0 z-50 bg-[#090A08]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E1013] border border-[#222420] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222420] bg-[#151714]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#151714] border border-[#222420] flex items-center justify-center text-[#B7F000]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2EE]">
                Export Mastered Audio File
              </h3>
              <div className="text-[10px] font-mono text-[#A5A69F]">Lossless PCM Broadcast WAV</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5A69F] hover:text-[#F2F2EE] p-1 rounded-lg hover:bg-[#151714] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Source Track details */}
          <div className="bg-[#090A08] p-3.5 rounded-xl border border-[#222420] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileAudio className="w-6 h-6 text-[#B7F000] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#F2F2EE] block truncate">
                  {track?.name || 'Current Track'}
                </span>
                <span className="text-[11px] font-mono text-[#A5A69F]">
                  {track ? `${track.sampleRate / 1000} kHz · 2 Channels · ${track.duration.toFixed(1)}s` : ''}
                </span>
              </div>
            </div>
            {isPro ? (
              <span className="px-2 py-0.5 rounded bg-[#1C170E] text-[#B7F000] border border-[#B7F000]/40 text-[10px] font-mono font-semibold shrink-0">
                PRO ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#A5A69F] shrink-0">
                {usage.exportsUsed}/{usage.exportsLimit} exports used
              </span>
            )}
          </div>

          {/* Quota Error Banner */}
          {quotaError && (
            <div className="p-3 bg-[#1C1012] border border-[#E56B6B]/40 rounded-xl text-[#E56B6B] space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quotaError}</span>
              </div>
              {onUpgradeClick && (
                <button
                  onClick={() => onUpgradeClick('UNLIMITED_EXPORTS')}
                  className="w-full py-1.5 bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] rounded-lg font-semibold text-xs cursor-pointer transition flex items-center justify-center gap-1.5 font-mono"
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
              <label className="text-[10px] font-mono font-medium text-[#A5A69F] uppercase tracking-wider block">
                Output Format & Resolution
              </label>
              {!isPro && (
                <span className="text-[10px] font-mono text-[#B7F000]">24/32-bit requires Pro</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
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
                    className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                      bitDepth === item.depth
                        ? 'bg-[#1C170E] border-[#B7F000] text-[#F2F2EE] shadow-sm'
                        : locked
                        ? 'bg-[#090A08] border-[#222420] text-[#686A63] hover:border-[#B7F000]/40'
                        : 'bg-[#090A08] border-[#222420] text-[#A5A69F] hover:bg-[#151714]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold block text-[#F2F2EE]">{item.title}</span>
                      {item.isProOnly && <ProBadge size="xs" locked={locked} />}
                    </div>
                    <span className="text-[10px] text-[#A5A69F] font-mono">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Settings Summary */}
          <div className="bg-[#090A08] p-3 rounded-lg border border-[#222420] text-[11px] font-mono text-[#A5A69F] space-y-1">
            <div className="text-[#B7F000] font-semibold text-[10px] uppercase">Active Master Chain:</div>
            <div className="flex justify-between">
              <span>EQ Low / Mid / High:</span>
              <span className="text-[#F2F2EE]">
                {params.low > 0 ? `+${params.low}` : params.low} / {params.mid > 0 ? `+${params.mid}` : params.mid} / {params.high > 0 ? `+${params.high}` : params.high} dB
              </span>
            </div>
            <div className="flex justify-between">
              <span>Compression:</span>
              <span className="text-[#F2F2EE]">{params.threshold} dB · {params.ratio}:1 · +{params.gain} dB</span>
            </div>
            <div className="flex justify-between">
              <span>Limiter Ceiling:</span>
              <span className="text-[#B7F000]">-1.0 dBTP (EBU R128 Compliant)</span>
            </div>
          </div>

          {/* Render progress bar */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-[#B7F000]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rendering DSP Master Offline in Web Worker...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#090A08] rounded-full overflow-hidden border border-[#222420]">
                <div
                  className="h-full bg-[#B7F000] rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Download Banner */}
          {downloadUrl && (
            <div className="bg-[#1C170E] p-3.5 rounded-xl border border-[#B7F000] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#6FCF97]" />
                <span className="text-xs font-semibold text-[#F2F2EE] truncate max-w-[240px]">
                  {exportedFilename}
                </span>
              </div>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] text-xs font-semibold rounded-lg transition cursor-pointer font-mono shadow-sm"
              >
                SAVE FILE
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#222420]">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-[#A5A69F] hover:text-[#F2F2EE] transition cursor-pointer"
            >
              Cancel
            </button>
            {!downloadUrl ? (
              <button
                onClick={handleStartExport}
                disabled={isExporting || !track}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold font-mono bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] rounded-lg shadow-md shadow-[#B7F000]/20 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Disc className="w-4 h-4" />}
                <span>{isExporting ? 'PROCESSING DSP...' : `RENDER ${bitDepth}-BIT MASTER`}</span>
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold font-mono bg-[#B7F000] hover:bg-[#C7FF18] text-[#090A08] rounded-lg shadow-md shadow-[#B7F000]/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD MASTER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
