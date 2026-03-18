import { useState } from 'react';
import type { Achievement } from '../types';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';

interface AchievementsProps {
  achievements: Achievement[];
  loading?: boolean;
}

function ProgressBar({ progress, target }: { progress: number; target: number }) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct >= 100 ? 'bg-green-400' : 'bg-accent'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt;
  const pct = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
  return (
    <div
      className={`relative p-3 sm:p-4 rounded-xl border transition-all overflow-hidden ${
        unlocked
          ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.08)] verified-glow'
          : 'bg-surface-2/50 border-border opacity-60'
      }`}
    >
      {/* Shimmer effect on unlocked achievements */}
      {unlocked && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
      )}
      <div className="flex items-start gap-3">
        <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>
          {achievement.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className={`text-sm font-semibold ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
              {achievement.name}
            </h3>
            {unlocked && (
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{achievement.description}</p>
          <ProgressBar progress={achievement.progress} target={achievement.target} />
          <div className="text-[10px] text-text-muted mt-1 flex items-center gap-2">
            <span className="tabular-nums">{achievement.progress}/{achievement.target}</span>
            <span className={`font-semibold tabular-nums ${pct >= 100 ? 'text-green-400' : pct >= 50 ? 'text-accent' : 'text-text-muted'}`}>
              {pct}%
            </span>
            {unlocked && achievement.unlockedAt && (
              <span className="ml-auto text-green-400">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Achievements({ achievements, loading }: AchievementsProps) {
  const [expanded, setExpanded] = useState(false);
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          Achievements
          <span className="text-xs font-normal text-text-muted ml-1">
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </h2>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
