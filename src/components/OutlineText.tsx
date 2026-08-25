import React from 'react';

interface OutlineTextProps {
  text: string;
  outlineColor?: string;
  fillColor?: string;
  strokeWidth?: string;
  className?: string;
  active?: boolean;
}

export const OutlineText: React.FC<OutlineTextProps> = ({
  text,
  className = '',
  active = false
}) => {
  return (
    <span 
      className={`font-extrabold uppercase relative ${active ? 'text-outline-active' : 'text-outline'} ${className}`}
    >
      {text}
    </span>
  );
};
