import { BarChart3, TrendingUp, Coins, Shield, Zap, Activity, Clock, CircleDollarSign } from 'lucide-react';
import type { AgentStats } from '../types';
import { formatNumber, chainColor, chainName } from '../lib/utils';

interface StatsPanelProps {
  stats: AgentStats | null;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Analytics
        </h2>
        <div className="text-center py-10">
          <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">Send some tips to see analytics</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tips',
      value: stats.totalTips.toString(),
      icon: TrendingUp,
      color: 'text-accent',
      bgClass: 'stat-card-green',
    },
    {
      label: 'Total Sent',
      value: formatNumber(stats.totalAmount),
      icon: Coins,
      color: 'text-warning',
      bgClass: 'stat-card-amber',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: Shield,
      color: 'text-info',
      bgClass: 'stat-card-blue',
    },
    {
      label: 'Fees Saved',
      value: formatNumber(stats.totalFeeSaved),
      icon: Zap,
      color: 'text-purple-400',
      bgClass: 'stat-card-purple',
    },
  ];

  // Bar chart: find max count for scaling
  const maxDayCount = Math.max(...stats.tipsByDay.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5 space-y-5">
      {/* Header */}
      <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        Advanced Analytics
      </h2>

      {/* Top row: 4 stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-3.5 rounded-lg border border-border ${card.bgClass}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-3/50">
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                  {card.label}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Middle: Tips by Day bar chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Tips — Last 7 Days
          </p>
          <p className="text-[10px] text-text-muted">
            {stats.tipsByDay.reduce((s, d) => s + d.count, 0)} total
          </p>
        </div>
        <div className="flex items-end gap-1.5 h-28 px-1">
          {stats.tipsByDay.map((day) => {
            const heightPct = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
            const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
            });
            const hasActivity = day.count > 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Count label */}
                <span className={`text-[10px] font-mono transition-colors ${
                  hasActivity ? 'text-text-secondary' : 'text-text-muted/40'
                }`}>
                  {day.count}
                </span>
                {/* Bar */}
                <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-700 ${
                      hasActivity
                        ? 'bg-gradient-to-t from-accent/80 to-accent group-hover:from-accent group-hover:to-emerald-400'
                        : 'bg-surface-3/60'
                    }`}
                    style={{
                      height: hasActivity ? `${Math.max(heightPct, 8)}%` : '4px',
                      animationDelay: `${stats.tipsByDay.indexOf(day) * 80}ms`,
                    }}
                    title={`${day.date}: ${day.count} tips, ${formatNumber(day.volume)} volume`}
                  />
                </div>
                {/* Day label */}
                <span className="text-[9px] text-text-muted font-medium">{dateLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Chain Distribution + Token Breakdown side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chain Distribution */}
        <div className="rounded-lg border border-border bg-surface-2/50 p-3.5">
          <p className="text-xs text-text-muted mb-3 font-medium flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Chain Distribution
          </p>
          {stats.tipsByChain.length > 0 ? (
            <div className="space-y-3">
              {/* Visual ring-like display */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return stats.tipsByChain.map((chain) => {
                        const pct = chain.percentage;
                        const dashArray = `${pct} ${100 - pct}`;
                        const el = (
                          <circle
                            key={chain.chainId}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="none"
                            stroke={chainColor(chain.chainId)}
                            strokeWidth="3"
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                    {/* Background track */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-text-primary">
                      {stats.tipsByChain.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.tipsByChain.map((chain) => (
                    <div key={chain.chainId} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: chainColor(chain.chainId) }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-text-secondary font-medium leading-none">
                          {chainName(chain.chainId)}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {chain.count} tips ({chain.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-3">No chain data yet</p>
          )}
        </div>

        {/* Token Breakdown */}
        <div className="rounded-lg border border-border bg-surface-2/50 p-3.5">
          <p className="text-xs text-text-muted mb-3 font-medium flex items-center gap-1.5">
            <CircleDollarSign className="w-3 h-3" />
            Token Breakdown
          </p>
          {stats.tipsByToken.length > 0 ? (
            <div className="space-y-3">
              {stats.tipsByToken.map((tokenData) => {
                const isUsdt = tokenData.token === 'usdt';
                const barColor = isUsdt ? '#26a17b' : '#627eea';
                const label = isUsdt ? 'USDT' : 'Native';
                return (
                  <div key={tokenData.token} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: barColor }}
                        >
                          {isUsdt ? '$' : 'N'}
                        </div>
                        <span className="text-xs text-text-secondary font-medium">{label}</span>
                      </div>
                      <span className="text-xs text-text-muted font-mono">
                        {tokenData.count} ({tokenData.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 animate-progress-fill"
                        style={{
                          width: `${tokenData.percentage}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted font-mono">
                      Vol: {formatNumber(tokenData.volume)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-3">No token data yet</p>
          )}
        </div>
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Avg Tip</p>
          <p className="text-sm font-bold text-text-primary font-mono">{formatNumber(stats.avgTipAmount)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Fees Paid</p>
          <p className="text-sm font-bold text-text-primary font-mono">{formatNumber(stats.totalFeePaid)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Avg Confirm</p>
          <p className="text-sm font-bold text-text-primary font-mono">
            {stats.averageConfirmationTime > 0 ? `${stats.averageConfirmationTime}s` : '--'}
          </p>
        </div>
      </div>
    </div>
  );
}
