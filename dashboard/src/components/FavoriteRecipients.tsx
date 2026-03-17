import { useState, useEffect, useCallback } from 'react';
import { Star, Send, ChevronUp, ChevronDown, Clock, Users } from 'lucide-react';
import type { TipHistoryEntry, FavoriteRecipient } from '../types';

const STORAGE_KEY = 'tipflow-favorite-recipients';

function loadFavorites(): FavoriteRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteRecipient[];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavoriteRecipient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

interface FavoriteRecipientsProps {
  history: TipHistoryEntry[];
  onQuickTip: (address: string) => void;
}

export function FavoriteRecipients({ history, onQuickTip }: FavoriteRecipientsProps) {
  const [favorites, setFavorites] = useState<FavoriteRecipient[]>(loadFavorites);

  // Auto-detect top 5 most-tipped recipients from history
  const deriveFromHistory = useCallback(() => {
    const counts: Record<string, { count: number; lastTipped: string }> = {};
    for (const entry of history) {
      if (entry.status !== 'confirmed') continue;
      if (!counts[entry.recipient]) {
        counts[entry.recipient] = { count: 0, lastTipped: entry.createdAt };
      }
      counts[entry.recipient].count++;
      if (entry.createdAt > counts[entry.recipient].lastTipped) {
        counts[entry.recipient].lastTipped = entry.createdAt;
      }
    }

    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5);

    return sorted.map(([address, { count, lastTipped }]) => ({
      address,
      tipCount: count,
      lastTipped,
    }));
  }, [history]);

  // Merge auto-detected with manually starred, preserving star state
  useEffect(() => {
    const detected = deriveFromHistory();
    setFavorites(prev => {
      const existing = new Map(prev.map(f => [f.address, f]));
      const merged: FavoriteRecipient[] = [];
      let order = 0;

      // First: starred favorites (preserve order)
      const starred = prev.filter(f => f.starred).sort((a, b) => a.order - b.order);
      for (const s of starred) {
        const det = detected.find(d => d.address === s.address);
        merged.push({
          ...s,
          tipCount: det?.tipCount ?? s.tipCount,
          lastTipped: det?.lastTipped ?? s.lastTipped,
          order: order++,
        });
      }

      // Then: auto-detected not already starred
      for (const d of detected) {
        if (!existing.has(d.address) || !existing.get(d.address)!.starred) {
          merged.push({
            address: d.address,
            name: existing.get(d.address)?.name,
            tipCount: d.tipCount,
            lastTipped: d.lastTipped,
            starred: false,
            order: order++,
          });
        }
      }

      saveFavorites(merged);
      return merged;
    });
  }, [deriveFromHistory]);

  const toggleStar = (address: string) => {
    setFavorites(prev => {
      const updated = prev.map(f =>
        f.address === address ? { ...f, starred: !f.starred } : f
      );
      saveFavorites(updated);
      return updated;
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFavorites(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      const reordered = arr.map((f, i) => ({ ...f, order: i }));
      saveFavorites(reordered);
      return reordered;
    });
  };

  const moveDown = (index: number) => {
    setFavorites(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      const reordered = arr.map((f, i) => ({ ...f, order: i }));
      saveFavorites(reordered);
      return reordered;
    });
  };

  const formatAddress = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;

  const formatTime = (iso?: string) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (favorites.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-amber-400" />
        Favorite Recipients
        <span className="ml-auto text-xs font-normal text-text-muted">{favorites.length} recipients</span>
      </h2>

      <div className="space-y-1.5">
        {favorites.map((fav, idx) => (
          <div
            key={fav.address}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-2 border border-border hover:border-border-light transition-colors group"
          >
            {/* Star toggle */}
            <button
              onClick={() => toggleStar(fav.address)}
              className={`shrink-0 p-0.5 transition-colors ${
                fav.starred
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-text-muted hover:text-amber-400'
              }`}
              title={fav.starred ? 'Unstar' : 'Star as favorite'}
            >
              <Star className={`w-3.5 h-3.5 ${fav.starred ? 'fill-current' : ''}`} />
            </button>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
              {fav.name ? fav.name.charAt(0).toUpperCase() : fav.address.slice(2, 4).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {fav.name && (
                <p className="text-xs font-medium text-text-primary truncate">{fav.name}</p>
              )}
              <p className="text-[10px] font-mono text-text-muted truncate">{formatAddress(fav.address)}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-text-muted">{fav.tipCount} tips</span>
                <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(fav.lastTipped)}
                </span>
              </div>
            </div>

            {/* Quick tip */}
            <button
              onClick={() => onQuickTip(fav.address)}
              className="shrink-0 px-2.5 py-1.5 rounded-md bg-accent/10 border border-accent-border text-accent text-[11px] font-medium hover:bg-accent/20 transition-colors flex items-center gap-1"
              title="Quick tip"
            >
              <Send className="w-3 h-3" />
              Tip
            </button>

            {/* Reorder buttons */}
            <div className="shrink-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === favorites.length - 1}
                className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                title="Move down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
