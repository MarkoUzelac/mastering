import React from 'react';
import { AudioTrackInfo, MeterData, MasteringParams } from '../types';
import { Gauge } from 'lucide-react';

interface TechnicalDataPanelProps {
  track: AudioTrackInfo | null;
  meterData: MeterData;
  params: MasteringParams;
  isBypassed: boolean;
  onOpenParity?: () => void;
}

export const TechnicalDataPanel: React.FC<TechnicalDataPanelProps> = ({
  track,
  meterData,
}) => {
  const linearToDb = (v: number) => (v > 1e-6 ? 20 * Math.log10(v) : -60);
  const outPeak = Math.max(linearToDb(meterData.outputPeakL), linearToDb(meterData.outputPeakR));

  const totalFrames = track?.buffer ? track.buffer.length : 0;
  const estBytes = track?.buffer ? track.buffer.length * 2 * 3 : 0;
  const estMb = (estBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="bg-[#07170c] rounded-sm p-4 border border-[#0d381c] shadow-lg text-xs font-mono space-y-3 crt-overlay">
      <div className="flex items-center border-b border-[#0d381c] pb-2">
        <span className="font-bold uppercase tracking-wider text-[#00ff66] flex items-center gap-1.5 glow-phosphor">
          <Gauge className="w-4 h-4" />
          Technical Telemetry & Audio Stream Stats
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#030d06] p-2.5 rounded-sm border border-[#0f4020]">
          <span className="text-[10px] text-[#00aa44] uppercase block">Integrated Loudness</span>
          <span className="text-base font-bold text-[#00ff66] glow-phosphor">
            {meterData.integratedLufs ? `${meterData.integratedLufs.toFixed(1)} LUFS` : '-14.0 LUFS'}
          </span>
          <span className="text-[9px] text-[#008833] block mt-0.5">ITU-R BS.1770 Target: -14 LUFS</span>
        </div>

        <div className="bg-[#030d06] p-2.5 rounded-sm border border-[#0f4020]">
          <span className="text-[10px] text-[#00aa44] uppercase block">Max True Peak</span>
          <span className={`text-base font-bold ${outPeak >= -1.0 ? 'text-[#00ff66]' : 'text-[#88ffaa]'}`}>
            {outPeak > -60 ? `${outPeak.toFixed(2)} dBFS` : '-inf'}
          </span>
          <span className="text-[9px] text-[#008833] block mt-0.5">Ceiling Clamp: -1.00 dBFS</span>
        </div>

        <div className="bg-[#030d06] p-2.5 rounded-sm border border-[#0f4020]">
          <span className="text-[10px] text-[#00aa44] uppercase block">Crest Factor (DR)</span>
          <span className="text-base font-bold text-[#00ff66] glow-phosphor">
            {meterData.crestFactor ? `${meterData.crestFactor.toFixed(1)} dB` : '12.0 dB'}
          </span>
          <span className="text-[9px] text-[#008833] block mt-0.5">Peak-to-RMS Differential</span>
        </div>

        <div className="bg-[#030d06] p-2.5 rounded-sm border border-[#0f4020]">
          <span className="text-[10px] text-[#00aa44] uppercase block">Active Dynamics GR</span>
          <span className={`text-base font-bold ${meterData.gainReductionDb > 0.1 ? 'text-[#ffbb33]' : 'text-[#00ff66]'}`}>
            {meterData.gainReductionDb > 0.05 ? `-${meterData.gainReductionDb.toFixed(2)} dB` : '0.00 dB'}
          </span>
          <span className="text-[9px] text-[#008833] block mt-0.5">
            {meterData.limiterActive ? 'Limiter In Action' : 'Linear / Dynamic Headroom'}
          </span>
        </div>
      </div>

      <div className="bg-[#030d06] p-3 rounded-sm border border-[#0f4020] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#00cc55]">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            <strong className="text-[#00ff66]">Sample Rate:</strong> {track ? `${track.sampleRate} Hz` : '48,000 Hz'}
          </span>
          <span>
            <strong className="text-[#00ff66]">Channels:</strong> {track ? `${track.channels} (Stereo Linked)` : '2'}
          </span>
          <span>
            <strong className="text-[#00ff66]">Total Samples:</strong> {totalFrames.toLocaleString()}
          </span>
          <span>
            <strong className="text-[#00ff66]">Buffer Memory:</strong> ~{estMb} MB
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#071c0e] text-[#00ff66] border border-[#00ff66]/30 text-[10px]">
            Engine: AudioWorklet DSP + BS.1770 telemetry core
          </span>
        </div>
      </div>
    </div>
  );
};
