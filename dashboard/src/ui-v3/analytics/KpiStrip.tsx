import { TrendingUp, DollarSign, CheckCircle2, Coins } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedNumber';
import { formatNumber } from '../../lib/utils';
import type { AgentStats } from '../../types';

interface KpiStripProps {
  stats: AgentStats | null;
}

export function KpiStrip({ stats }: KpiStripProps) {
  const totalTips = useAnimatedValue(stats?.totalTips ?? 0, 1000);
  const totalAmount = useAnimatedValue(parseFloat(stats?.totalAmount ?? '0') || 0, 1000);
  const successRate = useAnimatedValue(stats?.successRate ?? 0, 1000);

  const kpis = [
    { label: 'Total Tips', value: String(Math.round(totalTips)), icon: TrendingUp, color: 'text-emerald-400', hint: 'All time' },
    { label: 'Volume', value: `$${formatNumber(totalAmount, 2)}`, icon: DollarSign, color: 'text-blue-400', hint: 'USDT equivalent' },
    { label: 'Success Rate', value: `${Math.round(successRate)}%`, icon: CheckCircle2, color: successRate >= 90 ? 'text-emerald-400' : 'text-amber-400', hint: successRate >= 90 ? 'Healthy' : 'Needs attention' },
    { label: 'Chains', value: '9', icon: Coins, color: 'text-purple-400', hint: 'Multi-chain support' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map(({ label, value, icon: Icon, color, hint }) => (
        <div key={label} className="relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {value}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>
        </div>
      ))}
    </div>
  );
}
