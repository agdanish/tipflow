// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Search, TrendingUp, Star, Zap, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface Signal {
  creatorId: string;
  creatorName: string;
  walletAddress: string;
  undervaluationScore: number;
  signals: { engagementGap: number; growthVelocity: number; rewatchRate: number; nicheOpportunity: number; consistency: number };
  suggestedTip: number;
  reasoning: string;
  actedOn: boolean;
}

function SignalBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-surface-3 overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

export function CreatorDiscoveryPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    try {
      const data = await api.discoverySignals() as { signals: Signal[] };
      setSignals(data.signals ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const data = await api.discoveryAnalyze() as { signals: Signal[] };
      setSignals(data.signals ?? []);
    } catch { /* ignore */ }
    setAnalyzing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-3">
      <Skeleton variant="text-line" width="180px" height="16px" />
      {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height="70px" />)}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          Creator Discovery
        </h3>
        <button onClick={analyze} disabled={analyzing} className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1 btn-press disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Discover'}
        </button>
      </div>

      <p className="text-[10px] text-text-secondary">
        AI angel investing — finds undervalued creators with high engagement but low tips.
      </p>

      {signals.length === 0 ? (
        <div className="text-center py-6">
          <Star className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No discovery signals yet</p>
          <p className="text-[10px] text-text-muted/60 mt-1">Click Discover to analyze registered Rumble creators</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.slice(0, 6).map((sig, i) => (
            <div key={sig.creatorId} className={`p-3 rounded-lg border card-hover animate-list-item-in ${
              sig.undervaluationScore > 70 ? 'bg-purple-500/5 border-purple-500/20' : 'bg-surface-2 border-border'
            }`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {sig.undervaluationScore > 70 && <Zap className="w-3.5 h-3.5 text-purple-400" />}
                  <span className="text-xs font-medium text-text-primary">{sig.creatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold tabular-nums ${
                    sig.undervaluationScore > 70 ? 'text-purple-400' : sig.undervaluationScore > 50 ? 'text-amber-400' : 'text-text-secondary'
                  }`}>{sig.undervaluationScore}/100</span>
                  <span className="text-[9px] text-accent tabular-nums">{sig.suggestedTip} USDT</span>
                </div>
              </div>

              {/* Signal breakdown */}
              <div className="space-y-1">
                {[
                  ['Engagement Gap', sig.signals.engagementGap, '#a855f7'],
                  ['Growth', sig.signals.growthVelocity, '#3b82f6'],
                  ['Rewatch', sig.signals.rewatchRate, '#22c55e'],
                  ['Niche', sig.signals.nicheOpportunity, '#f59e0b'],
                  ['Consistency', sig.signals.consistency, '#06b6d4'],
                ].map(([name, value, color]) => (
                  <div key={name as string} className="flex items-center gap-2 text-[9px] text-text-muted">
                    <span className="w-14 shrink-0">{name as string}</span>
                    <SignalBar value={value as number} color={color as string} />
                    <span className="w-6 text-right tabular-nums">{value as number}</span>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-text-muted mt-1.5 italic">{sig.reasoning}</p>
              {sig.actedOn && <span className="text-[8px] text-green-400 mt-1 block">✓ Discovered</span>}
            </div>
          ))}
        </div>
      )}

      <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[9px] text-text-muted">
        <TrendingUp className="w-3 h-3 text-purple-400 inline mr-1" />
        First tippers to undervalued creators earn 2x reputation bonus
      </div>
    </div>
  );
}
