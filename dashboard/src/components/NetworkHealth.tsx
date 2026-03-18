import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, Database } from 'lucide-react';
import { api } from '../lib/api';
import type { NetworkHealthStatus, IndexerHealthResult } from '../types';

const MAX_LATENCY_HISTORY = 8;

/** Tiny latency sparkline */
function LatencySparkline({ data, status }: { data: number[]; status: string }) {
  if (data.length < 2) return null;
  const width = 40;
  const height = 14;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  const strokeColor = status === 'healthy' ? '#4ade80' : status === 'degraded' ? '#fbbf24' : '#f87171';
  return (
    <svg width={width} height={height} className="inline-block opacity-60 shrink-0">
      <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function NetworkHealth() {
  const [chains, setChains] = useState<NetworkHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [indexer, setIndexer] = useState<IndexerHealthResult | null>(null);
  const [indexerChainCount, setIndexerChainCount] = useState<number>(0);
  const latencyHistory = useRef<Record<string, number[]>>({});
  const healthyChecks = useRef<Record<string, { total: number; healthy: number }>>({});

  const refresh = useCallback(async () => {
    try {
      const data = await api.getNetworkHealth();
      setChains(data.chains);
      setLastChecked(new Date().toLocaleTimeString());
      // Track latency history & uptime
      for (const chain of data.chains) {
        const hist = latencyHistory.current[chain.chainId] ?? [];
        hist.push(chain.latencyMs);
        if (hist.length > MAX_LATENCY_HISTORY) hist.shift();
        latencyHistory.current[chain.chainId] = hist;
        const checks = healthyChecks.current[chain.chainId] ?? { total: 0, healthy: 0 };
        checks.total++;
        if (chain.status === 'healthy') checks.healthy++;
        healthyChecks.current[chain.chainId] = checks;
      }
    } catch {
      // keep existing data
    }
    // Fetch indexer health in parallel (non-blocking)
    try {
      const health = await api.getIndexerHealth();
      setIndexer(health);
      if (health.isAvailable) {
        const chainsResult = await api.getIndexerChains();
        if (chainsResult.data?.chains) {
          setIndexerChainCount(chainsResult.data.chains.length);
        }
      }
    } catch {
      setIndexer({ isAvailable: false, latencyMs: 0, error: 'Unreachable' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const dotColor = (status: string) => {
    if (status === 'healthy') return 'bg-green-400';
    if (status === 'degraded') return 'bg-amber-400';
    return 'bg-red-400';
  };

  const statusLabel = (status: string) => {
    if (status === 'healthy') return 'Healthy';
    if (status === 'degraded') return 'Degraded';
    return 'Down';
  };

  const statusTextColor = (status: string) => {
    if (status === 'healthy') return 'text-green-400';
    if (status === 'degraded') return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <Wifi className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-sm font-medium text-text-secondary">Network Health</h3>
        {lastChecked && (
          <span className="ml-auto text-[10px] text-text-muted">
            Updated {lastChecked}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : chains.length === 0 ? (
        <p className="text-xs text-text-muted">No chains registered</p>
      ) : (
        <div className="space-y-2">
          {chains.map((chain) => (
            <div
              key={chain.chainId}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 border border-border"
            >
              {/* Status dot */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {chain.status === 'healthy' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor(chain.status)}`} />
              </span>

              {/* Chain info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary truncate">{chain.chainName}</span>
                  <span className={`text-[10px] font-semibold ${statusTextColor(chain.status)}`}>
                    {statusLabel(chain.status)}
                  </span>
                  {/* Uptime percentage */}
                  {healthyChecks.current[chain.chainId]?.total > 1 && (
                    <span className="text-[10px] tabular-nums text-text-muted">
                      {Math.round((healthyChecks.current[chain.chainId].healthy / healthyChecks.current[chain.chainId].total) * 100)}% uptime
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-text-muted tabular-nums">
                    {chain.latencyMs}ms
                  </span>
                  {chain.blockNumber !== undefined && (
                    <span className="text-[10px] text-text-muted tabular-nums">
                      Block #{chain.blockNumber.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Latency sparkline */}
              <LatencySparkline
                data={latencyHistory.current[chain.chainId] ?? []}
                status={chain.status}
              />

              {/* Latency bar */}
              <div className="w-12 h-1.5 rounded-full bg-surface-3 overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full transition-all ${
                    chain.status === 'healthy'
                      ? 'bg-green-400'
                      : chain.status === 'degraded'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, (1 - chain.latencyMs / 5000) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WDK Indexer Status */}
      {indexer && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 border border-border">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {indexer.isAvailable && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${indexer.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-text-muted" />
                <span className="text-xs font-medium text-text-primary">WDK Indexer</span>
                <span className={`text-[10px] font-semibold ${indexer.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                  {indexer.isAvailable ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {indexer.isAvailable && (
                  <>
                    <span className="text-[10px] text-text-muted">{indexer.latencyMs}ms</span>
                    {indexerChainCount > 0 && (
                      <span className="text-[10px] text-text-muted">{indexerChainCount} chains</span>
                    )}
                  </>
                )}
                {!indexer.isAvailable && (
                  <span className="text-[10px] text-text-muted truncate">{indexer.error ?? 'Unavailable'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
