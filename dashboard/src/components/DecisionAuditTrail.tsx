// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Shield, Brain, Coins, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface AuditDecision {
  id: string;
  type: string;
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  recipient: string;
  amount: string;
  confidence: number;
  trigger: string;
  recipientRationale: string;
  amountRationale: string;
  timingRationale: string;
  policyCompliance: string[];
  createdAt: string;
  executedAt?: string;
  txHash?: string;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  proposed: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Proposed' },
  approved: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Rejected' },
  executed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Executed' },
};

export function DecisionAuditTrail() {
  const [decisions, setDecisions] = useState<AuditDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getAutonomyDecisions();
      setDecisions((data.decisions ?? []) as unknown as AuditDecision[]);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <div className="skeleton h-32 rounded-lg" />
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-accent" />
          Decision Audit Trail
        </h2>
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No autonomous decisions yet</p>
          <p className="text-xs text-text-muted/60 mt-1">Decisions appear when the agent acts autonomously</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          Decision Audit Trail
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{decisions.length} decisions</span>
          <button onClick={load} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Decision timeline */}
      <div className="space-y-2">
        {decisions.slice(0, 10).map((decision, i) => {
          const config = statusConfig[decision.status] ?? statusConfig.proposed;
          const StatusIcon = config.icon;
          const isExpanded = expandedId === decision.id;

          return (
            <div
              key={decision.id}
              className={`rounded-lg border overflow-hidden animate-list-item-in ${config.bg}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <StatusIcon className={`w-4 h-4 ${config.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-secondary tabular-nums">{decision.amount} USDT</span>
                    <span className="text-xs text-text-muted">&rarr;</span>
                    <span className="text-xs text-text-secondary font-mono truncate">{decision.recipient.slice(0, 8)}...</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{decision.trigger}</p>
                </div>
                <span className={`text-xs font-mono tabular-nums ${
                  decision.confidence >= 70 ? 'text-green-400' : decision.confidence >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>{decision.confidence}%</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              </button>

              {/* Expanded reasoning */}
              {isExpanded && (
                <div className="border-t border-border/50 p-3 space-y-3 animate-slide-down bg-surface-2/30">
                  {/* 4-part reasoning chain */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Decision Reasoning Chain</p>

                    <div className="flex items-start gap-2 p-2 rounded bg-surface-2/50">
                      <Brain className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-400">Trigger</p>
                        <p className="text-xs text-text-secondary">{decision.trigger}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded bg-surface-2/50">
                      <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-purple-400">Recipient Selection</p>
                        <p className="text-xs text-text-secondary">{decision.recipientRationale || 'Based on historical tipping pattern'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded bg-surface-2/50">
                      <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-400">Amount Calculation</p>
                        <p className="text-xs text-text-secondary">{decision.amountRationale || `Historical average: ${decision.amount}`}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded bg-surface-2/50">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-cyan-400">Timing Rationale</p>
                        <p className="text-xs text-text-secondary">{decision.timingRationale || 'Optimal time based on fee analysis'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Policy compliance */}
                  {decision.policyCompliance && decision.policyCompliance.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Policy Compliance</p>
                      <div className="flex flex-wrap gap-1">
                        {decision.policyCompliance.map((policy, pi) => (
                          <span key={pi} className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                            ✓ {policy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-surface-2/50 border border-border">
                      <p className="text-text-muted">Created</p>
                      <p className="text-text-primary font-mono">{new Date(decision.createdAt).toLocaleString()}</p>
                    </div>
                    {decision.executedAt && (
                      <div className="p-2 rounded bg-surface-2/50 border border-border">
                        <p className="text-text-muted">Executed</p>
                        <p className="text-text-primary font-mono">{new Date(decision.executedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {decision.txHash && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span>TX:</span>
                      <span className="font-mono text-text-secondary truncate">{decision.txHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
