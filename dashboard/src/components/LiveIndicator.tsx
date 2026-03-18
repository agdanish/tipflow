// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface LiveIndicatorProps {
  /** When data was last fetched */
  lastUpdated: Date | null;
  /** Whether data is currently being fetched */
  loading?: boolean;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Compact mode: only show dot + time */
  compact?: boolean;
}

function timeAgoShort(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/**
 * Shows real-time data freshness indicator.
 * Displays "Live", "Xs ago", or "Offline" with animated dot.
 */
export function LiveIndicator({ lastUpdated, loading = false, onRefresh, compact = false }: LiveIndicatorProps) {
  const [, setTick] = useState(0);

  // Refresh display every 5s
  useEffect(() => {
    const id = setInterval(() => setTick((p) => p + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const isRecent = lastUpdated && (Date.now() - lastUpdated.getTime()) < 15000;
  const isStale = lastUpdated && (Date.now() - lastUpdated.getTime()) > 60000;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${
          loading ? 'bg-blue-400 animate-pulse' :
          isRecent ? 'bg-green-400 connection-dot-breathe' :
          isStale ? 'bg-amber-400' : 'bg-green-400'
        }`} />
        <span className="text-xs text-text-muted font-mono tabular-nums">
          {loading ? 'Updating...' : lastUpdated ? timeAgoShort(lastUpdated) : '—'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${
        loading
          ? 'border-blue-500/20 bg-blue-500/5 text-blue-400'
          : isRecent
            ? 'border-green-500/20 bg-green-500/5 text-green-400'
            : isStale
              ? 'border-amber-500/20 bg-amber-500/5 text-amber-400'
              : 'border-green-500/20 bg-green-500/5 text-green-400'
      }`}>
        {loading ? (
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        ) : isStale ? (
          <WifiOff className="w-2.5 h-2.5" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current connection-dot-breathe" />
        )}
        <span>
          {loading ? 'Updating' : isRecent ? 'Live' : lastUpdated ? timeAgoShort(lastUpdated) : 'Offline'}
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          title="Refresh data"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
