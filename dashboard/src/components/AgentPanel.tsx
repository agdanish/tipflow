import { Brain, Cpu, Search, Rocket, CheckCircle2, Clock } from 'lucide-react';
import type { AgentState } from '../types';

interface AgentPanelProps {
  state: AgentState;
}

const STATUS_CONFIG = {
  idle: { icon: Clock, label: 'Idle', color: 'text-text-muted', bg: 'bg-surface-3' },
  analyzing: { icon: Search, label: 'Analyzing Chains', color: 'text-info', bg: 'bg-info/10' },
  reasoning: { icon: Brain, label: 'AI Reasoning', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  executing: { icon: Rocket, label: 'Executing Transaction', color: 'text-warning', bg: 'bg-warning/10' },
  confirming: { icon: CheckCircle2, label: 'Confirming', color: 'text-accent', bg: 'bg-accent-dim' },
} as const;

export function AgentPanel({ state }: AgentPanelProps) {
  const config = STATUS_CONFIG[state.status];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent" />
        Agent Status
      </h2>

      <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg} mb-4`}>
        <Icon className={`w-5 h-5 ${config.color} ${state.status !== 'idle' ? 'animate-pulse' : ''}`} />
        <div>
          <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
          {state.currentTip && (
            <p className="text-xs text-text-muted mt-0.5">
              Tipping {state.currentTip.amount} to {state.currentTip.recipient.slice(0, 10)}...
            </p>
          )}
        </div>
      </div>

      {/* Decision reasoning display */}
      {state.currentDecision && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted mb-1">AI Reasoning</p>
            <p className="text-sm text-text-primary leading-relaxed">
              {state.currentDecision.reasoning}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted mb-2">Chain Scores</p>
            {state.currentDecision.analyses.map((analysis) => (
              <div key={analysis.chainId} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-text-secondary">{analysis.chainName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${analysis.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right">{analysis.score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline steps */}
          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted mb-2">Pipeline Steps</p>
            <div className="space-y-1.5">
              {state.currentDecision.steps.map((step) => (
                <div key={step.step} className="flex items-start gap-2">
                  <span className="text-[10px] text-text-muted font-mono w-4 shrink-0 mt-0.5">
                    {step.step}.
                  </span>
                  <div>
                    <span className="text-xs font-medium text-accent">{step.action}</span>
                    <span className="text-xs text-text-secondary ml-1.5">{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {state.lastError && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 mt-3">
          <p className="text-xs text-error">{state.lastError}</p>
        </div>
      )}

      {state.status === 'idle' && !state.currentDecision && !state.lastError && (
        <p className="text-xs text-text-muted text-center py-4">
          Agent is ready. Send a tip to see the decision pipeline in action.
        </p>
      )}
    </div>
  );
}
