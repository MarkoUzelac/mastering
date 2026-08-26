import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#121418] border border-[var(--border-subtle)] max-w-md w-full rounded-sm shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-sm transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-[var(--accent-lime)]/10 rounded-full flex items-center justify-center border border-[var(--accent-lime)]/30">
             <div className="w-8 h-8 rounded-full border-[3px] border-[var(--accent-lime)] border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-serif text-[var(--text-primary)] tracking-tight">Sign In to Master</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Securely authenticate with Google to save custom presets, access version history, and unlock commercial mastering exports.
            </p>
          </div>

          <div className="pt-2 pb-4">
            <button
              onClick={() => {
                signInWithGoogle();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-4 py-3 rounded-sm text-base font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>
          </div>

          <div className="space-y-2 text-left bg-[var(--bg-secondary)] p-4 rounded-sm border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>100% Client-side processing. Audio never leaves your browser.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>Free tier includes 5 standard WAV exports per month.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
