import React from 'react';
import { Sliders, BarChart3, Bookmark, User, Sparkles } from 'lucide-react';
import { soundHaptics } from '../utils/sound-haptics';

export type MobileTab = 'mastering' | 'analysis' | 'presets' | 'account';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPro?: boolean;
  onOpenAccount: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  isPro = false,
  onOpenAccount,
}) => {
  const tabs = [
    {
      id: 'mastering',
      label: 'Master',
      icon: Sliders,
      action: () => {
        soundHaptics.playButtonTap();
        onTabChange('mastering');
      },
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: BarChart3,
      action: () => {
        soundHaptics.playButtonTap();
        onTabChange('analysis');
      },
    },
    {
      id: 'presets',
      label: 'Presets',
      icon: Bookmark,
      action: () => {
        soundHaptics.playButtonTap();
        onTabChange('presets');
      },
    },
    {
      id: 'account',
      label: isPro ? 'Account' : 'PRO',
      icon: isPro ? User : Sparkles,
      action: () => {
        soundHaptics.playButtonTap();
        onOpenAccount();
      },
      isProBadge: !isPro,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0C0F]/95 backdrop-blur-md border-t border-[#222420] px-3 py-1.5 flex items-center justify-around safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={tab.action}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] min-h-[44px] rounded-xl transition-all cursor-pointer select-none active:scale-90 ${
              isActive
                ? 'text-[#D4FF5C]'
                : 'text-[#686A63] hover:text-[#A5A69F]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-[#B7F000] scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''
                }`}
              />
              {tab.isProBadge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-bold bg-[#B7F000] text-\[#F2F2EE\] rounded-full">
                  PRO
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                isActive ? 'text-[#F2F2EE] font-semibold' : 'text-[#686A63]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
