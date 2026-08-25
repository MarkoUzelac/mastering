import React from 'react';
import { Lock } from 'lucide-react';
import { FeatureGates } from '../billing/feature-gates';

interface ProBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  locked?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  size = 'xs',
  locked = false,
  onClick,
  className = '',
}) => {
  const isPro = FeatureGates.isProUser();
  const showLocked = locked && !isPro;

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 tracking-wider gap-1 font-semibold',
    sm: 'text-[10px] px-2 py-0.5 tracking-widest gap-1 font-semibold',
    md: 'text-xs px-2.5 py-0.5 tracking-widest gap-1.5 font-bold',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-mono rounded select-none transition-all ${
        showLocked
          ? 'bg-[#1C170E] text-[#D6AF62] border border-[#D6AF62]/40 hover:border-[#E7C77F] cursor-pointer'
          : 'bg-[#1C170E] text-[#E7C77F] border border-[#D6AF62]/40'
      } ${sizeClasses[size]} ${className}`}
      title={showLocked ? 'MasteringPro Pro Feature — Click to unlock' : 'Active Pro Feature'}
    >
      {showLocked && <Lock className="w-2.5 h-2.5 text-[#D6AF62]" />}
      <span>PRO</span>
    </span>
  );
};
