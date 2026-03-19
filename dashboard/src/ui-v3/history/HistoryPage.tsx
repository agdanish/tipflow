import type { TipHistoryEntry } from '../../types';
import { TransactionTimeline } from '../../components/TransactionTimeline';
import { HistoryList } from './HistoryList';

interface HistoryPageProps {
  history: TipHistoryEntry[];
  loading: boolean;
}

export function HistoryPage({ history, loading }: HistoryPageProps) {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Main transaction list — new presentation */}
      <HistoryList history={history} loading={loading} />

      {/* Timeline — collapsible below */}
      <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors select-none">
          <span>Transaction Timeline</span>
          <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="px-5 pb-5 animate-slide-down">
          <TransactionTimeline history={history} loading={loading} />
        </div>
      </details>
    </div>
  );
}
