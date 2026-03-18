// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Sparkles, Check, X, TrendingUp, Clock, Users, Award, Flame } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface Prediction {
  id: string;
  recipient: string;
  amount: string;
  chainId: string;
  reason: string;
  confidence: number;
  category: string;
  status: string;
  generatedAt: string;
}

interface PredictionStats {
  totalPredictions: number;
  accepted: number;
  dismissed: number;
  accuracy: number;
  topCategories: { category: string; count: number }[];
}

const categoryIcons: Record<string, typeof Clock> = {
  time_pattern: Clock,
  recipient_affinity: Users,
  content_trigger: TrendingUp,
  milestone: Award,
  streak: Flame,
};

const categoryColors: Record<string, string> = {
  time_pattern: 'text-blue-400',
  recipient_affinity: 'text-purple-400',
  content_trigger: 'text-orange-400',
  milestone: 'text-yellow-400',
  streak: 'text-red-400',
};

export function PredictorPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const [p, s] = await Promise.all([api.predictionsPending(), api.predictionsStats()]);
      setPredictions(p as unknown as Prediction[]);
      setStats(s as unknown as PredictionStats);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.predictionsGenerate();
      await load();
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const accept = async (id: string) => {
    try { await api.predictionAccept(id); await load(); } catch { /* ignore */ }
  };

  const dismiss = async (id: string) => {
    try { await api.predictionDismiss(id); await load(); } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text-line" width="150px" height="16px" />
        <Skeleton variant="text-line" width="70px" height="28px" />
      </div>
      <Skeleton variant="card" height="40px" />
      <Skeleton variant="card" height="80px" />
      <Skeleton variant="card" height="80px" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Predictive Intelligence
        </h3>
        <button onClick={generate} disabled={generating} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 btn-press">
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Stats */}
      {stats && stats.totalPredictions > 0 && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border text-xs">
          <span className="text-text-secondary">Total: <strong className="text-text-primary">{stats.totalPredictions}</strong></span>
          <span className="text-green-400">Accepted: {stats.accepted}</span>
          <span className="text-red-400">Dismissed: {stats.dismissed}</span>
          <span className="text-accent ml-auto">Accuracy: {stats.accuracy}%</span>
        </div>
      )}

      {/* Predictions */}
      {predictions.length === 0 ? (
        <div className="text-center py-6 animate-fade-in">
          <Sparkles className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted mb-2">No pending predictions</p>
          <button onClick={generate} disabled={generating} className="text-xs text-accent hover:text-accent-light font-medium btn-press">Generate Predictions</button>
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map((pred, i) => {
            const Icon = categoryIcons[pred.category] ?? Sparkles;
            const color = categoryColors[pred.category] ?? 'text-accent';
            return (
              <div key={pred.id} className="p-3 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs font-medium text-text-primary">{pred.category.replace('_', ' ')}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      pred.confidence >= 70 ? 'bg-green-500/10 text-green-400' :
                      pred.confidence >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>{pred.confidence}%</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => accept(pred.id)} className="p-1 rounded hover:bg-green-500/10 text-green-400 transition-colors" title="Accept">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => dismiss(pred.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors" title="Dismiss">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary mb-1">{pred.reason}</p>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <span>{pred.amount} USDT</span>
                  <span>&rarr; {pred.recipient.slice(0, 8)}...{pred.recipient.slice(-4)}</span>
                  <span className="ml-auto">{pred.chainId}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
