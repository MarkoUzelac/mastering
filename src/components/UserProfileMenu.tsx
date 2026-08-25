import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle, logOut } from '../lib/firebase';
import { LogIn, LogOut, Settings, LayoutDashboard, Crown, CreditCard } from 'lucide-react';

interface UserProfileMenuProps {
  onOpenAdmin: () => void;
  onOpenBilling: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenAdmin, onOpenBilling }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-[#222420] animate-pulse"></div>;
  }

  if (!user || !profile) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#B7F000]/10 hover:bg-[#B7F000]/20 text-[#C7FF18] border border-[#B7F000]/30 rounded-sm text-sm font-semibold transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In with Google
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        {profile.photoURL ? (
          <img src={profile.photoURL} alt={profile.displayName} className="w-8 h-8 rounded-full border border-[#222420] hover:border-[#B7F000] transition-colors" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#B7F000] flex items-center justify-center text-\[#F2F2EE\] font-bold text-sm">
            {profile.displayName?.charAt(0) || profile.email.charAt(0)}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-[#0D0E0C] border border-[#222420] rounded-sm shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-[#222420] bg-[#151714]">
              <p className="text-sm font-semibold text-\[#F2F2EE\] truncate">{profile.displayName}</p>
              <p className="text-xs text-[#A5A69F] truncate">{profile.email}</p>
              <div className="mt-2 flex items-center gap-2">
                {profile.subscriptionTier === 'pro' ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#A7F3D0] bg-[#10B981]/20 px-2 py-0.5 rounded border border-[#10B981]/30">
                    <Crown className="w-3 h-3" /> PRO Member
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A5A69F] bg-[#222420] px-2 py-0.5 rounded">
                    Free Plan
                  </span>
                )}
              </div>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => { setIsOpen(false); onOpenBilling(); }}
                className="w-full text-left px-4 py-2 text-sm text-[#A5A69F] hover:bg-[#222420] hover:text-\[#F2F2EE\] flex items-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Subscription & Billing
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => { setIsOpen(false); onOpenAdmin(); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#B7F000] hover:bg-[#B7F000]/10 hover:text-[#C7FF18] flex items-center gap-2 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Control Panel
                </button>
              )}
              
              <div className="h-px bg-[#222420] my-1"></div>
              
              <button
                onClick={() => { setIsOpen(false); logOut(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
