import type { AgentState, TipResult, ScheduledTip } from '../../types';
import { AgentPanel } from '../../components/AgentPanel';
import { ActivityFeed } from '../../components/ActivityFeed';
import { TipGoals } from '../../components/TipGoals';
import { TipCalendar } from '../../components/TipCalendar';
import { TransactionTracker } from '../../components/TransactionTracker';
import { Clock, CheckCircle2, XCircle, X, Repeat } from 'lucide-react';

interface ContextFeedProps {
  agentState: AgentState;
  trackedTx: TipResult | null;
  onDismissTracked: () => void;
  scheduledTips: ScheduledTip[];
  onCancelScheduled: (id: string) => Promise<void>;
}

export function ContextFeed({ agentState, trackedTx, onDismissTracked, scheduledTips, onCancelScheduled }: ContextFeedProps) {
  return (
    <div className="space-y-4">
      {/* Transaction tracker — conditional */}
      {trackedTx && (
        <TransactionTracker result={trackedTx} onDismiss={onDismissTracked} />
      )}

      {/* Agent mini-status */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <AgentPanel state={agentState} />
      </div>

      {/* Activity feed — compact */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <ActivityFeed />
      </div>

      {/* Scheduled tips — conditional */}
      {scheduledTips.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Scheduled
            <span className="ml-auto text-xs text-zinc-500">{scheduledTips.filter(t => t.status === 'scheduled').length} pending</span>
          </h3>
          <div className="space-y-1.5">
            {scheduledTips.slice(0, 5).map((tip) => (
              <div key={tip.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                tip.status === 'scheduled' ? 'bg-amber-500/5' : tip.status === 'executed' ? 'bg-emerald-500/5' : 'bg-red-500/5'
              }`}>
                {tip.status === 'scheduled' && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {tip.status === 'executed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {tip.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                <span className="text-zinc-200 font-medium">{tip.amount} {tip.token === 'usdt' ? 'USDT' : 'Native'}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-zinc-400 font-mono text-xs truncate">{tip.recipient.slice(0, 6)}...</span>
                {tip.recurring && <Repeat className="w-3 h-3 text-purple-400 shrink-0" />}
                {tip.status === 'scheduled' && (
                  <button onClick={() => onCancelScheduled(tip.id)} className="ml-auto text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals — compact */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <TipGoals />
      </div>

      {/* Calendar — compact */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <TipCalendar onCancelTip={onCancelScheduled} />
      </div>
    </div>
  );
}
