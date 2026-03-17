import { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { api } from '../lib/api';

const CURRENCIES = ['ETH', 'TON', 'USDT', 'USD'] as const;
type Currency = (typeof CURRENCIES)[number];

const ICONS: Record<Currency, string> = {
  ETH: '\u27E0',   // ⟠
  TON: '\uD83D\uDC8E', // 💎
  USDT: '\uD83D\uDCB5', // 💵
  USD: '\uD83D\uDCB2',  // 💲
};

/** Default prices (used before API fetch completes) */
const DEFAULT_PRICES: Record<string, number> = {
  ETH: 2500,
  TON: 2.5,
  USDT: 1.0,
};

export function CurrencyConverter() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES);
  const [amount, setAmount] = useState('1');
  const [source, setSource] = useState<Currency>('USD');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPrices().then((data) => {
      if (!cancelled) {
        setPrices(data.prices);
        setLastUpdated(data.lastUpdated);
      }
    }).catch(() => {
      // keep defaults
    });
    return () => { cancelled = true; };
  }, []);

  /** Convert source amount to USD value */
  const usdValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return 0;
    if (source === 'USD') return num;
    const price = prices[source] ?? 1;
    return num * price;
  }, [amount, source, prices]);

  /** Convert USD value to each target currency */
  const conversions = useMemo(() => {
    return CURRENCIES
      .filter((c) => c !== source)
      .map((c) => {
        if (c === 'USD') return { currency: c, value: usdValue };
        const price = prices[c] ?? 1;
        return { currency: c, value: usdValue / price };
      });
  }, [source, usdValue, prices]);

  const formatValue = (val: number, currency: Currency): string => {
    if (val === 0) return '0';
    // For very small values show more decimals
    if (currency === 'ETH') return val < 0.0001 ? val.toExponential(2) : val.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    if (currency === 'TON') return val.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    if (currency === 'USDT' || currency === 'USD') return val.toFixed(2);
    return val.toString();
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
          <ArrowLeftRight className="w-4 h-4" />
          Currency Converter
        </h3>
        {lastUpdated && (
          <span className="text-[10px] text-text-muted">
            Approx. prices
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-border font-mono"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as Currency)}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-border cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {ICONS[c]} {c}
            </option>
          ))}
        </select>
      </div>

      {/* Conversion results */}
      <div className="space-y-1.5">
        {conversions.map(({ currency, value }) => (
          <div
            key={currency}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2"
          >
            <span className="text-xs text-text-secondary flex items-center gap-1.5">
              <span className="text-sm">{ICONS[currency]}</span>
              {currency}
            </span>
            <span className="text-sm font-mono text-text-primary">
              {formatValue(value, currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-2 text-[10px] text-text-muted text-center">
        Approximate rates for estimation only
      </p>
    </div>
  );
}
