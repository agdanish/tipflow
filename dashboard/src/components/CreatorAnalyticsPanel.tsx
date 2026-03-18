// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, TrendingDown, Search, DollarSign, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface PlatformAnalytics {
  totalTipsProcessed: number;
  totalVolume: number;
  uniqueTippers: number;
  uniqueCreators: number;
  avgTipSize: number;
  medianTipSize: number;
  peakHour: number;
  peakDay: number;
  chainDistribution: { chainId: string; volume: number; count: number; percentage: number }[];
  tokenDistribution: { token: string; volume: number; count: number; percentage: number }[];
  growthRate: number;
}

interface CreatorIncome {
  creatorAddress: string;
  totalReceived: number;
  tipCount: number;
  uniqueSupporters: number;
  avgTipAmount: number;
  largestTip: number;
  weeklyTrend: number;
  monthlyTrend: number;
  topSupporters: { address: string; totalSent: number; tipCount: number }[];
  incomeByChain: { chainId: string; amount: number; count: number }[];
  incomeByToken: { token: string; amount: number; count: number }[];
  dailyIncome: { date: string; amount: number; count: number }[];
}

export function CreatorAnalyticsPanel() {
  const [platform, setPlatform] = useState<PlatformAnalytics | null>(null);
  const [creator, setCreator] = useState<CreatorIncome | null>(null);
  const [creatorAddress, setCreatorAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.platformAnalytics()
      .then((d) => setPlatform(d as unknown as PlatformAnalytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const searchCreator = async () => {
    if (!creatorAddress.trim()) return;
    setSearching(true);
    try {
      const d = await api.creatorIncome(creatorAddress.trim());
      setCreator(d as unknown as CreatorIncome);
    } catch { setCreator(null); }
    setSearching(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton variant="text-line" width="140px" height="16px" />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <Skeleton key={i} variant="card" height="56px" />)}
      </div>
      <Skeleton variant="card" height="60px" />
      <Skeleton variant="card" height="40px" />
    </div>
  );

  const chainColors: Record<string, string> = {
    'ethereum-sepolia': 'bg-blue-500',
    'ton-testnet': 'bg-cyan-500',
    'tron-nile': 'bg-red-500',
  };

  const chainLabels: Record<string, string> = {
    'ethereum-sepolia': 'Ethereum',
    'ton-testnet': 'TON',
    'tron-nile': 'TRON',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        Creator Analytics
      </h3>

      {/* Platform overview */}
      {platform && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Platform Overview</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Tips', value: platform.totalTipsProcessed, icon: Layers },
              { label: 'Volume', value: `$${platform.totalVolume.toFixed(2)}`, icon: DollarSign },
              { label: 'Tippers', value: platform.uniqueTippers, icon: Users },
              { label: 'Growth', value: `${platform.growthRate > 0 ? '+' : ''}${platform.growthRate.toFixed(0)}%`, icon: platform.growthRate >= 0 ? TrendingUp : TrendingDown },
            ].map((s, i) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-surface-2 animate-list-item-in" style={{ animationDelay: `${i * 50}ms` }}>
                <s.icon className="w-3 h-3 mx-auto mb-1 text-emerald-400" />
                <div className="text-xs font-bold text-text-primary">{s.value}</div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chain distribution */}
          {platform.chainDistribution.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-text-muted">Chain Distribution</p>
              {platform.chainDistribution.map((c) => (
                <div key={c.chainId} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-text-secondary truncate">{chainLabels[c.chainId] ?? c.chainId}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full ${chainColors[c.chainId] ?? 'bg-gray-500'} transition-all`} style={{ width: `${c.percentage}%` }} />
                  </div>
                  <span className="w-10 text-right text-text-muted">{c.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Token distribution */}
          {platform.tokenDistribution.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-text-muted">Token Distribution</p>
              {platform.tokenDistribution.map((t) => (
                <div key={t.token} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-text-secondary uppercase">{t.token}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${t.percentage}%` }} />
                  </div>
                  <span className="w-10 text-right text-text-muted">{t.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 text-xs text-text-muted">
            <span>Avg tip: ${platform.avgTipSize.toFixed(4)}</span>
            <span>Median: ${platform.medianTipSize.toFixed(4)}</span>
            <span>Peak hour: {platform.peakHour}:00</span>
          </div>
        </div>
      )}

      {/* Creator Lookup */}
      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Creator Lookup</p>
        <div className="flex gap-2">
          <input
            value={creatorAddress}
            onChange={(e) => setCreatorAddress(e.target.value)}
            placeholder="Enter creator address..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-primary text-xs focus:border-emerald-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && searchCreator()}
          />
          <button onClick={searchCreator} disabled={searching || !creatorAddress.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50 transition-colors btn-press" aria-label="Search creator">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {creator && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-text-secondary">{creator.creatorAddress.slice(0, 10)}...{creator.creatorAddress.slice(-6)}</span>
              <div className="flex gap-2 text-xs">
                <span className={`flex items-center gap-0.5 ${creator.weeklyTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {creator.weeklyTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {creator.weeklyTrend > 0 ? '+' : ''}{creator.weeklyTrend.toFixed(0)}% wk
                </span>
                <span className={`flex items-center gap-0.5 ${creator.monthlyTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {creator.monthlyTrend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {creator.monthlyTrend > 0 ? '+' : ''}{creator.monthlyTrend.toFixed(0)}% mo
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: `$${creator.totalReceived.toFixed(4)}` },
                { label: 'Tips', value: creator.tipCount },
                { label: 'Supporters', value: creator.uniqueSupporters },
              ].map((s) => (
                <div key={s.label} className="text-center p-1.5 rounded bg-surface-2">
                  <div className="text-xs font-bold text-text-primary">{s.value}</div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top supporters */}
            {creator.topSupporters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-text-muted">Top Supporters</p>
                {creator.topSupporters.slice(0, 3).map((s, i) => (
                  <div key={s.address} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-text-muted">{['🥇','🥈','🥉'][i]}</span>
                    <span className="font-mono text-text-secondary truncate flex-1">{s.address.slice(0, 8)}...{s.address.slice(-4)}</span>
                    <span className="text-text-primary font-medium">${s.totalSent.toFixed(4)}</span>
                    <span className="text-text-muted">({s.tipCount})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Daily income sparkline */}
            {creator.dailyIncome.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-text-muted">Daily Income (last {creator.dailyIncome.length} days)</p>
                <div className="flex items-end gap-px h-8">
                  {(() => {
                    const max = Math.max(...creator.dailyIncome.map((d) => d.amount), 0.001);
                    return creator.dailyIncome.map((d, i) => (
                      <div key={i} className="flex-1 bg-emerald-500/60 rounded-t-sm hover:bg-emerald-400 transition-colors" style={{ height: `${(d.amount / max) * 100}%`, minHeight: '2px' }} title={`${d.date}: $${d.amount.toFixed(4)}`} />
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
