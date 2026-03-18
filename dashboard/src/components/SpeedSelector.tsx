import { useState, useEffect } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { GasSpeedOption, ChainGasSpeeds } from '../types';

export type SpeedLevel = 'slow' | 'normal' | 'fast';

interface SpeedSelectorProps {
  selectedSpeed: SpeedLevel;
  onSpeedChange: (speed: SpeedLevel) => void;
  disabled?: boolean;
  chainFilter?: string;
}

const SPEED_ICONS: Record<SpeedLevel, string> = {
  slow: '\u{1F422}',
  normal: '\u26A1',
  fast: '\u{1F680}',
};

const SPEED_COLORS: Record<SpeedLevel, string> = {
  slow: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  normal: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  fast: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const SPEED_ACTIVE: Record<SpeedLevel, string> = {
  slow: 'border-blue-500 bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
  normal: 'border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
  fast: 'border-red-500 bg-red-500/20 text-red-300 ring-1 ring-red-500/30',
};

export function SpeedSelector({ selectedSpeed, onSpeedChange, disabled, chainFilter }: SpeedSelectorProps) {
  const [chainSpeeds, setChainSpeeds] = useState<ChainGasSpeeds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getGasSpeeds()
      .then(({ speeds }) => {
        if (!cancelled) setChainSpeeds(speeds);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Pick the relevant chain's speeds, or first available
  const relevantChain = chainFilter
    ? chainSpeeds.find((c) => c.chainId === chainFilter) ?? chainSpeeds[0]
    : chainSpeeds[0];

  const speedOptions: GasSpeedOption[] = relevantChain?.speeds ?? [
    { level: 'slow', label: 'Slow (save fees)', gasPriceGwei: '--', estimatedFee: '--', estimatedTime: '~5-10 min' },
    { level: 'normal', label: 'Normal', gasPriceGwei: '--', estimatedFee: '--', estimatedTime: '~1-3 min' },
    { level: 'fast', label: 'Fast (priority)', gasPriceGwei: '--', estimatedFee: '--', estimatedTime: '~15-30 sec' },
  ];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Gauge className="w-3.5 h-3.5 text-text-secondary" />
        <label className="text-xs text-text-secondary">Transaction Speed</label>
        {loading && <Loader2 className="w-3 h-3 text-text-muted animate-spin ml-auto" />}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {speedOptions.map((opt) => {
          const isActive = selectedSpeed === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => onSpeedChange(opt.level)}
              disabled={disabled}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive ? SPEED_ACTIVE[opt.level] : SPEED_COLORS[opt.level]
              } hover:opacity-90`}
            >
              <span className="text-sm leading-none">{SPEED_ICONS[opt.level]}</span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-0.5">
                {opt.level}
              </span>
              <span className="text-xs text-text-muted leading-tight mt-0.5">
                {opt.estimatedFee}
              </span>
              <span className="text-xs text-text-muted leading-tight">
                {opt.estimatedTime}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
