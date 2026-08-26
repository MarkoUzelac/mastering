import React, { useEffect, useState } from 'react';
import { BootManager, BootStatus } from '../utils/boot-system';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [bootStatus, setBootStatus] = useState<BootStatus>({
    stage: 'INITIAL',
    progress: 0,
    message: 'Initializing...',
    isError: false,
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = BootManager.subscribe((status) => {
      setBootStatus(status);
      if (status.stage === 'READY') {
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 300);
        }, 500);
      }
    });

    BootManager.boot();

    return () => unsubscribe();
  }, [onComplete]);

  if (bootStatus.isError) {
    return (
      <div className="fixed inset-0 z-[9999] flex place-items-center justify-center bg-[#090A08] text-[var(--text-primary)] p-4">
        <div className="w-full max-w-md bg-[#111210] border border-[#ef4444]/30 rounded-md p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4 text-[#ef4444]">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-xl font-bold tracking-tight">Engine Initialization Failed</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 font-mono bg-black/50 p-3 rounded border border-white/5 break-words">
            {bootStatus.errorDetails || bootStatus.message}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[#1a1b19] rounded-sm text-sm font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-label="Starting MasteringLocal Pro"
      className={`fixed inset-0 z-[9999] flex place-items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] transition-opacity duration-300 ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="w-full max-w-md px-6 sm:px-0">
        <div className="text-[clamp(28px,8vw,54px)] font-extrabold tracking-[-0.045em] leading-tight">
          Mastering<span className="text-[var(--accent-lime)]">Local</span>.Pro
        </div>
        
        <div className="mt-2.5 mb-7.5 text-[var(--text-secondary)] text-[11px] font-bold tracking-[0.18em] uppercase">
          BROWSER MASTERING WORKSTATION
        </div>
        
        <div className="flex items-center justify-between gap-4 mb-2.5 text-[13px]">
          <span className="truncate pr-4">{bootStatus.message}</span>
          <span className="text-[var(--accent-lime)] font-mono tabular-nums shrink-0">{Math.floor(bootStatus.progress)}%</span>
        </div>
        
        <div className="h-[5px] rounded-full bg-[var(--bg-elevated)] overflow-hidden" aria-hidden="true">
          <div 
            className="h-full bg-[var(--accent-lime)] transition-all duration-300 ease-out"
            style={{ width: `${bootStatus.progress}%` }} 
          />
        </div>
        
        <div className="mt-3.5 text-[var(--text-tertiary)] text-[11px]">
          Local-first audio processing · original audio remains unchanged
        </div>
      </div>
    </div>
  );
};
