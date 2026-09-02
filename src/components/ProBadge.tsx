import React from 'react';

interface ProBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  locked?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Retained as a compatibility component so older callers remain type-safe.
 * Paid-tier badges are intentionally not rendered in the free studio edition.
 */
export const ProBadge: React.FC<ProBadgeProps> = () => null;
