import React from 'react';
import { UserUsage } from '../billing/entitlement-service';
import { Sparkles, Activity } from 'lucide-react';

interface UsageMeterProps {
  usage: UserUsage;
  isPro: boolean;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  usage,
  isPro,
  onUpgradeClick,
  compact = false,
}) => {
  if (isPro) {
    return (
      <div className={`flex items-center gap-2 font-mono text-xs ${compact ? 'text-[11px]' : ''}`}>
        <div className="flex items-center gap-1.5 text-[#00ff66]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-bold">PRO PLAN</span>
        </div>
        <span className="text-[#00aa44]">· Unlimited Master Exports</span>
      </div>
    );
  }

  const { exportsUsed, exportsLimit } = usage;
  const percentage = Math.min(100, (exportsUsed / exportsLimit) * 100);
  const remaining = Math.max(0, exportsLimit - exportsUsed);
  const isNearLimit = remaining <= 1;

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <div className="flex items-center gap-1 text-[#88ffaa]">
          <Activity className="w-3 h-3 text-[#00ff66]" />
          <span>Exports:</span>
          <span className="font-bold text-[#00ff66]">{exportsUsed}/{exportsLimit}</span>
        </div>
        <div className="w-16 h-1.5 bg-[#030d06] rounded-full overflow-hidden border border-[#0f4020]">
          <div
            className={`h-full transition-all duration-300 ${
              isNearLimit ? 'bg-[#f59e0b]' : 'bg-[#00ff66]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {remaining > 0 ? (
          <span className="text-[10px] text-[#00aa44]">({remaining} left)</span>
        ) : (
          <button
            onClick={onUpgradeClick}
            className="text-[10px] text-[#f59e0b] hover:underline font-bold cursor-pointer"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#030d06] p-3 rounded-xl border border-[#0f4020] space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ff66]" />
          <span className="font-bold text-[#88ffaa]">Monthly Export Quota</span>
        </div>
        <span className={`font-bold ${isNearLimit ? 'text-[#f59e0b]' : 'text-[#00ff66]'}`}>
          {exportsUsed} / {exportsLimit} used
        </span>
      </div>

      <div className="w-full h-2 bg-[#020804] rounded-full overflow-hidden border border-[#0d381c]">
        <div
          className={`h-full transition-all duration-300 ${
            isNearLimit ? 'bg-[#f59e0b]' : 'bg-[#00ff66]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#00aa44]">
        <span>{remaining} free 16-bit exports remaining this billing cycle</span>
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="text-[#f59e0b] hover:text-[#fbbf24] font-bold cursor-pointer transition"
          >
            Unlock Unlimited →
          </button>
        )}
      </div>
    </div>
  );
};
