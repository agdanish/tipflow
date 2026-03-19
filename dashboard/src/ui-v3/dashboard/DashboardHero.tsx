import { Zap, ArrowUpRight, Wifi, WifiOff } from 'lucide-react';
import type { WalletBalance, HealthResponse } from '../../types';
import { formatNumber } from '../../lib/utils';

interface DashboardHeroProps {
  balances: WalletBalance[];
  health: HealthResponse | null;
  agentStatus: string;
  onSendTip: () => void;
}

export function DashboardHero({ balances, health, agentStatus, onSendTip }: DashboardHeroProps) {
  const totalNativeUsd = balances.reduce((sum, b) => {
    const val = parseFloat(b.nativeBalance) || 0;
    return sum + val;
  }, 0);
  const totalUsdt = balances.reduce((sum, b) => {
    const val = parseFloat(b.usdtBalance) || 0;
    return sum + val;
  }, 0);
  const chainCount = balances.length;
  const isOnline = health?.status === 'ok';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800/50 mb-6">
      {/* Subtle gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.05),transparent_60%)]" />

      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Balances */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {isOnline ? 'Live' : 'Offline'} · {chainCount} chains · Agent {agentStatus}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ${formatNumber(totalUsdt, 2)}
              </span>
              <span className="text-sm text-zinc-400">USDT</span>
              {totalNativeUsd > 0 && (
                <span className="text-sm text-zinc-500">
                  + {formatNumber(totalNativeUsd, 4)} native
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              {balances.slice(0, 4).map((b) => (
                <div key={b.chainId} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.chainId.includes('ethereum') ? '#627eea' : b.chainId.includes('ton') ? '#0098ea' : b.chainId.includes('tron') ? '#eb0029' : '#f7931a' }} />
                  <span>{formatNumber(parseFloat(b.nativeBalance) || 0, 3)} {b.nativeCurrency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              <span className="text-xs text-zinc-400">{health ? 'Healthy' : 'Checking'}</span>
            </div>
            <button
              onClick={onSendTip}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              Send Tip
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
