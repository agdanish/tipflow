// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Eye, RotateCw, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface EngagementRec {
  creatorId: string;
  creatorName: string;
  walletAddress: string;
  engagementScore: number;
  multiplier: number;
  adjustedAmount: number;
  reasoning: string;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular-nums w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export function EngagementPanel() {
  const [recs, setRecs] = useState<EngagementRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await api.engagementTips('default', 0.01) as { recommendations: EngagementRec[] };
      setRecs(data.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engagement data');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-3">
      <Skeleton variant="text-line" width="160px" height="16px" />
      <Skeleton variant="card" height="80px" />
      <Skeleton variant="card" height="80px" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          Engagement Scoring
        </h3>
        <button onClick={load} aria-label="Refresh engagement data" className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1">
          <RotateCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <p className="text-xs text-text-secondary">
        Dynamic tip amounts based on 5-factor engagement algorithm. Higher engagement = higher tip multiplier (0.5x–3.0x).
      </p>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      {recs.length === 0 && !error ? (
        <div className="text-center py-6">
          <Eye className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No engagement data yet</p>
          <p className="text-xs text-text-muted/60 mt-1">Watch Rumble creator videos to generate engagement scores</p>
        </div>
      ) : recs.length > 0 ? (
        <div className="space-y-2">
          {recs.slice(0, 5).map((rec, i) => (
            <div key={rec.creatorId} className="p-3 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary">{rec.creatorName}</span>
                    <p className="text-xs text-text-muted">{rec.walletAddress.slice(0, 8)}...{rec.walletAddress.slice(-4)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-accent" />
                    <span className="text-sm font-bold text-accent tabular-nums">{rec.multiplier}x</span>
                  </div>
                  <span className="text-xs text-text-secondary tabular-nums">{rec.adjustedAmount} USDT</span>
                </div>
              </div>

              <ScoreBar score={rec.engagementScore} label="Overall" />

              <p className="text-xs text-text-muted mt-1.5 italic">{rec.reasoning}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Algorithm explanation */}
      <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-xs text-text-secondary">
        <p className="font-medium text-accent mb-1">Algorithm Weights:</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-center">
          {[['Watch', '40%'], ['Rewatch', '20%'], ['Frequency', '15%'], ['Loyalty', '15%'], ['Category', '10%']].map(([name, weight]) => (
            <div key={name}>
              <div className="font-bold text-text-primary">{weight}</div>
              <div className="text-text-muted">{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
