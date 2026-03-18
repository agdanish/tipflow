// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '../lib/api';

interface PriceEntry {
  symbol: string;
  price: number;
  prevPrice: number;
  color: string;
}

export function PriceTicker() {
  const [prices, setPrices] = useState<PriceEntry[]>([]);

  const fetchPrices = useCallback(async () => {
    try {
      const raw = await api.getPrices();
      const data = raw.prices ?? {};
      setPrices((prev) => {
        const entries: PriceEntry[] = [
          {
            symbol: 'ETH',
            price: data.ETH ?? data.eth ?? 0,
            prevPrice: prev.find((p) => p.symbol === 'ETH')?.price ?? data.ETH ?? data.eth ?? 0,
            color: '#627eea',
          },
          {
            symbol: 'TON',
            price: (data as Record<string, number>).TON ?? (data as Record<string, number>).ton ?? 0,
            prevPrice: prev.find((p) => p.symbol === 'TON')?.price ?? data.TON ?? data.ton ?? 0,
            color: '#0098ea',
          },
          {
            symbol: 'USDT',
            price: data.USDT ?? data.usdt ?? 1,
            prevPrice: prev.find((p) => p.symbol === 'USDT')?.price ?? 1,
            color: '#26a17b',
          },
        ];
        return entries;
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 30_000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  if (prices.length === 0 || prices.every((p) => p.price === 0)) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-1">
      {prices.filter(p => p.price > 0).map((entry) => {
        const dir = entry.price > entry.prevPrice ? 'up' : entry.price < entry.prevPrice ? 'down' : 'flat';
        return (
          <div
            key={entry.symbol}
            className="flex items-center gap-1.5 shrink-0"
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: entry.color }}
            >
              {entry.symbol.slice(0, 1)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-text-secondary">{entry.symbol}</span>
              <span className={`text-sm font-mono font-semibold tabular-nums ${
                dir === 'up' ? 'text-green-400' : dir === 'down' ? 'text-red-400' : 'text-text-primary'
              }`}>
                ${entry.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {dir === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {dir === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {dir === 'flat' && <Minus className="w-3 h-3 text-text-muted" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
