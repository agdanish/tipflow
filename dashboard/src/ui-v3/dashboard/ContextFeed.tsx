import type { AgentState, TipResult, ScheduledTip } from '../../types';
import { AgentPanel } from '../../components/AgentPanel';
import { ActivityFeed } from '../../components/ActivityFeed';
import { TransactionTracker } from '../../components/TransactionTracker';
import { Clock, CheckCircle2, XCircle, X, Repeat, Radio } from 'lucide-react';

interface ContextFeedProps {
  agentState: AgentState;
  trackedTx: TipResult | null;
  onDismissTracked: () => void;
  scheduledTips: ScheduledTip[];
  onCancelScheduled: (id: string) => Promise<void>;
}

export function ContextFeed({ agentState, trackedTx, onDismissTracked, scheduledTips, onCancelScheduled }: ContextFeedProps) {
  return (
    <div className="space-y-5">
      {/* Live transaction tracker */}
      {trackedTx && (
        <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 overflow-hidden">
          <TransactionTracker result={trackedTx} onDismiss={onDismissTracked} />
        </div>
      )}

      {/* Agent status — compact */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-zinc-200">Agent Pipeline</h3>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
          <AgentPanel state={agentState} />
        </div>
      </div>

      {/* Activity — compact */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Recent Activity</h3>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden max-h-64 overflow-y-auto">
          <ActivityFeed />
        </div>
      </div>

      {/* Scheduled — only if exists */}
      {scheduledTips.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center justify-between">
            Scheduled
            <span className="text-xs text-zinc-500 font-normal">{scheduledTips.filter(t => t.status === 'scheduled').length} pending</span>
          </h3>
          <div className="space-y-1.5">
            {scheduledTips.slice(0, 4).map((tip) => (
              <div key={tip.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                tip.status === 'scheduled' ? 'bg-amber-500/5 hover:bg-amber-500/10' : tip.status === 'executed' ? 'bg-emerald-500/5' : 'bg-red-500/5'
              }`}>
                {tip.status === 'scheduled' && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                {tip.status === 'executed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                {tip.status === 'failed' && <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                <span className="text-zinc-200 font-medium text-sm">{tip.amount}</span>
                <span className="text-zinc-600">→</span>
                <span className="text-zinc-400 font-mono text-xs truncate flex-1">{tip.recipient.slice(0, 8)}...</span>
                {tip.recurring && <Repeat className="w-3 h-3 text-purple-400 shrink-0" />}
                {tip.status === 'scheduled' && (
                  <button onClick={() => onCancelScheduled(tip.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
