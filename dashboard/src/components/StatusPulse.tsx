// Copyright 2026 Danish A. Licensed under Apache-2.0.
/**
 * Animated status indicator with pulsing rings.
 * Shows connection/health status with visual flair.
 */

interface StatusPulseProps {
  status: 'online' | 'offline' | 'warning' | 'syncing';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  online: { color: '#22c55e', bg: 'bg-green-500', ringColor: 'rgba(34, 197, 94, 0.4)', label: 'Online' },
  offline: { color: '#ef4444', bg: 'bg-red-500', ringColor: 'rgba(239, 68, 68, 0.4)', label: 'Offline' },
  warning: { color: '#f59e0b', bg: 'bg-amber-500', ringColor: 'rgba(245, 158, 11, 0.4)', label: 'Warning' },
  syncing: { color: '#3b82f6', bg: 'bg-blue-500', ringColor: 'rgba(59, 130, 246, 0.4)', label: 'Syncing' },
};

const SIZE_CONFIG = {
  sm: { dot: 'w-2 h-2', ring: 'w-4 h-4', outer: 'w-6 h-6', text: 'text-xs' },
  md: { dot: 'w-2.5 h-2.5', ring: 'w-5 h-5', outer: 'w-7 h-7', text: 'text-sm' },
  lg: { dot: 'w-3 h-3', ring: 'w-6 h-6', outer: 'w-8 h-8', text: 'text-xs' },
};

export function StatusPulse({ status, size = 'md', label, showLabel = true }: StatusPulseProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeConfig.outer} flex items-center justify-center`}>
        {/* Outer pulsing ring */}
        {status !== 'offline' && (
          <span
            className={`absolute inset-0 rounded-full animate-ping opacity-30`}
            style={{ backgroundColor: config.ringColor }}
          />
        )}
        {/* Inner ring */}
        <span
          className={`absolute ${sizeConfig.ring} rounded-full opacity-20`}
          style={{ backgroundColor: config.color }}
        />
        {/* Core dot */}
        <span
          className={`relative ${sizeConfig.dot} rounded-full ${status === 'syncing' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: config.color }}
        />
      </div>
      {showLabel && (
        <span className={`font-medium ${sizeConfig.text}`} style={{ color: config.color }}>
          {label ?? config.label}
        </span>
      )}
    </div>
  );
}
