import { KpiStrip } from './KpiStrip';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { ChainComparison } from '../../components/ChainComparison';
import { EconomicsDashboard } from '../../components/EconomicsDashboard';
import { ActivityHeatmap } from '../../components/ActivityHeatmap';
import { TipReport } from '../../components/TipReport';
import { Leaderboard } from '../../components/Leaderboard';
import { Achievements } from '../../components/Achievements';
import { Challenges } from '../../components/Challenges';
import { TechStack } from '../../components/TechStack';
import type { AgentStats, TipHistoryEntry, LeaderboardEntry, Achievement } from '../../types';

interface AnalyticsPageProps {
  stats: AgentStats | null;
  history: TipHistoryEntry[];
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  achievements: Achievement[];
  achievementsLoading: boolean;
}

export function AnalyticsPage({ stats, history, leaderboard, leaderboardLoading, achievements, achievementsLoading }: AnalyticsPageProps) {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Analytics
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Tipping performance, chain economics, and engagement insights</p>
      </div>

      {/* KPI Strip — hero numbers, no card wrapper */}
      <KpiStrip stats={stats} />

      {/* VISUAL ANCHOR — AnalyticsDashboard (richest component, full width) */}
      <div className="mb-8">
        <AnalyticsDashboard />
      </div>

      {/* SUPPORTING: Chain + Economics side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ChainComparison />
        <EconomicsDashboard />
      </div>

      {/* INSIGHTS: Heatmap + Report side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <ActivityHeatmap history={history} />
        <TipReport history={history} />
      </div>

      {/* COMMUNITY: Leaderboard full-width */}
      <div className="mb-6">
        <Leaderboard entries={leaderboard} loading={leaderboardLoading} />
      </div>

      {/* COLLAPSED: Gamification + Tech */}
      <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors select-none">
          <span>Gamification & Tech Stack</span>
          <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="px-5 pb-5 space-y-5 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Achievements achievements={achievements} loading={achievementsLoading} />
            <Challenges />
          </div>
          <TechStack />
        </div>
      </details>
    </div>
  );
}
