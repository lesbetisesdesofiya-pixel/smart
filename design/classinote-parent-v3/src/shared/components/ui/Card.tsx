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
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: '#ffffff',
      border: '1px solid #f3f4f6',
      borderRadius: '24px',
      boxShadow: '0 4px 24px rgba(0, 35, 102, 0.06)',
    },
    hero: {
      background: 'linear-gradient(135deg, #002366, #1a3a7a, #2d4a8a)',
      color: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      position: 'relative',
    },
    highlight: {
      background: 'linear-gradient(135deg, #eff6ff, #eef2ff, #f5f3ff)',
      border: '1px solid rgba(219,227,244,0.5)',
      borderRadius: '24px',
    },
    glass: {
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.8)',
      borderRadius: '24px',
      boxShadow: '0 4px 24px rgba(0, 35, 102, 0.06)',
    },
  };

  const interactiveStyle: React.CSSProperties = onClick ? {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ ...variantStyles[variant], ...interactiveStyle }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
