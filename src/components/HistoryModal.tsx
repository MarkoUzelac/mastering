import React from 'react';
import { X, History, RotateCcw, Clock } from 'lucide-react';
import { MasteringPreset } from '../types';

interface HistoryEntry {
  id: string;
  time: string;
  name: string;
  target: string;
  params?: any;
}

interface HistoryModalProps {
  historyList: HistoryEntry[];
  onRestore: (item: HistoryEntry) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  historyList,
  onRestore,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E1116] border border-[#1E2530] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2530] bg-[#0A0C0F]">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#8B5CF6]" />
            <div>
              <h3 className="text-sm font-semibold text-[#F4F3EF]">Session History Snapshots</h3>
              <p className="text-[11px] text-[#646A73]">Parameter undo states &amp; preset applications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9EA6] hover:text-[#F4F3EF] hover:bg-[#14171B] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {historyList.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-3 rounded-xl bg-[#07090C] border border-[#181C22] hover:border-[#24282D] transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#14171B] border border-[#24282D] text-[#8B5CF6]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F4F3EF]">{entry.name}</div>
                  <div className="text-[10px] font-mono text-[#646A73]">{entry.time} · {entry.target}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRestore(entry);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8B5CF6] hover:text-white bg-[#1C162E] hover:bg-[#8B5CF6] border border-[#8B5CF6]/40 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E2530] bg-[#0A0C0F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
