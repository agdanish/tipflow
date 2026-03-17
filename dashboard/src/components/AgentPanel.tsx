import { Brain, Cpu, Search, Rocket, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import type { AgentState } from '../types';

interface AgentPanelProps {
  state: AgentState;
}

const PIPELINE_STEPS = [
  { key: 'analyzing', label: 'Analyze Chains', icon: Search },
  { key: 'reasoning', label: 'AI Reasoning', icon: Brain },
  { key: 'executing', label: 'Execute Tx', icon: Rocket },
  { key: 'confirming', label: 'Confirm', icon: CheckCircle2 },
] as const;

const STATUS_ORDER = ['analyzing', 'reasoning', 'executing', 'confirming'] as const;

function getStepState(
  currentStatus: AgentState['status'],
  stepKey: string
): 'done' | 'active' | 'pending' {
  if (currentStatus === 'idle') return 'pending';
  const currentIdx = STATUS_ORDER.indexOf(currentStatus as (typeof STATUS_ORDER)[number]);
  const stepIdx = STATUS_ORDER.indexOf(stepKey as (typeof STATUS_ORDER)[number]);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export function AgentPanel({ state }: AgentPanelProps) {
  const isActive = state.status !== 'idle';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent" />
        Agent Pipeline
      </h2>

      {/* Idle state with breathing animation */}
      {!isActive && !state.currentDecision && !state.lastError && (
        <div className="flex flex-col items-center py-6 animate-fade-in">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center animate-idle-breathe">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
          </div>
          <p className="text-sm font-medium text-text-secondary">Agent Ready</p>
          <p className="text-xs text-text-muted mt-1">
            Waiting for a tip request...
          </p>
        </div>
      )}

      {/* Pipeline progress steps */}
      {isActive && (
        <div className="mb-4 animate-fade-in">
          {state.currentTip && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-surface-2 border border-border">
              <p className="text-xs text-text-muted">Processing tip</p>
              <p className="text-sm text-text-primary font-medium mt-0.5">
                {state.currentTip.amount} to {state.currentTip.recipient.slice(0, 12)}...
              </p>
            </div>
          )}

          <div className="flex items-center gap-1">
            {PIPELINE_STEPS.map((step, i) => {
              const stepState = getStepState(state.status, step.key);
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  {/* Step dot + connector */}
                  <div className="flex items-center w-full mb-2">
                    {i > 0 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                          stepState === 'done' || stepState === 'active'
                            ? 'bg-accent'
                            : 'bg-surface-3'
                        }`}
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        stepState === 'done'
                          ? 'bg-accent/20 text-accent'
                          : stepState === 'active'
                          ? 'bg-accent/20 text-accent animate-step-pulse'
                          : 'bg-surface-3 text-text-muted'
                      }`}
                    >
                      {stepState === 'done' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                          stepState === 'done' ? 'bg-accent' : 'bg-surface-3'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center transition-colors ${
                      stepState === 'active'
                        ? 'text-accent'
                        : stepState === 'done'
                        ? 'text-text-secondary'
                        : 'text-text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decision reasoning display */}
      {state.currentDecision && (
        <div className="space-y-3 animate-fade-in">
          {/* AI Reasoning - prominent card */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 via-surface-2 to-surface-2 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                AI Reasoning
              </span>
              <span className="ml-auto text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-surface-3">
                {Math.round(state.currentDecision.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {state.currentDecision.reasoning}
            </p>
          </div>

          {/* Chain Scores */}
          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted mb-3 font-medium">Chain Scores</p>
            {state.currentDecision.analyses.map((analysis) => {
              const isSelected = analysis.chainId === state.currentDecision?.selectedChain;
              return (
                <div
                  key={analysis.chainId}
                  className={`flex items-center justify-between py-2 px-2 rounded-md mb-1 last:mb-0 transition-colors ${
                    isSelected ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-accent" />
                    )}
                    <span className={`text-xs ${isSelected ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                      {analysis.chainName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 animate-progress-fill"
                        style={{
                          width: `${analysis.score}%`,
                          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        }}
                      />
                    </div>
                    <span className={`text-xs w-8 text-right font-mono ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
                      {analysis.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pipeline steps */}
          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted mb-2 font-medium">Pipeline Log</p>
            <div className="space-y-1.5">
              {state.currentDecision.steps.map((step) => (
                <div key={step.step} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] text-accent font-bold">{step.step}</span>
                  </div>
                  <div className="min-w-0">
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
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 mt-3 animate-fade-in">
          <p className="text-xs text-error font-medium">{state.lastError}</p>
        </div>
      )}
    </div>
  );
}
