import React from 'react';
import { UserUsage } from '../billing/entitlement-service';
import { Activity, Infinity as InfinityIcon } from 'lucide-react';

interface UsageMeterProps {
  usage: UserUsage;
  isPro: boolean;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ usage, compact = false }) => {
  const exportsUsed = Math.max(0, usage.exportsUsed);

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]" aria-label="Studio usage">
        <Activity className="h-3 w-3 shrink-0 text-[var(--accent-lime)]" />
        <span className="text-[var(--text-secondary)]">Exports</span>
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">{exportsUsed}</span>
        <span className="text-[var(--text-tertiary)]">·</span>
        <InfinityIcon className="h-3 w-3 shrink-0 text-[var(--accent-lime)]" aria-hidden="true" />
        <span className="truncate text-[var(--text-secondary)]">Unlimited</span>
      </div>
    );
  }

  return (
    <div className="premium-surface safe-width space-y-3 p-4 font-mono text-xs">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent-lime-soft)] text-[var(--accent-lime)]">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Studio usage</span>
            <span className="block truncate font-semibold text-[var(--text-primary)]">Unlimited master exports</span>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-lime)]">
          <InfinityIcon className="h-3 w-3" />
          {exportsUsed} rendered
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)] ring-1 ring-[var(--border-subtle)]" aria-hidden="true">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--accent-lime)]/15 via-[var(--accent-lime)]/45 to-[var(--accent-lime)]" />
      </div>
      <p className="break-anywhere text-[11px] leading-relaxed text-[var(--text-secondary)]">
        Sve mastering, analiza, preset profili i izvoz formati dostupni su bez plaćenog plana i bez mjesečnog limita.
      </p>
    </div>
  );
};
