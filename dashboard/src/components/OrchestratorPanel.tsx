// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Shield, Brain, Coins, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface AgentVote {
  agent: string;
  decision: 'approve' | 'reject' | 'abstain';
  confidence: number;
  reasoning: string;
}

interface OrchestratedAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
  votes: AgentVote[];
  consensus: string;
  overallConfidence: number;
  reasoningChain: string[];
  proposedAt: string;
}

interface OrchestratorStats {
  total: number;
  approved: number;
  rejected: number;
  splitDecisions: number;
  approvalRate: number;
  avgConfidence: number;
  dailySpent: number;
  dailyLimit: number;
  dailyRemaining: number;
  agentPerformance: {
    agent: string;
    role: string;
    weight: number;
    totalVotes: number;
    approvals: number;
    rejections: number;
    avgConfidence: number;
  }[];
}

const agentIcons: Record<string, typeof Shield> = {
  tip_executor: Brain,
  guardian: Shield,
  treasury_optimizer: Coins,
};

const agentColors: Record<string, string> = {
  tip_executor: 'text-blue-400',
  guardian: 'text-red-400',
  treasury_optimizer: 'text-green-400',
};

const agentBgColors: Record<string, string> = {
  tip_executor: 'bg-blue-500/10 border-blue-500/20',
  guardian: 'bg-red-500/10 border-red-500/20',
  treasury_optimizer: 'bg-green-500/10 border-green-500/20',
};

const agentNames: Record<string, string> = {
  tip_executor: 'TipExecutor',
  guardian: 'Guardian',
  treasury_optimizer: 'TreasuryOptimizer',
};

const agentRoles: Record<string, string> = {
  tip_executor: 'Validates technical feasibility',
  guardian: 'Enforces safety rules (has veto)',
  treasury_optimizer: 'Optimizes economics & fees',
};

/** Animated confidence bar */
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Live vote card with staggered reveal */
function VoteCard({ vote, index, isLive }: { vote: AgentVote; index: number; isLive: boolean }) {
  const Icon = agentIcons[vote.agent] ?? Shield;
  const color = agentColors[vote.agent] ?? 'text-accent';
  const bgColor = agentBgColors[vote.agent] ?? 'bg-surface-2 border-border';
  const barColor = vote.decision === 'approve' ? '#22c55e' : vote.decision === 'reject' ? '#ef4444' : '#f59e0b';
  const reasonParts = vote.reasoning.split(/[;.]\s*/).filter(Boolean);

  return (
    <div
      className={`p-3 rounded-lg border ${bgColor} ${isLive ? 'animate-list-item-in' : ''}`}
      style={isLive ? { animationDelay: `${index * 300}ms` } : undefined}
    >
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-surface-3/50 ${isLive ? 'animate-step-pulse' : ''}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-text-primary">{agentNames[vote.agent] ?? vote.agent}</span>
          <p className="text-xs text-text-muted">{agentRoles[vote.agent] ?? ''}</p>
        </div>
      </div>

      {/* Decision badge */}
      <div className="flex items-center gap-2 mb-2">
        {vote.decision === 'approve' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-xs font-bold text-green-400">
            <CheckCircle2 className="w-3 h-3" /> APPROVE
          </span>
        ) : vote.decision === 'reject' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-xs font-bold text-red-400">
            <XCircle className="w-3 h-3" /> REJECT
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-3 h-3" /> ABSTAIN
          </span>
        )}
        <span className="text-xs text-text-muted ml-auto tabular-nums">{vote.confidence}%</span>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={vote.confidence} color={barColor} />

      {/* Reasoning bullets */}
      <ul className="mt-2 space-y-0.5">
        {reasonParts.slice(0, 4).map((part, i) => (
          <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
            <span className="text-text-muted mt-0.5 shrink-0">•</span>
            <span>{part.trim()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrchestratorPanel() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [history, setHistory] = useState<OrchestratedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [liveResult, setLiveResult] = useState<OrchestratedAction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [s, h] = await Promise.all([api.orchestratorStats(), api.orchestratorHistory()]);
      setStats(s as unknown as OrchestratorStats);
      setHistory((h as unknown as OrchestratedAction[]).slice(0, 5));
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const testOrchestration = async () => {
    setTesting(true);
    setLiveResult(null);
    try {
      // Use user's own address for self-tip test (no hardcoded addresses)
      let testRecipient = '0x0000000000000000000000000000000000000001';
      try {
        const { addresses } = await api.getAddresses();
        const ethAddr = addresses['ethereum-sepolia'] ?? Object.values(addresses)[0];
        if (ethAddr) testRecipient = ethAddr;
      } catch { /* fallback to placeholder */ }

      const result = await api.orchestratorPropose('tip', {
        recipient: testRecipient,
        amount: '0.002',
        token: 'usdt',
        chainId: 'ethereum-sepolia',
        memo: 'Test orchestration from dashboard',
      });
      setLiveResult(result as unknown as OrchestratedAction);
      await load();
    } catch { /* ignore */ }
    setTesting(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text-line" width="180px" height="16px" />
        <Skeleton variant="text-line" width="80px" height="28px" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <Skeleton key={i} variant="card" height="100px" />)}
      </div>
      <Skeleton variant="card" height="40px" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          Multi-Agent Orchestration
        </h3>
        <button onClick={testOrchestration} disabled={testing} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-press">
          <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Voting...' : 'Test Vote'}
        </button>
      </div>

      {/* Agent Performance Cards */}
      <div className="grid grid-cols-3 gap-2">
        {stats?.agentPerformance.map((agent, i) => {
          const Icon = agentIcons[agent.role] ?? Shield;
          const color = agentColors[agent.role] ?? 'text-accent';
          return (
            <div key={agent.role} className="p-3 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs font-medium text-text-primary">{agentNames[agent.role] ?? agent.role}</span>
              </div>
              <div className="text-lg font-bold text-text-primary tabular-nums">{agent.avgConfidence}%</div>
              <div className="text-xs text-text-secondary">avg confidence</div>
              <div className="flex gap-2 mt-1.5 text-xs">
                <span className="text-green-400">&#10003;{agent.approvals}</span>
                <span className="text-red-400">&#10007;{agent.rejections}</span>
                <span className="text-text-secondary">w:{agent.weight}x</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* LIVE VOTING RESULT — THE WOW MOMENT */}
      {liveResult && (
        <div className="rounded-lg border-2 border-accent/30 bg-accent/5 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Live Vote Result</span>
            <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${
              liveResult.consensus === 'approved'
                ? 'bg-green-500/15 text-green-400 animate-success-pulse'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {liveResult.consensus.toUpperCase()} — {liveResult.overallConfidence}%
            </span>
          </div>

          {/* 3-column agent votes with staggered reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {liveResult.votes.map((vote, i) => (
              <VoteCard key={vote.agent} vote={vote} index={i} isLive />
            ))}
          </div>

          {/* Reasoning chain */}
          {liveResult.reasoningChain.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-accent/15">
              <p className="text-xs font-semibold text-accent uppercase tracking-wider">Consensus Reasoning</p>
              {liveResult.reasoningChain.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-text-secondary animate-list-item-in" style={{ animationDelay: `${(i + 3) * 200}ms` }}>
                  <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border text-xs">
          <span className="text-text-secondary">Total: <strong className="text-text-primary">{stats.total}</strong></span>
          <span className="text-green-400">Approved: {stats.approved}</span>
          <span className="text-red-400">Rejected: {stats.rejected}</span>
          <span className="text-text-secondary ml-auto">Confidence: {stats.avgConfidence}%</span>
        </div>
      )}

      {/* Recent Decisions — Expandable with reasoning */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-secondary">Recent Decisions</h4>
          {history.map((action, i) => {
            const isExpanded = expandedId === action.id;
            return (
              <div key={action.id} className="rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : action.id)}
                  className="w-full p-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      action.consensus === 'approved' ? 'bg-green-500/10 text-green-400' :
                      action.consensus === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {action.consensus === 'approved' ? '\u2713' : '\u2717'} {action.consensus}
                    </span>
                    <div className="flex gap-1">
                      {action.votes.map((vote) => (
                        <span key={vote.agent} className={`text-xs px-1 py-0.5 rounded ${
                          vote.decision === 'approve' ? 'bg-green-500/10 text-green-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {agentNames[vote.agent]?.slice(0, 3)}: {vote.confidence}%
                        </span>
                      ))}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
                </button>

                {/* Expanded reasoning */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-2 animate-slide-down">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {action.votes.map((vote, vi) => (
                        <VoteCard key={vote.agent} vote={vote} index={vi} isLive={false} />
                      ))}
                    </div>
                    {action.reasoningChain.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-border">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Reasoning Chain</p>
                        {action.reasoningChain.map((step, si) => (
                          <p key={si} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <span className="text-accent font-bold">{si + 1}.</span> {step}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
