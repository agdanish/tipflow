interface SkeletonProps {
  variant?: 'card' | 'text-line' | 'circle';
  /** Width — accepts any CSS value or Tailwind class */
  width?: string;
  /** Height — accepts any CSS value or Tailwind class */
  height?: string;
  /** Number of items to repeat (useful for text-line lists) */
  count?: number;
  className?: string;
}

function SkeletonBlock({ variant = 'card', width, height, className = '' }: Omit<SkeletonProps, 'count'>) {
  const base = 'animate-shimmer';

  if (variant === 'circle') {
    const size = width ?? '40px';
    return (
      <div
        className={`${base} rounded-full shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (variant === 'text-line') {
    return (
      <div
        className={`${base} rounded ${className}`}
        style={{ width: width ?? '100%', height: height ?? '12px' }}
      />
    );
  }

  // card
  return (
    <div
      className={`${base} rounded-xl ${className}`}
      style={{ width: width ?? '100%', height: height ?? '120px' }}
    />
  );
}

export function Skeleton({ variant = 'card', width, height, count = 1, className = '' }: SkeletonProps) {
  if (count <= 1) {
    return <SkeletonBlock variant={variant} width={width} height={height} className={className} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock
          key={i}
          variant={variant}
          width={variant === 'text-line' ? `${Math.max(40, 100 - i * 15)}%` : width}
          height={height}
          className={className}
        />
      ))}
    </div>
  );
}

/** Pre-composed skeleton for WalletCard loading */
export function WalletCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Skeleton variant="circle" width="36px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text-line" width="60%" height="14px" />
          <Skeleton variant="text-line" width="30%" height="10px" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton variant="text-line" width="40%" height="10px" />
        <Skeleton variant="text-line" width="70%" height="24px" />
        <Skeleton variant="text-line" width="40%" height="10px" />
        <Skeleton variant="text-line" width="55%" height="20px" />
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <Skeleton variant="text-line" width="80%" height="14px" />
      </div>
    </div>
  );
}

/** Pre-composed skeleton for TipHistory loading */
export function TipHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="circle" width="28px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text-line" width="60%" height="14px" />
            <Skeleton variant="text-line" width="35%" height="10px" />
          </div>
          <Skeleton variant="text-line" width="50px" height="12px" />
        </div>
      ))}
    </div>
  );
}

/** Pre-composed skeleton for StatsPanel loading */
export function StatsPanelSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 rounded-lg border border-border bg-surface-2/50">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="circle" width="28px" />
            <Skeleton variant="text-line" width="50%" height="10px" />
          </div>
          <Skeleton variant="text-line" width="60%" height="20px" />
        </div>
      ))}
    </div>
  );
}
