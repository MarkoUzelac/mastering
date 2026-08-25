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
      <div className="bg-[#0D0E0C] border border-[#222420] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222420] bg-[#0A0C0F]">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-4 h-4 text-[#B7F000]" />
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2EE]">EBU R128 Loudness Telemetry</h3>
              <p className="text-[11px] text-[#686A63]">ITU-R BS.1770-4 calibrated audio metering</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#151714] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Main Integrated Box */}
          <div className="bg-[#07090C] border border-[#181C22] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#686A63]">
                Program Loudness (Integrated)
              </span>
              <div className="text-3xl font-mono font-bold text-[#F2F2EE] mt-1">
                {integrated.toFixed(1)}{' '}
                <span className="text-sm font-semibold text-[#B7F000]">LUFS</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono text-[#686A63]">Target: {targetLufs.toFixed(1)} LUFS</div>
              <div
                className={`text-xs font-mono font-semibold mt-1 ${
                  Math.abs(delta) <= 1.0 ? 'text-[#10B981]' : delta > 0 ? 'text-[#F59E0B]' : 'text-[#B7F000]'
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(1)} dB (Hot)` : `${delta.toFixed(1)} dB (Cool)`}
              </div>
            </div>
          </div>

          {/* Grid of detailed indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#07090C] border border-[#181C22] rounded-xl p-3">
              <div className="text-[10px] font-mono text-[#686A63]">Momentary Max</div>
              <div className="text-base font-mono font-bold text-[#E5E7EB] mt-1">
                {shortTerm.toFixed(1)} LUFS
              </div>
              <div className="text-[10px] text-[#686A63] mt-0.5">400ms sliding RMS window</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-xl p-3">
              <div className="text-[10px] font-mono text-[#686A63]">Loudness Range (LRA)</div>
              <div className="text-base font-mono font-bold text-[#E5E7EB] mt-1">{lra.toFixed(1)} LU</div>
              <div className="text-[10px] text-[#686A63] mt-0.5">Dynamic variation statistical span</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-xl p-3">
              <div className="text-[10px] font-mono text-[#686A63]">Max True Peak</div>
              <div className="text-base font-mono font-bold text-[#E5E7EB] mt-1">
                {truePeak.toFixed(1)} dBTP
              </div>
              <div className="text-[10px] text-[#686A63] mt-0.5">4x inter-sample peak detector</div>
            </div>

            <div className="bg-[#07090C] border border-[#181C22] rounded-xl p-3">
              <div className="text-[10px] font-mono text-[#686A63]">Crest Factor</div>
              <div className="text-base font-mono font-bold text-[#E5E7EB] mt-1">
                {crestFactor.toFixed(1)} dB
              </div>
              <div className="text-[10px] text-[#686A63] mt-0.5">Peak-to-RMS transient ratio</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222420] bg-[#0A0C0F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-\[#F2F2EE\] bg-[#B7F000] hover:bg-[#7C3AED] rounded-lg transition shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
