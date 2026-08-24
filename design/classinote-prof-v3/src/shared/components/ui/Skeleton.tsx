import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-lg',
  className = '',
}) => (
  <div className={`animate-shimmer ${width} ${height} ${rounded} ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card space-y-3">
    <Skeleton width="w-12" height="h-12" rounded="rounded-xl" />
    <Skeleton width="w-3/4" height="h-5" />
    <Skeleton width="w-1/2" height="h-3" />
  </div>
);
