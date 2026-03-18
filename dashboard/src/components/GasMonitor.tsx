import { useState, useEffect, useCallback } from 'react';
import { Fuel, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { api } from '../lib/api';
import { LiveIndicator } from './LiveIndicator';
import type { GasPriceInfo } from '../types';

const STATUS_COLORS: Record<GasPriceInfo['status'], { dot: string; bg: string; text: string; label: string }> = {
  low: { dot: 'bg-green-400', bg: 'bg-green-500/10', text: 'text-green-400', label: 'Low' },
  medium: { dot: 'bg-yellow-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Medium' },
  high: { dot: 'bg-red-400', bg: 'bg-red-500/10', text: 'text-red-400', label: 'High' },
};

const REFRESH_INTERVAL = 30_000; // 30 seconds
const MAX_HISTORY = 5;

interface ChainGasHistory {
  prices: number[];
}

/** Tiny sparkline rendered as an SVG polyline */
function Sparkline({ data, status }: { data: number[]; status: GasPriceInfo['status'] }) {
  if (data.length < 2) return null;

  const width = 48;
  const height = 16;
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

  const strokeColor = status === 'low' ? '#4ade80' : status === 'medium' ? '#facc15' : '#f87171';

  return (
    <svg width={width} height={height} className="inline-block ml-1.5 opacity-70">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function GasMonitor() {
  const [gasPrices, setGasPrices] = useState<GasPriceInfo[]>([]);
  const [history, setHistory] = useState<Record<string, ChainGasHistory>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchGas = useCallback(async () => {
    try {
      const { chains } = await api.getGasPrices();
      setGasPrices(chains);
      setLastRefresh(new Date());

      // Append to history (keep last MAX_HISTORY readings)
      setHistory((prev) => {
        const next = { ...prev };
        for (const chain of chains) {
          const existing = next[chain.chainId] ?? { prices: [] };
          const price = parseFloat(chain.gasPriceGwei);
          const prices = [...existing.prices, price].slice(-MAX_HISTORY);
          next[chain.chainId] = { prices };
        }
        return next;
      });
    } catch {
      // Silently fail — keep stale data visible
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGas();
    const id = setInterval(fetchGas, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchGas]);

  const anyLow = gasPrices.some((g) => g.status === 'low');

  const trendIcon = (chainId: string) => {
    const h = history[chainId];
    if (!h || h.prices.length < 2) return <Minus className="w-3 h-3 text-text-muted" />;
    const last = h.prices[h.prices.length - 1];
    const prev = h.prices[h.prices.length - 2];
    if (last < prev) return <TrendingDown className="w-3 h-3 text-green-400" />;
    if (last > prev) return <TrendingUp className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-text-muted" />;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="skeleton h-20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
          <Fuel className="w-4 h-4" />
          Gas Prices
        </h3>
        <LiveIndicator lastUpdated={lastRefresh} loading={loading} onRefresh={fetchGas} compact />
      </div>

      <div className="space-y-2">
        {gasPrices.map((chain) => {
          const colors = STATUS_COLORS[chain.status];
          const isEvm = chain.chainId.startsWith('ethereum');

          return (
            <div
              key={chain.chainId}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />

              {/* Chain name */}
              <span className="text-xs font-medium text-text-primary min-w-[100px]">
                {chain.chainName}
              </span>

              {/* Gas price with color coding */}
              <span className={`text-xs font-mono tabular-nums font-semibold ${colors.text}`}>
                {isEvm ? `${chain.gasPriceGwei} gwei` : `~${chain.gasPriceGwei} TON`}
              </span>

              {/* Sparkline */}
              <Sparkline
                data={history[chain.chainId]?.prices ?? []}
                status={chain.status}
              />

              {/* Trend icon */}
              {trendIcon(chain.chainId)}

              {/* Status badge */}
              <span
                className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
              >
                {colors.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Gas thresholds reference */}
      <div className="mt-2 flex items-center gap-3 px-3 py-1.5 text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> &lt;20 gwei</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> 20-50 gwei</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> &gt;50 gwei</span>
      </div>

      {/* Best time to tip banner */}
      {anyLow && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <span className="text-green-400 text-xs font-semibold animate-pulse">
            Best time to tip!
          </span>
          <span className="text-[10px] text-green-400/70">
            Gas is low — transactions are cheap right now
          </span>
        </div>
      )}
    </div>
  );
}
