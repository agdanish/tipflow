// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Shield, Brain, Coins, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

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

const agentNames: Record<string, string> = {
  tip_executor: 'TipExecutor',
  guardian: 'Guardian',
  treasury_optimizer: 'TreasuryOptimizer',
};

export function OrchestratorPanel() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [history, setHistory] = useState<OrchestratedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

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
    try {
      await api.orchestratorPropose('tip', {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68',
        amount: '0.002',
        token: 'usdt',
        chainId: 'ethereum-sepolia',
        memo: 'Test orchestration from dashboard',
      });
      await load();
    } catch { /* ignore */ }
    setTesting(false);
  };

  if (loading) return <div className="p-4 text-text-secondary text-sm">Loading orchestrator...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          Multi-Agent Orchestration
        </h3>
        <button onClick={testOrchestration} disabled={testing} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test Vote'}
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-3 gap-2">
        {stats?.agentPerformance.map((agent) => {
          const Icon = agentIcons[agent.role] ?? Shield;
          const color = agentColors[agent.role] ?? 'text-accent';
          return (
            <div key={agent.role} className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs font-medium text-text-primary">{agentNames[agent.role] ?? agent.role}</span>
              </div>
              <div className="text-lg font-bold text-text-primary">{agent.avgConfidence}%</div>
              <div className="text-[10px] text-text-secondary">avg confidence</div>
              <div className="flex gap-2 mt-1.5 text-[10px]">
                <span className="text-green-400">&#10003;{agent.approvals}</span>
                <span className="text-red-400">&#10007;{agent.rejections}</span>
                <span className="text-text-secondary">w:{agent.weight}x</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Bar */}
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border text-xs">
          <span className="text-text-secondary">Total: <strong className="text-text-primary">{stats.total}</strong></span>
          <span className="text-green-400">Approved: {stats.approved}</span>
          <span className="text-red-400">Rejected: {stats.rejected}</span>
          <span className="text-text-secondary ml-auto">Confidence: {stats.avgConfidence}%</span>
        </div>
      )}

      {/* Recent Actions */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-secondary">Recent Decisions</h4>
          {history.map((action) => (
            <div key={action.id} className="p-2.5 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  action.consensus === 'approved' ? 'bg-green-500/10 text-green-400' :
                  action.consensus === 'rejected' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {action.consensus === 'approved' ? '\u2713' : action.consensus === 'rejected' ? '\u2717' : '?'} {action.consensus}
                </span>
                <span className="text-[10px] text-text-secondary">{action.overallConfidence}% confidence</span>
              </div>
              <div className="flex gap-1.5">
                {action.votes.map((vote) => (
                  <span key={vote.agent} className={`text-[10px] px-1.5 py-0.5 rounded ${
                    vote.decision === 'approve' ? 'bg-green-500/10 text-green-400' :
                    vote.decision === 'reject' ? 'bg-red-500/10 text-red-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {agentNames[vote.agent]?.slice(0, 3) ?? vote.agent}: {vote.confidence}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
