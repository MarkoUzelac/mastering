import React from 'react';
import { Sliders, Search, FolderOpen, Sparkles, UserRound } from 'lucide-react';

export interface SidebarProps {
  activeTab?: string;
  activeItem?: string;
  onSelectItem?: (item: string) => void;
  onSelectTab?: (tab: string) => void;
  onUpgradeClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeItem,
  onSelectItem,
  onSelectTab,
}) => {
  const currentActive = activeItem || activeTab || 'mastering';

  const handleSelect = (item: string) => {
    onSelectItem?.(item);
    onSelectTab?.(item);
  };

  const NAV_ITEMS = [
    { id: 'landing', label: 'STUDIO', icon: Sparkles },
    { id: 'analysis', label: 'ANALYZE', icon: Search },
    { id: 'mastering', label: 'MASTER', icon: Sliders },
    { id: 'dashboard', label: 'PROJECTS', icon: FolderOpen },
  ];

  return (
    <aside className="w-[100px] bg-[var(--bg-primary)] flex flex-col justify-between border-r border-[var(--border-subtle)] shrink-0 select-none hidden md:flex min-h-[calc(100vh-64px)]">
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
                  ? 'text-[var(--accent-lime)] bg-[var(--accent-lime)]/5'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent-lime)]" />}
              <Icon className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[9px] font-mono tracking-[0.15em]">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center py-6 border-t border-[var(--border-subtle)] space-y-2">
        <button onClick={() => handleSelect('settings')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Account">
          <UserRound className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 border border-[var(--border-subtle)] px-2 py-1 rounded-xs bg-[var(--bg-elevated)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)] shadow-[0_0_8px_var(--accent-lime)]" />
          <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase">SYSTEM<br/>OK</span>
        </div>
        <span className="text-[9px] font-mono text-[var(--text-tertiary)] uppercase mt-2">LOCAL DSP</span>
      </div>
    </aside>
  );
};
