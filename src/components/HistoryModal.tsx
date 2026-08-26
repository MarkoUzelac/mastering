import React, { useEffect, useRef } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    // Push state to history to enable Android Back button handling
    window.history.pushState({ modalOpen: 'history' }, '');

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = originalOverflow;
      
      // If the back button wasn't pressed but we're closing, pop the state
      if (window.history.state?.modalOpen === 'history') {
        window.history.back();
      }
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[var(--accent-lime)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Session History Snapshots</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Parameter undo states &amp; preset applications</p>
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
          {historyList.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-3 rounded-sm bg-[#07090C] border border-[#181C22] hover:border-[var(--border-subtle)] transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent-lime)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{entry.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{entry.time} · {entry.target}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRestore(entry);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--accent-lime)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-lime)] border border-[var(--accent-lime)]/40 rounded-sm transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--accent-lime)] hover:bg-[#7C3AED] rounded-sm transition shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
