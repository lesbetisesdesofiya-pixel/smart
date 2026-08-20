import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'circle' | 'rounded';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className = '',
  variant = 'circle'
}) => {
  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs font-bold',
    lg: 'w-14 h-14 text-sm font-bold',
    xl: 'w-20 h-20 text-xl font-extrabold'
  };

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // Deterministic color selection based on name
  const bgColors = [
    'bg-[#002366] text-white',
    'bg-[#375ca6] text-white',
    'bg-[#00113a] text-blue-100',
    'bg-[#144089] text-white',
    'bg-slate-700 text-white',
    'bg-[#284785] text-white'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % bgColors.length;
  const colorClass = bgColors[colorIndex];

  return (
    <div
      className={`flex items-center justify-center shrink-0 border border-white/20 shadow-xs font-bold select-none ${sizeClasses[size]} ${roundedClass} ${colorClass} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
