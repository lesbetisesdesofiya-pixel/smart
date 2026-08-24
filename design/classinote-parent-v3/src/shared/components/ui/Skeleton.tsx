import React from 'react';

export const Skeleton: React.FC<{ width?: string; height?: string; rounded?: string; className?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-xl',
  className = '',
}) => <div className={`animate-shimmer ${width} ${height} ${rounded} ${className}`} />;

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-3xl p-5 border border-gray-100/80 shadow-card space-y-4">
    <Skeleton width="w-14" height="h-14" rounded="rounded-2xl" />
    <Skeleton width="w-3/4" height="h-5" />
    <Skeleton width="w-1/2" height="h-3" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
