import type { LeaderboardEntry } from '../types';
import { Trophy } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

const RANK_STYLES: Record<number, { badge: string; bg: string; text: string }> = {
  1: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-400' },
  2: { badge: 'bg-gray-300/20 text-gray-300 border-gray-400/30', bg: 'bg-gray-300/5', text: 'text-gray-300' },
  3: { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400' },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold ${style.badge}`}>
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-xs font-medium text-text-muted">
      {rank}
    </span>
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Leaderboard({ entries, loading }: LeaderboardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        Tip Leaderboard
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          variant="no-data"
          title="No leaderboard data"
          description="Send your first tip to see the leaderboard."
        />
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 5).map((entry) => {
            const style = RANK_STYLES[entry.rank];
            return (
              <div
                key={entry.address}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  style
                    ? `${style.bg} border-transparent`
                    : 'bg-surface-2/50 border-transparent'
                }`}
              >
                <RankBadge rank={entry.rank} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-text-primary">
                    {truncateAddress(entry.address)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-text-primary">
                    {entry.totalTips} {entry.totalTips === 1 ? 'tip' : 'tips'}
                  </div>
                  <div className="text-sm text-text-muted">
                    {parseFloat(entry.totalVolume).toFixed(4)} vol
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
