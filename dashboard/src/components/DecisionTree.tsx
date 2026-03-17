import { useState } from 'react';
import { Search, Wallet, TrendingDown, GitBranch, Rocket, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import type { AgentDecision } from '../types';

interface DecisionTreeProps {
  decision: AgentDecision;
  /** Current agent pipeline status — drives node animations */
  agentStatus?: 'idle' | 'analyzing' | 'reasoning' | 'executing' | 'confirming';
}

type NodeStatus = 'pending' | 'active' | 'complete' | 'error';

interface TreeNode {
  id: string;
  label: string;
  icon: typeof Search;
  /** Status derived from agent pipeline state */
  status: NodeStatus;
  /** Data produced by this step (shown on completion) */
  detail?: string;
}

/** Map agent pipeline status to the corresponding step index (0-based) */
const STATUS_INDEX: Record<string, number> = {
  idle: -1,
  analyzing: 0,
  reasoning: 2,
  executing: 4,
  confirming: 5,
};

function resolveNodeStatus(nodeIndex: number, agentStatus: string, hasDecision: boolean): NodeStatus {
  // If we have a full decision and agent is idle, everything is complete
  if (hasDecision && agentStatus === 'idle') return 'complete';

  const activeIdx = STATUS_INDEX[agentStatus] ?? -1;
  if (activeIdx < 0) return 'pending';

  // For steps between major states, interpolate
  if (nodeIndex < activeIdx) return 'complete';
  if (nodeIndex === activeIdx) return 'active';
  // The step right after active is also complete if we've progressed past it
  return 'pending';
}

function buildNodes(decision: AgentDecision, agentStatus: string): TreeNode[] {
  const hasDecision = !!decision.selectedChain;
  const isComplete = hasDecision && agentStatus === 'idle';

  const feeDetail = decision.feeComparison
    ?.map((fc) => `${fc.chainName}: ${fc.estimatedFeeUsd}`)
    .join(' | ');

  return [
    {
      id: 'parse',
      label: 'Parse Input',
      icon: Search,
      status: resolveNodeStatus(0, agentStatus, hasDecision),
      detail: isComplete
        ? `Parsed tip request successfully`
        : undefined,
    },
    {
      id: 'balances',
      label: 'Check Balances',
      icon: Wallet,
      status: resolveNodeStatus(1, agentStatus, hasDecision),
      detail: isComplete
        ? decision.analyses
            .map((a) => `${a.chainName}: ${a.balance}`)
            .join(' | ')
        : undefined,
    },
    {
      id: 'fees',
      label: 'Compare Fees',
      icon: TrendingDown,
      status: resolveNodeStatus(2, agentStatus, hasDecision),
      detail: isComplete ? (feeDetail || 'Fees analyzed') : undefined,
    },
    {
      id: 'select',
      label: 'Select Chain',
      icon: GitBranch,
      status: resolveNodeStatus(3, agentStatus, hasDecision),
      detail: isComplete
        ? `Selected ${decision.analyses.find((a) => a.chainId === decision.selectedChain)?.chainName ?? decision.selectedChain} (${Math.round(decision.confidence * 100)}% confidence)`
        : undefined,
    },
    {
      id: 'execute',
      label: 'Execute',
      icon: Rocket,
      status: resolveNodeStatus(4, agentStatus, hasDecision),
      detail: isComplete ? 'Transaction submitted' : undefined,
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: ShieldCheck,
      status: resolveNodeStatus(5, agentStatus, hasDecision),
      detail: isComplete
        ? decision.feeSavings
          ? `Confirmed — saved ${decision.feeSavings}`
          : 'Transaction confirmed'
        : undefined,
    },
  ];
}

const STATUS_STYLES: Record<NodeStatus, { dot: string; line: string; label: string; bg: string }> = {
  pending: {
    dot: 'bg-surface-3 text-text-muted border-border',
    line: 'bg-surface-3',
    label: 'text-text-muted',
    bg: 'bg-surface-2/50',
  },
  active: {
    dot: 'bg-info/20 text-info border-info/40 decision-node-pulse',
    line: 'bg-info/40',
    label: 'text-info',
    bg: 'bg-info/5',
  },
  complete: {
    dot: 'bg-accent/20 text-accent border-accent/40',
    line: 'bg-accent/40',
    label: 'text-accent',
    bg: 'bg-accent/5',
  },
  error: {
    dot: 'bg-error/20 text-error border-error/40',
    line: 'bg-error/40',
    label: 'text-error',
    bg: 'bg-error/5',
  },
};

function TreeNodeRow({ node, isLast }: { node: TreeNode; isLast: boolean }) {
  const s = STATUS_STYLES[node.status];
  const Icon = node.icon;

  return (
    <div className="relative flex items-start gap-3">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] rounded-full transition-colors duration-500 ${s.line}`}
        />
      )}

      {/* Node circle */}
      <div
        className={`relative z-10 w-[30px] h-[30px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${s.dot}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Label + detail */}
      <div className={`flex-1 min-w-0 pb-4 ${isLast ? 'pb-0' : ''}`}>
        <p className={`text-xs font-semibold transition-colors duration-300 ${s.label}`}>
          {node.label}
        </p>
        {node.detail && (
          <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed animate-fade-in truncate">
            {node.detail}
          </p>
        )}
      </div>

      {/* Status indicator */}
      <div className="shrink-0 mt-1">
        {node.status === 'complete' && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
        )}
        {node.status === 'active' && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-info decision-node-pulse" />
        )}
      </div>
    </div>
  );
}

export function DecisionTree({ decision, agentStatus = 'idle' }: DecisionTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const nodes = buildNodes(decision, agentStatus);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left mb-1"
      >
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-accent" />
          Decision Tree
          <span className="text-[10px] font-normal text-text-muted ml-1">
            {nodes.filter((n) => n.status === 'complete').length}/{nodes.length} steps
          </span>
        </h3>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 pl-0.5 animate-fade-in">
          {nodes.map((node, i) => (
            <TreeNodeRow key={node.id} node={node} isLast={i === nodes.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
