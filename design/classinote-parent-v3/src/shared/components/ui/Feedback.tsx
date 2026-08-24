import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  description,
  action,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 px-6 text-center"
  >
    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5 text-gray-400">
      {icon || <Inbox className="w-8 h-8" />}
    </div>
    <p className="text-base font-bold text-gray-900 mb-1">{title}</p>
    {description && <p className="text-sm text-gray-400 max-w-[220px]">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export const ErrorState: React.FC<{ title?: string; onRetry?: () => void }> = ({
  title = 'Une erreur est survenue',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-5">
      <AlertCircle className="w-8 h-8 text-rose-400" />
    </div>
    <p className="text-base font-bold text-gray-900 mb-1">{title}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-navy-800 text-white text-sm font-bold rounded-2xl hover:bg-navy-700 transition-colors cursor-pointer">
        <RefreshCw className="w-4 h-4" /> Réessayer
      </button>
    )}
  </div>
);
