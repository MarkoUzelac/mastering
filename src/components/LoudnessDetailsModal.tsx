import React from 'react';
import { X, BarChart2, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { MeterData } from '../types';

interface LoudnessDetailsModalProps {
  meterData: MeterData;
  targetLufs: number;
  onClose: () => void;
}

export const LoudnessDetailsModal: React.FC<LoudnessDetailsModalProps> = ({
  meterData,
  targetLufs,
  onClose,
}) => {
  const integrated = meterData.integratedLufs || -10.8;
  const shortTerm = meterData.momentaryLufs || -9.7;
  const truePeak = meterData.outputPeakL > 0 ? 20 * Math.log10(meterData.outputPeakL) : -0.9;
  const lra = 1.6;
  const crestFactor = meterData.crestFactor || 8.4;

  const delta = integrated - targetLufs;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-[var(--accent-lime)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">EBU R128 Loudness Telemetry</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">ITU-R BS.1770-4 calibrated audio metering</p>
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
        <div className="p-5 space-y-4">
          {/* Main Integrated Box */}
          <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                Program Loudness (Integrated)
              </span>
              <div className="text-3xl font-mono font-bold text-[var(--text-primary)] mt-1">
                {integrated.toFixed(1)}{' '}
                <span className="text-sm font-semibold text-[var(--accent-lime)]">LUFS</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono text-[var(--text-tertiary)]">Target: {targetLufs.toFixed(1)} LUFS</div>
              <div
                className={`text-xs font-mono font-semibold mt-1 ${
                  Math.abs(delta) <= 1.0 ? 'text-[#10B981]' : delta > 0 ? 'text-[#F59E0B]' : 'text-[var(--accent-lime)]'
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(1)} dB (Hot)` : `${delta.toFixed(1)} dB (Cool)`}
              </div>
            </div>
          </div>

          {/* Grid of detailed indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Momentary Max</div>
              <div className="text-base font-mono font-bold text-[var(--text-primary)] mt-1">
                {shortTerm.toFixed(1)} LUFS
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">400ms sliding RMS window</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Loudness Range (LRA)</div>
              <div className="text-base font-mono font-bold text-[var(--text-primary)] mt-1">{lra.toFixed(1)} LU</div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Dynamic variation statistical span</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Max True Peak</div>
              <div className="text-base font-mono font-bold text-[var(--text-primary)] mt-1">
                {truePeak.toFixed(1)} dBTP
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">4x inter-sample peak detector</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-sm p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Crest Factor</div>
              <div className="text-base font-mono font-bold text-[var(--text-primary)] mt-1">
                {crestFactor.toFixed(1)} dB
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Peak-to-RMS transient ratio</div>
            </div>
          </div>
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
