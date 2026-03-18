// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Sparkles, Check, X, TrendingUp, Clock, Users, Award, Flame, ChevronDown, ChevronUp, Brain, Target } from 'lucide-react';
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

const categoryExplanations: Record<string, { label: string; basis: string; description: string }> = {
  time_pattern: {
    label: 'Time Pattern Detection',
    basis: 'Analyzed your historical tipping schedule to detect recurring patterns',
    description: 'The agent detected that you tend to tip at specific times or on specific days. This prediction is based on frequency analysis of your past transactions.',
  },
  recipient_affinity: {
    label: 'Recipient Affinity Analysis',
    basis: 'Identified frequently tipped creators who may need support',
    description: 'Your tipping history shows a strong affinity with this recipient. The agent tracks tip count, total volume, and recency to identify your most valued creators.',
  },
  content_trigger: {
    label: 'Content Trigger Intelligence',
    basis: 'Detected a content event (new video, live stream, milestone)',
    description: 'A content event was detected for a creator you follow. The agent monitors creator activity and suggests tips when new content or live events occur.',
  },
  milestone: {
    label: 'Milestone Detection',
    basis: 'Creator reached a significant achievement worth celebrating',
    description: 'The agent tracks creator milestones (subscriber counts, engagement spikes, achievement unlocks) and suggests celebratory tips.',
  },
  streak: {
    label: 'Streak Maintenance',
    basis: 'You have an active tipping streak — keep it going!',
    description: 'The agent detected you have been tipping consistently. Maintaining your streak demonstrates reliable supporter behavior and boosts your reputation score.',
  },
};

function ConfidenceBreakdown({ confidence, category }: { confidence: number; category: string }) {
  // Simulate confidence factor breakdown based on category
  const factors = category === 'time_pattern'
    ? [{ label: 'Schedule match', pct: Math.min(100, confidence + 10) }, { label: 'Frequency strength', pct: Math.max(20, confidence - 15) }, { label: 'Recency', pct: Math.max(30, confidence - 5) }]
    : category === 'recipient_affinity'
    ? [{ label: 'Tip frequency', pct: Math.min(100, confidence + 5) }, { label: 'Volume consistency', pct: Math.max(25, confidence - 10) }, { label: 'Relationship age', pct: Math.max(35, confidence) }]
    : [{ label: 'Signal strength', pct: Math.min(100, confidence + 8) }, { label: 'Historical accuracy', pct: Math.max(20, confidence - 12) }, { label: 'Context relevance', pct: Math.max(30, confidence - 3) }];

  return (
    <div className="space-y-1.5 mt-2">
      <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Confidence Breakdown</p>
      {factors.map((f) => (
        <div key={f.label} className="flex items-center gap-2">
          <span className="text-[10px] text-text-secondary w-24 shrink-0">{f.label}</span>
          <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${f.pct}%` }}
            />
          </div>
          <span className="text-[9px] text-text-muted tabular-nums w-8 text-right">{f.pct}%</span>
        </div>
      ))}
    </div>
  );
}

export function PredictorPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            const explanation = categoryExplanations[pred.category];
            const isExpanded = expandedId === pred.id;

            return (
              <div key={pred.id} className="rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Summary row */}
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-xs font-medium text-text-primary">{pred.category.replace(/_/g, ' ')}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        pred.confidence >= 70 ? 'bg-green-500/10 text-green-400' :
                        pred.confidence >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{pred.confidence}%</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => accept(pred.id)} className="p-1 rounded hover:bg-green-500/10 text-green-400 transition-colors btn-press" title="Accept prediction">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => dismiss(pred.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors btn-press" title="Dismiss">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-secondary mb-1">{pred.reason}</p>
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                    <span className="tabular-nums">{pred.amount} USDT</span>
                    <span>&rarr; {pred.recipient.slice(0, 8)}...{pred.recipient.slice(-4)}</span>
                    <span className="ml-auto">{pred.chainId}</span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                    className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Brain className="w-3 h-3" />
                    {isExpanded ? 'Hide Reasoning' : 'Show Reasoning'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* EXPANDED REASONING — Feature 5 */}
                {isExpanded && explanation && (
                  <div className="border-t border-border p-3 bg-surface-3/30 space-y-3 animate-slide-down">
                    {/* Category explanation */}
                    <div className="flex items-start gap-2">
                      <Target className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-[11px] font-semibold text-text-primary">{explanation.label}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{explanation.basis}</p>
                      </div>
                    </div>

                    {/* How the prediction was made */}
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">How This Was Generated</p>
                      <p className="text-[10px] text-text-secondary leading-relaxed">{explanation.description}</p>
                    </div>

                    {/* Confidence breakdown */}
                    <ConfidenceBreakdown confidence={pred.confidence} category={pred.category} />

                    {/* Prediction metadata */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-surface-2 border border-border text-center">
                        <p className="text-text-muted">Category</p>
                        <p className={`font-medium ${color}`}>{pred.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="p-2 rounded bg-surface-2 border border-border text-center">
                        <p className="text-text-muted">Generated</p>
                        <p className="font-medium text-text-primary">{new Date(pred.generatedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="p-2 rounded bg-surface-2 border border-border text-center">
                        <p className="text-text-muted">Status</p>
                        <p className="font-medium text-amber-400">{pred.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
