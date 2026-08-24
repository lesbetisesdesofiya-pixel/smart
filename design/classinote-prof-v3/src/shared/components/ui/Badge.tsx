import React from 'react';

interface BadgeProps {
  color?: 'emerald' | 'amber' | 'rose' | 'blue' | 'gray';
  children: React.ReactNode;
  className?: string;
}

const colors = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const Badge: React.FC<BadgeProps> = ({ color = 'gray', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colors[color]} ${className}`}
  >
    {children}
  </span>
);
