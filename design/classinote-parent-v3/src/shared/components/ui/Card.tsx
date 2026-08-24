import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  variant?: 'default' | 'hero' | 'highlight';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
  delay = 0,
}) => {
  const base = 'rounded-2xl transition-all duration-200';
  const variants = {
    default: 'bg-white border border-gray-100 shadow-card hover:shadow-card-hover',
    hero: 'bg-gradient-to-br from-[#002366] to-[#1a3a7a] text-white relative overflow-hidden',
    highlight: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100',
  };

  const interactive = onClick
    ? 'cursor-pointer active:scale-[0.97] hover:-translate-y-0.5'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${base} ${variants[variant]} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
