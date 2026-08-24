import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string }> = ({
  icon,
  title,
  description,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
      {icon || <AlertCircle className="w-8 h-8" />}
    </div>
    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
    {description && <p className="text-xs text-gray-400 max-w-[200px]">{description}</p>}
  </motion.div>
);

export const ErrorState: React.FC<{ title?: string; onRetry?: () => void }> = ({
  title = 'Une erreur est survenue',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-rose-400" />
    </div>
    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-3 flex items-center gap-2 px-4 py-2 bg-navy-800 text-white text-xs font-bold rounded-xl hover:bg-navy-700 transition-colors cursor-pointer">
        <RefreshCw className="w-3 h-3" /> Réessayer
      </button>
    )}
  </div>
);
