// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Zap, TrendingDown, TrendingUp, Minus, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface ChainFee {
  chainId: string;
  chainName: string;
  feeUsd: number;
  congestion: string;
  confirmationTime: number;
  nativeToken: string;
}

interface FeeComparison {
  amount: string;
  chains: ChainFee[];
  recommendation: {
    bestChain: string;
    reason: string;
    savings: string;
    savingsPercent: number;
  };
  optimizationScore: number;
}

interface OptimalTiming {
  recommendation: string;
  currentStatus: string;
  chains: Record<string, string>;
}

const congestionColors: Record<string, string> = {
  low: 'text-green-400 bg-green-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  high: 'text-red-400 bg-red-500/10',
};

export function FeeArbitragePanel() {
  const [comparison, setComparison] = useState<FeeComparison | null>(null);
  const [timing, setTiming] = useState<OptimalTiming | null>(null);
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [c, t] = await Promise.all([api.feesCompare(amount), api.feesOptimalTiming()]);
      setComparison(c as unknown as FeeComparison);
      setTiming(t as unknown as OptimalTiming);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setLoading(true);
    await load();
  };

  if (loading && !comparison) return <div className="p-4 text-text-secondary text-sm">Loading fees...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          Cross-Chain Fee Arbitrage
        </h3>
        <button onClick={refresh} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Amount Input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-text-primary text-xs"
          step="0.001"
          min="0.001"
        />
        <span className="text-xs text-text-secondary">USDT</span>
        <button onClick={refresh} className="text-xs px-2 py-1.5 rounded bg-accent/10 text-accent">Compare</button>
      </div>

      {/* Chain Fee Cards */}
      {comparison && (
        <div className="space-y-2">
          {[...comparison.chains].sort((a, b) => a.feeUsd - b.feeUsd).map((chain, idx) => (
            <div key={chain.chainId} className={`p-3 rounded-lg border ${
              idx === 0 ? 'bg-accent/5 border-accent/30' : 'bg-surface-2 border-border'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">BEST</span>}
                  <span className="text-xs font-medium text-text-primary">{chain.chainName}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${congestionColors[chain.congestion] ?? ''}`}>
                  {chain.congestion}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary font-mono">${chain.feeUsd.toFixed(6)}</span>
                <span className="text-text-secondary">~{chain.confirmationTime}s</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {comparison && comparison.recommendation.savingsPercent > 0 && (
        <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/20 text-xs">
          <p className="text-green-400 font-medium">Save {comparison.recommendation.savingsPercent}%</p>
          <p className="text-text-secondary mt-0.5">{comparison.recommendation.reason}</p>
        </div>
      )}

      {/* Timing */}
      {timing && (
        <div className={`p-2.5 rounded-lg border text-xs ${
          timing.currentStatus === 'optimal' ? 'bg-green-500/5 border-green-500/20' :
          timing.currentStatus === 'acceptable' ? 'bg-yellow-500/5 border-yellow-500/20' :
          'bg-red-500/5 border-red-500/20'
        }`}>
          <p className="text-text-primary font-medium flex items-center gap-1">
            {timing.currentStatus === 'optimal' ? <TrendingDown className="w-3 h-3 text-green-400" /> :
             timing.currentStatus === 'wait' ? <TrendingUp className="w-3 h-3 text-red-400" /> :
             <Minus className="w-3 h-3 text-yellow-400" />}
            {timing.recommendation}
          </p>
        </div>
      )}

      {/* Optimization Score */}
      {comparison && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${comparison.optimizationScore}%` }} />
          </div>
          <span className="text-xs text-text-secondary">{comparison.optimizationScore}% optimal</span>
        </div>
      )}
    </div>
  );
}
