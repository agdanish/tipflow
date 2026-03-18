import { useState, useEffect, useCallback } from 'react';
import { Star, Trophy, Lightbulb, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';

interface CreatorReputation {
  address: string;
  name?: string;
  score: number;
  rawScore: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalReceived: number;
  tipCount: number;
  uniqueTippers: number;
  avgTipAmount: number;
  firstTipAt: string;
  lastTipAt: string;
  scoreHistory: Array<{ date: string; score: number }>;
}

interface ReputationRecommendation {
  address: string;
  name?: string;
  score: number;
  tier: string;
  reason: string;
  suggestedAmount: string;
  confidence: number;
}

const TIER_CONFIG: Record<CreatorReputation['tier'], { emoji: string; color: string; bg: string; border: string; barColor: string }> = {
  bronze:   { emoji: '\uD83E\uDD49', color: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/10', border: 'border-[#CD7F32]/30', barColor: '#CD7F32' },
  silver:   { emoji: '\uD83E\uDD48', color: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]/10', border: 'border-[#C0C0C0]/30', barColor: '#C0C0C0' },
  gold:     { emoji: '\uD83E\uDD47', color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', barColor: '#FFD700' },
  platinum: { emoji: '\uD83D\uDC8E', color: 'text-[#E5E4E2]', bg: 'bg-[#E5E4E2]/10', border: 'border-[#E5E4E2]/30', barColor: '#E5E4E2' },
  diamond:  { emoji: '\uD83D\uDCA0', color: 'text-[#B9F2FF]', bg: 'bg-[#B9F2FF]/10', border: 'border-[#B9F2FF]/30', barColor: '#B9F2FF' },
};

function truncateAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ScoreBar({ score, tier }: { score: number; tier: CreatorReputation['tier'] }) {
  const config = TIER_CONFIG[tier];
  const pct = Math.min(100, score);

  return (
    <div className="w-full h-2 rounded-full bg-surface-1 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: config.barColor }}
      />
    </div>
  );
}

function TierBadge({ tier }: { tier: CreatorReputation['tier'] }) {
  const config = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${config.bg} ${config.color} border ${config.border}`}>
      {config.emoji} {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

export function ReputationPanel() {
  const [leaderboard, setLeaderboard] = useState<CreatorReputation[]>([]);
  const [recommendations, setRecommendations] = useState<ReputationRecommendation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(true);
  const [expandedAddr, setExpandedAddr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [lb, recs] = await Promise.all([
        api.getReputationLeaderboard(10),
        api.getReputationRecommendations(undefined, 5),
      ]);
      setLeaderboard(lb.leaderboard);
      setTotal(lb.total);
      setRecommendations(recs.recommendations);
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <div className="skeleton h-40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-card glow-hover p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Reputation Engine
        </h2>
        <span className="text-xs text-text-muted">{total} creators</span>
      </div>

      {/* Leaderboard */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-sm">
          No reputation data yet. Tip creators to build the leaderboard.
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {leaderboard.map((creator, index) => {
            const config = TIER_CONFIG[creator.tier];
            const isExpanded = expandedAddr === creator.address;

            return (
              <div key={creator.address} className="rounded-lg bg-surface-2 border border-border overflow-hidden animate-list-item-in" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  onClick={() => setExpandedAddr(isExpanded ? null : creator.address)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  {/* Rank */}
                  <span className={`w-6 text-center text-xs font-bold ${index < 3 ? config.color : 'text-text-muted'}`}>
                    #{index + 1}
                  </span>

                  {/* Name / address */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {creator.name ? (
                        <span className="text-sm font-medium text-text-primary truncate">{creator.name}</span>
                      ) : (
                        <span className="font-mono text-xs text-text-primary">{truncateAddress(creator.address)}</span>
                      )}
                      <TierBadge tier={creator.tier} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ScoreBar score={creator.score} tier={creator.tier} />
                      <span className="text-[10px] text-text-muted whitespace-nowrap">{creator.score.toFixed(0)}</span>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border pt-2 animate-slide-down">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{creator.tipCount}</div>
                        <div className="text-[10px] text-text-muted">Tips Received</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary flex items-center justify-center gap-1">
                          <Users className="w-3 h-3" />{creator.uniqueTippers}
                        </div>
                        <div className="text-[10px] text-text-muted">Unique Tippers</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">{creator.avgTipAmount.toFixed(4)}</div>
                        <div className="text-[10px] text-text-muted">Avg Amount</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                      <span>Total: {creator.totalReceived.toFixed(4)} USDT</span>
                      <span>Raw: {creator.rawScore.toFixed(1)}</span>
                    </div>
                    {/* Mini score history */}
                    {creator.scoreHistory.length >= 2 && (
                      <div className="mt-2 flex items-end gap-0.5 h-8">
                        {creator.scoreHistory.slice(-12).map((point, i) => {
                          const max = Math.max(...creator.scoreHistory.map((p) => p.score));
                          const heightPct = max > 0 ? (point.score / max) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-t-sm transition-all"
                              style={{
                                height: `${Math.max(4, heightPct)}%`,
                                backgroundColor: config.barColor,
                                opacity: 0.4 + (i / creator.scoreHistory.slice(-12).length) * 0.6,
                              }}
                              title={`${point.date}: ${point.score.toFixed(0)}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Recommendations */}
      <div className="border-t border-border pt-4">
        <button
          onClick={() => setShowRecs((prev) => !prev)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            AI Recommendations
          </h3>
          {showRecs ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {showRecs && (
          <div className="space-y-2">
            {recommendations.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-3">
                No recommendations available. More tipping data needed.
              </p>
            ) : (
              recommendations.map((rec, i) => {
                const tierKey = rec.tier as CreatorReputation['tier'];
                const config = TIER_CONFIG[tierKey] ?? TIER_CONFIG.bronze;
                const confidencePct = Math.round(rec.confidence * 100);

                return (
                  <div key={rec.address} className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="shrink-0 mt-0.5">
                      <Star className="w-4 h-4" style={{ color: config.barColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {rec.name ? (
                          <span className="text-sm font-medium text-text-primary">{rec.name}</span>
                        ) : (
                          <span className="font-mono text-xs text-text-primary">{truncateAddress(rec.address)}</span>
                        )}
                        <TierBadge tier={tierKey} />
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{rec.reason}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="text-xs font-semibold text-accent">{rec.suggestedAmount} USDT</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                          <TrendingUp className="w-3 h-3" />
                          {confidencePct}% confidence
                          <div className="w-12 h-1.5 rounded-full bg-surface-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${confidencePct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
