// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { PieChart, TrendingUp, TrendingDown, Wallet, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import { useAnimatedValue } from '../hooks/useAnimatedNumber';
import type { WalletBalance } from '../types';

interface PriceCache {
  eth: number;
  ton: number;
  usdt: number;
}

function PortfolioBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-muted font-mono">${value.toFixed(2)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function PortfolioSummary({ balances }: { balances: WalletBalance[] }) {
  const [prices, setPrices] = useState<PriceCache>({ eth: 0, ton: 0, usdt: 1 });
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const data = await api.getPrices();
      const p = data.prices ?? {};
      setPrices({
        eth: p.ETH ?? p.eth ?? 0,
        ton: p.TON ?? p.ton ?? 0,
        usdt: 1,
      });
    } catch {
      // Use fallback
      setPrices({ eth: 2500, ton: 3.5, usdt: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 30_000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  // Calculate portfolio values
  const chainValues = balances.map((b) => {
    const isEth = b.chainId.startsWith('ethereum');
    const isTron = b.chainId.startsWith('tron');
    const nativePrice = isEth ? prices.eth : isTron ? prices.eth * 0.001 : prices.ton;
    const nativeVal = (parseFloat(b.nativeBalance) || 0) * nativePrice;
    const usdtVal = (parseFloat(b.usdtBalance) || 0) * prices.usdt;
    return {
      chainId: b.chainId,
      label: isEth ? 'Ethereum' : isTron ? 'TRON' : 'TON',
      color: isEth ? '#627eea' : isTron ? '#eb0029' : '#0098ea',
      nativeVal,
      usdtVal,
      total: nativeVal + usdtVal,
    };
  });

  const totalUsd = chainValues.reduce((s, c) => s + c.total, 0);
  const animatedTotal = useAnimatedValue(totalUsd, 800);

  // Track change direction
  useEffect(() => {
    if (totalUsd !== prevTotal && prevTotal > 0) {
      // value changed
    }
    setPrevTotal(totalUsd);
  }, [totalUsd, prevTotal]);

  const changeDir = totalUsd > prevTotal ? 'up' : totalUsd < prevTotal ? 'down' : 'none';

  if (loading && balances.length === 0) {
    return (
      <div className="glass-card glow-hover p-4 sm:p-5">
        <div className="skeleton h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-card glow-hover p-4 sm:p-5 spotlight-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <PieChart className="w-4 h-4 text-accent" />
          Portfolio
        </h2>
        <button
          onClick={fetchPrices}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors btn-press"
          title="Refresh prices"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Total value */}
      <div className="text-center mb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Value</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums tracking-tight">
            <DollarSign className="w-5 h-5 inline text-text-muted -mt-1" />
            {animatedTotal.toFixed(2)}
          </p>
          {changeDir !== 'none' && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${
              changeDir === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {changeDir === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {/* Chain breakdown */}
      <div className="space-y-2.5">
        {chainValues.filter(c => c.total > 0.001).map((chain) => (
          <PortfolioBar
            key={chain.chainId}
            label={chain.label}
            value={chain.total}
            total={totalUsd}
            color={chain.color}
          />
        ))}
        {chainValues.every(c => c.total < 0.001) && (
          <div className="text-center py-4">
            <Wallet className="w-6 h-6 text-text-muted/30 mx-auto mb-1.5" />
            <p className="text-xs text-text-muted">No balances yet</p>
            <p className="text-[10px] text-text-muted/60 mt-0.5">Fund your wallets to see portfolio</p>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {totalUsd > 0.001 && (
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] text-text-muted">Chains</p>
            <p className="text-sm font-semibold text-text-primary">{chainValues.filter(c => c.total > 0.001).length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-muted">USDT %</p>
            <p className="text-sm font-semibold text-accent tabular-nums">
              {totalUsd > 0 ? ((chainValues.reduce((s, c) => s + c.usdtVal, 0) / totalUsd) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
