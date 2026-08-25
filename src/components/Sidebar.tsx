import React from 'react';
import {
  Sliders,
  Layers,
  BarChart2,
  History,
  Bookmark,
  Settings,
  Sparkles,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { UserEntitlement } from '../billing/entitlement-service';

export type SidebarTab = 'mastering' | 'stems' | 'loudness' | 'history' | 'presets' | 'settings' | string;

interface SidebarProps {
  activeTab?: string;
  activeItem?: string;
  onSelectItem?: (item: string) => void;
  onSelectTab?: (tab: string) => void;
  onUpgradeClick?: () => void;
  onOpenManageSubscription?: () => void;
  entitlement?: UserEntitlement;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeItem,
  onSelectItem,
  onSelectTab,
  onUpgradeClick,
  onOpenManageSubscription,
  entitlement,
}) => {
  const currentActive = activeItem || activeTab || 'mastering';

  const handleSelect = (item: string) => {
    if (onSelectItem) onSelectItem(item);
    if (onSelectTab) onSelectTab(item);
  };

  const handleUpgrade = () => {
    if (onUpgradeClick) onUpgradeClick();
    if (onOpenManageSubscription) onOpenManageSubscription();
  };

  const NAV_ITEMS = [
    { id: 'mastering', label: 'Mastering', icon: Sliders },
    { id: 'stems', label: 'Stems', icon: Layers, badge: 'New' },
    { id: 'loudness', label: 'Loudness', icon: BarChart2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'presets', label: 'Presets', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 xl:w-60 bg-[#0A0C0F] border-r border-[#222420] flex flex-col justify-between p-3.5 shrink-0 select-none hidden md:flex">
      {/* Top Navigation Links */}
      <div className="space-y-1">
        <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#686A63] mb-1">
          Workstation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentActive === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer relative ${
                isActive
                  ? 'bg-[#1C162E] text-[#F2F2EE] shadow-sm'
                  : 'text-[#A5A69F] hover:text-[#F2F2EE] hover:bg-[#12161D]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#B7F000]' : 'text-[#686A63] group-hover:text-[#A5A69F]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-[#B7F000] text-\[#F2F2EE\] rounded-full">
                    {item.badge}
                  </span>
                )}
                {/* Purple Active Bar Indicator on Right */}
                {isActive && <span className="w-1 h-3.5 rounded-full bg-[#B7F000]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom PRO Card & Version */}
      <div className="space-y-3 pt-4 border-t border-[#222420]">
        {/* PRO PLAN Support Card */}
        <div className="bg-[#0D0E0C] border border-[#222420] rounded-xl p-3 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B7F000] text-\[#F2F2EE\]">
              PRO
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1C162E] text-[#C7FF18] border border-[#B7F000]/30">
              PLAN
            </span>
          </div>

          <p className="text-[11px] text-[#A5A69F] leading-relaxed">
            Thank you for supporting <strong className="text-[#F2F2EE]">MasteringPro Local</strong>.
          </p>

          <button
            onClick={handleUpgrade}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg text-\[#F2F2EE\] bg-gradient-to-r from-[#B7F000] to-[#8CA800] hover:from-[#9333EA] hover:to-[#7C3AED] transition shadow-[0_0_12px_rgba(139,92,246,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Manage Subscription</span>
          </button>
        </div>

        {/* Footer Version Tag */}
        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#686A63]">
          <span>v2.4.0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Local WASM
          </span>
        </div>
      </div>
    </aside>
  );
};
