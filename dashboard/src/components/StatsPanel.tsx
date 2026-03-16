import { BarChart3, TrendingUp, Coins, Gauge } from 'lucide-react';
import type { AgentStats } from '../types';
import { formatNumber, chainColor, chainName } from '../lib/utils';

interface StatsPanelProps {
  stats: AgentStats | null;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Analytics
        </h2>
        <p className="text-sm text-text-muted text-center py-8">Send some tips to see analytics</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tips', value: stats.totalTips.toString(), icon: TrendingUp, color: 'text-accent' },
    { label: 'Total Sent', value: formatNumber(stats.totalAmount), icon: Coins, color: 'text-warning' },
    { label: 'Avg Tip', value: formatNumber(stats.avgTipAmount), icon: Gauge, color: 'text-info' },
    { label: 'Fees Saved', value: formatNumber(stats.totalFeesSaved), icon: BarChart3, color: 'text-purple-400' },
  ];

  const chainEntries = Object.entries(stats.chainDistribution);
  const totalChainTips = chainEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        Analytics
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">{card.label}</span>
              </div>
              <p className="text-lg font-semibold text-text-primary">{card.value}</p>
            </div>
          );
        })}
      </div>

      {chainEntries.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">Chain Distribution</p>
          <div className="space-y-2">
            {chainEntries.map(([chain, count]) => {
              const pct = totalChainTips > 0 ? (count / totalChainTips) * 100 : 0;
              return (
                <div key={chain} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: chainColor(chain as Parameters<typeof chainColor>[0]) }}
                  />
                  <span className="text-xs text-text-secondary flex-1">
                    {chainName(chain as Parameters<typeof chainName>[0])}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: chainColor(chain as Parameters<typeof chainColor>[0]),
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
