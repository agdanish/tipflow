import { BarChart3, TrendingUp, Coins, Gauge, Activity } from 'lucide-react';
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
      label: 'Avg Tip',
      value: formatNumber(stats.avgTipAmount),
      icon: Gauge,
      color: 'text-info',
      bgClass: 'stat-card-blue',
    },
    {
      label: 'Fees Saved',
      value: formatNumber(stats.totalFeesSaved),
      icon: BarChart3,
      color: 'text-purple-400',
      bgClass: 'stat-card-purple',
    },
  ];

  const chainEntries = Object.entries(stats.chainDistribution);
  const totalChainTips = chainEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        Analytics
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-3.5 rounded-lg border border-border ${card.bgClass}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-surface-3/50`}>
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

      {chainEntries.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-3 font-medium">Chain Distribution</p>
          <div className="space-y-2.5">
            {chainEntries.map(([chain, count]) => {
              const pct = totalChainTips > 0 ? (count / totalChainTips) * 100 : 0;
              const color = chainColor(chain as Parameters<typeof chainColor>[0]);
              return (
                <div key={chain} className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-text-secondary flex-1 font-medium">
                    {chainName(chain as Parameters<typeof chainName>[0])}
                  </span>
                  <div className="w-24 h-2 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
