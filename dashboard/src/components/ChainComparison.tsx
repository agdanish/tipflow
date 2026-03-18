import { useState, useEffect, useRef } from 'react';
import { GitCompareArrows, ChevronDown, ChevronUp, Trophy, Loader2, RefreshCw, Zap, Clock, CheckCircle2, Fuel } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainAnalyticsEntry, ChainAnalyticsResponse } from '../types';

/** Animated counter that counts up from 0 to target */
function AnimatedStat({ value, decimals = 2, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
}

function ChainCard({ chain, color, recommendation }: {
  chain: ChainAnalyticsEntry;
  color: 'blue' | 'teal';
  recommendation: ChainAnalyticsResponse['recommendation'];
}) {
  const colorClasses = color === 'blue'
    ? { border: 'border-blue-500/30', bg: 'bg-blue-500/5', accent: 'text-blue-400', badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400', bar: 'bg-blue-500' }
    : { border: 'border-teal-500/30', bg: 'bg-teal-500/5', accent: 'text-teal-400', badge: 'bg-teal-500/15 border-teal-500/30 text-teal-400', bar: 'bg-teal-500' };

  const isLowestFee = recommendation.lowestFee === chain.chainId;
  const isFastest = recommendation.fastest === chain.chainId;

  return (
    <div className={`rounded-xl border ${colorClasses.border} ${colorClasses.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${colorClasses.accent}`}>{chain.name}</h3>
        <div className="flex gap-1">
          {isLowestFee && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colorClasses.badge}`}>
              <Fuel className="w-2.5 h-2.5" /> Low Fees
            </span>
          )}
          {isFastest && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colorClasses.badge}`}>
              <Zap className="w-2.5 h-2.5" /> Fastest
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Balance</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">
            <AnimatedStat value={parseFloat(chain.balance) || 0} decimals={4} />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Tips Sent</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">
            <AnimatedStat value={chain.totalTips} decimals={0} />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Avg Fee</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">
            <AnimatedStat value={parseFloat(chain.avgFee) || 0} decimals={6} />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Avg Confirm</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-text-muted" />
            <AnimatedStat value={chain.avgConfirmationTime} decimals={0} suffix="s" />
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Success Rate</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className={`h-full rounded-full ${colorClasses.bar} transition-all duration-700`} style={{ width: `${chain.successRate}%` }} />
            </div>
            <span className="text-xs font-medium text-text-primary">
              <AnimatedStat value={chain.successRate} decimals={0} suffix="%" />
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Gas Price</p>
          <p className="text-xs font-medium text-text-primary mt-0.5">{chain.gasPrice}</p>
        </div>
      </div>

      {/* Volume */}
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-text-muted uppercase tracking-wider">Total Volume</p>
        <p className={`text-base font-bold ${colorClasses.accent} mt-0.5`}>
          <AnimatedStat value={parseFloat(chain.totalVolume) || 0} decimals={4} />
        </p>
      </div>
    </div>
  );
}

export function ChainComparison() {
  const [data, setData] = useState<ChainAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getChainAnalytics();
      setData(result);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-accent" />
          Chain Comparison
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {loading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : data ? (
            <>
              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.chains.map((chain, idx) => (
                  <ChainCard
                    key={chain.chainId}
                    chain={chain}
                    color={idx === 0 || chain.chainId.includes('ethereum') ? 'blue' : 'teal'}
                    recommendation={data.recommendation}
                  />
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Recommendations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.recommendation.lowestFee && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-400">Best for Low Fees</p>
                        <p className="text-xs text-text-muted">
                          {data.chains.find(c => c.chainId === data.recommendation.lowestFee)?.name || data.recommendation.lowestFee}
                        </p>
                      </div>
                    </div>
                  )}
                  {data.recommendation.fastest && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-400">Fastest Confirmations</p>
                        <p className="text-xs text-text-muted">
                          {data.chains.find(c => c.chainId === data.recommendation.fastest)?.name || data.recommendation.fastest}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted text-center py-4">Failed to load chain analytics</p>
          )}
        </>
      )}
    </div>
  );
}
