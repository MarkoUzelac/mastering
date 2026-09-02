import React, { useState } from 'react';
import { audioEngine } from '../utils/audio-engine';
import { audioBufferToWav } from '../utils/wav-encoder';
import { MasteringParams, AudioTrackInfo } from '../types';
import { Download, X, Check, Loader2, FileAudio, Disc, AlertTriangle } from 'lucide-react';
import { FeatureKey } from '../billing/billing-config';
import { entitlementService } from '../billing/entitlement-service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: AudioTrackInfo | null;
  params: MasteringParams;
  onUpgradeClick?: (featureKey: FeatureKey) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, track, params }) => {
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    const buffer = audioEngine.getLoadedBuffer();
    if (!buffer || !track) {
      setErrorMessage('Učitaj audio zapis prije izvoza.');
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    setProgress(0);
    setDownloadUrl(null);

    try {
      const masteredBuffer = await audioEngine.renderOffline(buffer, params, (pct) => setProgress(pct));
      const wavBlob = audioBufferToWav(masteredBuffer, bitDepth);
      const url = URL.createObjectURL(wavBlob);
      const baseName = track.name.replace(/\.[^/.]+$/, '') || 'mastered-audio';
      const finalName = `${baseName}_mastered_${bitDepth}bit.wav`;

      await entitlementService.recordExport({
        format: `${bitDepth}-bit ${bitDepth === 32 ? 'Float' : 'PCM'} WAV`,
        trackName: finalName,
        duration: masteredBuffer.duration,
        sampleRate: masteredBuffer.sampleRate,
      });

      setDownloadUrl(url);
      setExportedFilename(finalName);
    } catch (error) {
      console.error('Export failed', error);
      setErrorMessage('Izvoz nije uspio. Pokušaj ponovno nakon provjere učitanog audio zapisa.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = exportedFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const bitDepthOptions = [
    { depth: 16 as const, title: '16-bit PCM', desc: 'Kompatibilni CD master' },
    { depth: 24 as const, title: '24-bit PCM', desc: 'Studio master' },
    { depth: 32 as const, title: '32-bit Float', desc: 'Maksimalna interna headroom rezerva' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 p-3 backdrop-blur-md sm:p-4">
      <div className="premium-surface flex max-h-[94vh] w-full min-w-0 max-w-xl flex-col overflow-hidden">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]"><Download className="h-4 w-4" /></div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">Izvoz mastera</h3>
              <p className="truncate text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Lossless WAV render</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori izvoz" className="btn-icon shrink-0"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-w-0 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
            <FileAudio className="h-6 w-6 shrink-0 text-[var(--accent-lime)]" />
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{track?.name || 'Current Track'}</span>
              {track && <span className="block truncate text-[10px] font-mono text-[var(--text-secondary)]">{(track.sampleRate / 1000).toFixed(1)} kHz · {track.channels} ch · {track.duration.toFixed(1)} s</span>}
            </div>
          </div>

          {errorMessage && (
            <div className="flex min-w-0 items-start gap-2 rounded-lg border border-[#E56B6B]/40 bg-[#1C1012] p-3 text-xs text-[#E56B6B]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-anywhere">{errorMessage}</span>
            </div>
          )}

          <section className="space-y-2">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Format i rezolucija</label>
              <span className="text-[10px] font-mono text-[var(--accent-lime)]">Svi formati otključani</span>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
              {bitDepthOptions.map((option) => (
                <button
                  key={option.depth}
                  type="button"
                  disabled={isExporting}
                  onClick={() => setBitDepth(option.depth)}
                  className={`min-w-0 rounded-lg border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-lime)] focus-visible:outline-offset-2 ${bitDepth === option.depth ? 'border-[var(--accent-lime)]/60 bg-[var(--accent-lime-soft)]' : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)]'}`}
                >
                  <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{option.title}</span>
                  <span className="mt-1 block break-anywhere text-[9px] font-mono leading-relaxed text-[var(--text-secondary)]">{option.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-[10px] text-[var(--text-secondary)]">
            <div className="font-semibold uppercase tracking-wider text-[var(--accent-lime)]">Aktivni DSP lanac</div>
            <div className="flex flex-wrap justify-between gap-2"><span>EQ Low / Mid / High</span><span className="text-[var(--text-primary)]">{params.low} / {params.mid} / {params.high} dB</span></div>
            <div className="flex flex-wrap justify-between gap-2"><span>Compression</span><span className="text-[var(--text-primary)]">{params.threshold} dB · {params.ratio}:1 · {params.gain} dB</span></div>
            <div className="flex flex-wrap justify-between gap-2"><span>Ceiling</span><span className="text-[var(--accent-lime)]">-1.0 dBTP</span></div>
          </div>

          {isExporting && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex min-w-0 items-center justify-between gap-3 text-[10px] font-mono text-[var(--accent-lime)]">
                <span className="flex min-w-0 items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /><span className="truncate">Rendering offline DSP…</span></span>
                <span className="shrink-0 tabular-nums">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)] ring-1 ring-[var(--border-subtle)]"><div className="h-full rounded-full bg-[var(--accent-lime)] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {downloadUrl && (
            <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-[var(--accent-lime)]/50 bg-[var(--accent-lime-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--accent-lime)]" /><span className="break-anywhere text-xs font-semibold text-[var(--text-primary)]">{exportedFilename}</span></div>
              <button type="button" onClick={handleDownload} className="btn-primary shrink-0 px-4 text-xs">SPREMI WAV</button>
            </div>
          )}
        </div>

        <footer className="flex min-w-0 flex-col-reverse gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} disabled={isExporting} className="btn-secondary w-full text-xs sm:w-auto">Odustani</button>
          {!downloadUrl && (
            <button type="button" onClick={handleStartExport} disabled={isExporting || !track} className="btn-primary w-full text-xs sm:w-auto">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Disc className="h-4 w-4" />}
              {isExporting ? 'OBRADA…' : `RENDER ${bitDepth}-BIT MASTER`}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
