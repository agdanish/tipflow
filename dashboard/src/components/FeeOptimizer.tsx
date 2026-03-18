// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { Fuel, RefreshCw, Clock, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { chainColor } from '../lib/utils';

interface FeeData {
  chainId: string;
  fee: string;
  speed: string;
  congestion: 'low' | 'medium' | 'high';
}

export function FeeOptimizer() {
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimal, setOptimal] = useState<{ chain: string; timing: string } | null>(null);

  const fetchFees = useCallback(async () => {
    try {
      const [current, timing] = await Promise.allSettled([
        api.feesCurrent(),
        api.feesOptimalTiming(),
      ]);

      if (current.status === 'fulfilled') {
        const data = current.value as { chains?: FeeData[] };
        if (data.chains) {
          setFees(data.chains);
        }
      }

      if (timing.status === 'fulfilled') {
        const data = timing.value as { recommendation?: string; bestChain?: string };
        if (data.bestChain) {
          setOptimal({
            chain: data.bestChain,
            timing: data.recommendation ?? 'Send now for best rates',
          });
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
    const id = setInterval(fetchFees, 15_000);
    return () => clearInterval(id);
  }, [fetchFees]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-3 sm:p-4">
        <div className="skeleton h-20 rounded-lg" />
      </div>
    );
  }

  const sorted = [...fees].sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
  const cheapest = sorted[0];
  const savings = sorted.length > 1
    ? ((1 - parseFloat(sorted[0]?.fee || '0') / parseFloat(sorted[sorted.length - 1]?.fee || '1')) * 100).toFixed(0)
    : '0';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Fuel className="w-3.5 h-3.5 text-accent" />
          Fee Optimizer
        </h2>
        <button
          onClick={fetchFees}
          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
          title="Refresh fees"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Optimal recommendation */}
      {cheapest && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/5 border border-green-500/15 mb-3">
          <Zap className="w-4 h-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-green-400">
              Best: {cheapest.chainId.includes('ton') ? 'TON' : cheapest.chainId.includes('ethereum') ? 'Ethereum' : cheapest.chainId}
            </p>
            <p className="text-[10px] text-text-muted">
              Save up to {savings}% vs other chains
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-green-400 tabular-nums shrink-0">
            {parseFloat(cheapest.fee).toFixed(6)}
          </span>
        </div>
      )}

      {/* Chain fees list */}
      <div className="space-y-1.5">
        {sorted.map((chain, i) => {
          const isEth = chain.chainId.includes('ethereum');
          const name = isEth ? 'Ethereum' : chain.chainId.includes('ton') ? 'TON' : chain.chainId;
          const congestionColor = chain.congestion === 'low'
            ? 'text-green-400'
            : chain.congestion === 'high'
              ? 'text-red-400'
              : 'text-amber-400';
          const isCheapest = i === 0;

          return (
            <div
              key={chain.chainId}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors ${
                isCheapest ? 'bg-green-500/5 border border-green-500/10' : 'bg-surface-2/50'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: chainColor(chain.chainId as import('../types').ChainId) }}
              />
              <span className="text-xs text-text-secondary flex-1">{name}</span>
              <span className={`text-[10px] ${congestionColor}`}>
                {chain.congestion === 'low' ? 'Low' : chain.congestion === 'high' ? 'High' : 'Med'}
              </span>
              <span className="text-xs font-mono text-text-primary tabular-nums">
                {parseFloat(chain.fee).toFixed(6)}
              </span>
              {isCheapest && (
                <span className="text-[9px] font-bold text-green-400 uppercase">Best</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Optimal timing hint */}
      {optimal && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <Clock className="w-3 h-3" />
            <span>{optimal.timing}</span>
          </div>
        </div>
      )}
    </div>
  );
}
