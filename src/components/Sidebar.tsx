import React from 'react';
import {
  Sliders,
  History,
  Settings,
  Info
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
}) => {
  const currentActive = activeItem || activeTab || 'mastering';

  const handleSelect = (item: string) => {
    if (onSelectItem) onSelectItem(item);
    if (onSelectTab) onSelectTab(item);
  };

  const NAV_ITEMS = [
    { id: 'mastering', label: 'MASTER', icon: Sliders },
    { id: 'history', label: 'HISTORY', icon: History },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
    { id: 'about', label: 'ABOUT', icon: Info },
  ];

  return (
    <aside className="w-[100px] bg-[var(--bg-primary)] flex flex-col justify-between border-r border-[var(--border-subtle)] shrink-0 select-none hidden md:flex min-h-[calc(100vh-64px)]">
      {/* Top Navigation Links */}
      <div className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentActive === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex flex-col items-center justify-center py-6 gap-2 border-b border-[var(--border-subtle)] transition cursor-pointer relative ${
                isActive
                  ? 'text-[var(--accent-lime)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[1.5]" />
              <span className="text-[10px] font-mono tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Status */}
      <div className="flex flex-col items-center justify-center py-6 border-t border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center gap-2 border border-[var(--border-subtle)] px-2 py-1 rounded-xs bg-[var(--bg-elevated)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)] shadow-[0_0_8px_var(--accent-lime)]" />
          <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase">SYSTEM<br/>OK</span>
        </div>
        <span className="text-[9px] font-mono text-[var(--text-tertiary)] uppercase mt-2">100% LOCAL</span>
      </div>
    </aside>
  );
};
