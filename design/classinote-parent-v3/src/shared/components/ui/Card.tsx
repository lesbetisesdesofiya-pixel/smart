import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  variant?: 'default' | 'hero' | 'highlight' | 'glass';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  delay?: number;
  padding?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
  delay = 0,
  padding = 'p-5',
}) => {
  const base = 'rounded-3xl transition-all duration-300';
  const variants = {
    default: `bg-white border border-gray-100/80 shadow-card hover:shadow-card-hover`,
    hero: 'bg-gradient-to-br from-[#002366] via-[#1a3a7a] to-[#2d4a8a] text-white relative overflow-hidden',
    highlight: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/50',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/80 shadow-card',
  };

  const interactive = onClick
    ? 'cursor-pointer active:scale-[0.97] hover:-translate-y-0.5'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${base} ${variants[variant]} ${interactive} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
