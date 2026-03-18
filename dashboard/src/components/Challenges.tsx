import { useState, useEffect, useCallback } from 'react';
import type { Challenge, StreakData } from '../types';
import { api } from '../lib/api';
import { Target, ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Clock, Flame } from 'lucide-react';

function ChallengeProgressBar({ progress, target }: { progress: number; target: number }) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          pct >= 100
            ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
            : 'bg-gradient-to-r from-accent to-cyan-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        setUrgent(false);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000); // under 1 hour

      if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setRemaining(`${minutes}m ${seconds}s`);
      } else {
        setRemaining(`${seconds}s`);
      }
    };

    update();
    const id = setInterval(update, urgent || (new Date(expiresAt).getTime() - Date.now()) < 3600000 ? 1000 : 60000);
    return () => clearInterval(id);
  }, [expiresAt, urgent]);

  return (
    <span className={`inline-flex items-center gap-1 text-xs tabular-nums ${urgent ? 'text-amber-400 font-semibold' : 'text-text-muted'}`}>
      <Clock className={`w-2.5 h-2.5 ${urgent ? 'animate-pulse' : ''}`} />
      {remaining}
    </span>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div
      className={`relative p-3 rounded-xl border transition-all ${
        challenge.completed
          ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.08)]'
          : 'bg-surface-2/50 border-border hover:border-border-hover'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl flex-shrink-0 ${challenge.completed ? '' : 'grayscale-[30%]'}`}>
          {challenge.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className={`text-sm font-semibold truncate ${challenge.completed ? 'text-green-400' : 'text-text-primary'}`}>
              {challenge.title}
            </h3>
            {challenge.completed && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-text-muted mt-0.5">{challenge.description}</p>
          <div className="mt-2">
            <ChallengeProgressBar progress={challenge.progress} target={challenge.target} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-text-muted font-medium">
              {challenge.progress}/{challenge.target}
              {challenge.completed && (
                <span className="ml-1.5 text-green-400">Complete!</span>
              )}
            </span>
            <TimeRemaining expiresAt={challenge.expiresAt} />
          </div>
          {!challenge.completed && (
            <p className="text-xs text-accent/70 mt-1 italic">
              Reward: {challenge.reward}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StreakDisplay({ streak }: { streak: StreakData }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-2/50 border border-border">
      <div className="flex items-center gap-2">
        <Flame className={`w-5 h-5 ${streak.currentStreak > 0 ? 'text-orange-400' : 'text-text-muted'}`} />
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold ${streak.currentStreak > 0 ? 'text-orange-400' : 'text-text-muted'}`}>
              {streak.currentStreak}
            </span>
            <span className="text-sm text-text-muted">day streak</span>
          </div>
          <p className="text-xs text-text-muted">
            Best: {streak.longestStreak} day{streak.longestStreak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
        {streak.streakMilestones.map((m) => (
          <span
            key={m.days}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
              m.reached
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                : 'bg-surface-3 border-border text-text-muted opacity-50'
            }`}
            title={`${m.label}: ${m.days}-day streak`}
          >
            {m.icon} {m.days}d
          </span>
        ))}
      </div>
    </div>
  );
}

export function Challenges() {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [daily, setDaily] = useState<Challenge[]>([]);
  const [weekly, setWeekly] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChallenges = useCallback(async () => {
    try {
      const data = await api.getChallenges();
      setDaily(data.daily);
      setWeekly(data.weekly);
      setStreak(data.streak);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
    const id = setInterval(fetchChallenges, 15000);
    return () => clearInterval(id);
  }, [fetchChallenges]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.refreshChallenges();
      setDaily(data.daily);
      setWeekly(data.weekly);
      setStreak(data.streak);
    } catch {
      // Keep existing
    } finally {
      setRefreshing(false);
    }
  };

  const activeChallenges = tab === 'daily' ? daily : weekly;
  const completedCount = activeChallenges.filter((c) => c.completed).length;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          Challenges
          {streak && streak.currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/20 text-xs font-medium text-orange-400">
              <Flame className="w-2.5 h-2.5" />
              {streak.currentStreak}d streak
            </span>
          )}
        </h2>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Streak display */}
          {streak && <StreakDisplay streak={streak} />}

          {/* Tab bar + refresh */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-0.5 rounded-lg bg-surface-2 border border-border flex-1">
              <button
                onClick={() => setTab('daily')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === 'daily'
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Daily ({daily.filter((c) => c.completed).length}/{daily.length})
              </button>
              <button
                onClick={() => setTab('weekly')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === 'weekly'
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Weekly ({weekly.filter((c) => c.completed).length}/{weekly.length})
              </button>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-surface-2 transition-colors disabled:opacity-50"
              title="Reset daily challenges"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Challenge list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : activeChallenges.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">No active challenges</p>
          ) : (
            <div className="space-y-3">
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}

          {/* Summary bar */}
          {!loading && activeChallenges.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-text-muted">
                {completedCount}/{activeChallenges.length} completed
              </span>
              {completedCount === activeChallenges.length && (
                <span className="text-sm font-medium text-green-400">
                  All challenges complete!
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
