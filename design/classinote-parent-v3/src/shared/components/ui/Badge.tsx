import React from 'react';

interface BadgeProps {
  color?: 'emerald' | 'amber' | 'rose' | 'blue' | 'violet' | 'gray' | 'navy';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const colors = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/50',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/50',
  blue: 'bg-blue-50 text-blue-700 border-blue-200/50',
  violet: 'bg-violet-50 text-violet-700 border-violet-200/50',
  gray: 'bg-gray-50 text-gray-600 border-gray-200/50',
  navy: 'bg-navy-50 text-navy-700 border-navy-200/50',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({ color = 'gray', size = 'sm', children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full font-bold border ${colors[color]} ${sizes[size]} ${className}`}>
    {children}
  </span>
);
