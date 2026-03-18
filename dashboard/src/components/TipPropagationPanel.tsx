// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Radio, Users, Waves, Zap, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface TipWave {
  id: string;
  originTipper: string;
  creatorName: string;
  originalAmount: number;
  amplifiedTotal: number;
  matchMultiplier: number;
  participants: number;
  status: string;
  createdAt: string;
}

interface PropStats {
  totalWaves: number;
  activeWaves: number;
  totalAmplified: number;
  totalParticipants: number;
  avgAmplification: number;
  activePools: number;
  poolBalance: number;
  viralCoefficient: number;
}

export function TipPropagationPanel() {
  const [waves, setWaves] = useState<TipWave[]>([]);
  const [stats, setStats] = useState<PropStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.propagationWaves() as { waves: TipWave[]; stats: PropStats };
      setWaves(data.waves ?? []);
      setStats(data.stats ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-3">
      <Skeleton variant="text-line" width="160px" height="16px" />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <Skeleton key={i} variant="card" height="50px" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Tip Propagation
        </h3>
        <button onClick={load} className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <p className="text-[10px] text-text-secondary">
        Viral tipping with amplifier matching. Every tip creates a wave that can be matched by community pools.
      </p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Waves', stats.totalWaves, <Waves key="w" className="w-3 h-3 text-cyan-400" />],
            ['Amplified', `$${stats.totalAmplified.toFixed(4)}`, <Zap key="z" className="w-3 h-3 text-amber-400" />],
            ['Participants', stats.totalParticipants, <Users key="u" className="w-3 h-3 text-blue-400" />],
            ['Viral K', `${stats.viralCoefficient}x`, <Radio key="r" className="w-3 h-3 text-purple-400" />],
          ].map(([label, value, icon], i) => (
            <div key={label as string} className="p-2 rounded-lg bg-surface-2 border border-border text-center animate-list-item-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">{icon as React.ReactNode}</div>
              <div className="text-sm font-bold text-text-primary tabular-nums">{value as string}</div>
              <div className="text-[9px] text-text-muted">{label as string}</div>
            </div>
          ))}
        </div>
      )}

      {/* Active Waves */}
      {waves.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs text-text-secondary font-medium">Active Waves</h4>
          {waves.slice(0, 5).map((wave, i) => (
            <div key={wave.id} className="p-2.5 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-text-primary">{wave.creatorName}</span>
                  <div className="text-[10px] text-text-muted">
                    ${wave.originalAmount.toFixed(4)} → <span className="text-accent font-bold">${wave.amplifiedTotal.toFixed(4)}</span>
                    <span className="ml-1 text-amber-400">({wave.matchMultiplier}x)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    wave.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-surface-3 text-text-muted'
                  }`}>{wave.status}</span>
                  <div className="text-[9px] text-text-muted mt-0.5">{wave.participants} joined</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Waves className="w-6 h-6 text-text-muted/30 mx-auto mb-1" />
          <p className="text-[10px] text-text-muted">No tip waves yet. Send a tip to start a wave.</p>
        </div>
      )}

      {/* Pool info */}
      {stats && stats.poolBalance > 0 && (
        <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-text-secondary">
          <Zap className="w-3 h-3 text-cyan-400 inline mr-1" />
          Community Amplifier: <span className="text-accent font-bold">${stats.poolBalance.toFixed(4)}</span> available for 2:1 matching
        </div>
      )}
    </div>
  );
}
