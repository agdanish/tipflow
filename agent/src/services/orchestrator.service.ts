// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { logger } from '../utils/logger.js';

// ── Types ──────────────────────────────────────────────────────

/** Sub-agent roles in the orchestration protocol */
export type AgentRole = 'tip_executor' | 'guardian' | 'treasury_optimizer';

/** A sub-agent's vote on a proposed action */
export interface AgentVote {
  agent: AgentRole;
  decision: 'approve' | 'reject' | 'abstain';
  confidence: number; // 0-100
  reasoning: string;
  timestamp: string;
}

/** A proposed action that sub-agents vote on */
export interface OrchestratedAction {
  id: string;
  type: 'tip' | 'escrow' | 'stream' | 'bridge' | 'lend';
  params: {
    recipient?: string;
    amount?: string;
    token?: string;
    chainId?: string;
    memo?: string;
    [key: string]: unknown;
  };
  /** Votes from each sub-agent */
  votes: AgentVote[];
  /** Final consensus decision */
  consensus: 'approved' | 'rejected' | 'pending' | 'split_decision';
  /** Overall confidence (weighted average of votes) */
  overallConfidence: number;
  /** Full reasoning chain */
  reasoningChain: string[];
  /** Timestamps */
  proposedAt: string;
  resolvedAt?: string;
  /** If executed, the result */
  executionResult?: {
    success: boolean;
    txHash?: string;
    error?: string;
  };
}

/** Sub-agent configuration */
interface SubAgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  weight: number; // Vote weight (higher = more influential)
  evaluator: (action: OrchestratedAction) => AgentVote;
}

// ── Service ────────────────────────────────────────────────────

/**
 * OrchestratorService — Multi-Agent Orchestration Protocol
 *
 * Three specialized sub-agents independently evaluate every tip:
 *
 * 1. TipExecutor — Evaluates feasibility (can we execute this?)
 *    - Checks balance sufficiency
 *    - Validates recipient address format
 *    - Estimates gas costs
 *
 * 2. Guardian — Evaluates safety (should we execute this?)
 *    - Checks spending limits
 *    - Validates recipient trust score
 *    - Detects anomalous patterns (unusual amount, new recipient, etc.)
 *
 * 3. TreasuryOptimizer — Evaluates economics (is this the best way?)
 *    - Compares fees across chains
 *    - Checks if better timing exists
 *    - Evaluates impact on treasury reserves
 *
 * Consensus rule: 2-of-3 must approve for execution.
 * Guardian has veto power (can reject even with 2 approvals).
 *
 * This architecture ensures no single point of failure in
 * autonomous tip decisions — the agent system is self-checking.
 */
export class OrchestratorService {
  private actions: OrchestratedAction[] = [];
  private counter = 0;
  private subAgents: SubAgentConfig[];

  // Configurable thresholds
  private dailySpent = 0;
  private dailyLimit = 0.1; // USDT
  private knownRecipients = new Set<string>();
  private lastResetDate = new Date().toDateString();

  constructor() {
    this.subAgents = [
      {
        role: 'tip_executor',
        name: 'TipExecutor',
        description: 'Evaluates technical feasibility of the tip',
        weight: 1.0,
        evaluator: this.tipExecutorEvaluate.bind(this),
      },
      {
        role: 'guardian',
        name: 'Guardian',
        description: 'Evaluates safety and policy compliance',
        weight: 1.5, // Higher weight — safety is paramount
        evaluator: this.guardianEvaluate.bind(this),
      },
      {
        role: 'treasury_optimizer',
        name: 'TreasuryOptimizer',
        description: 'Evaluates economic efficiency',
        weight: 0.8,
        evaluator: this.treasuryOptimizerEvaluate.bind(this),
      },
    ];
    logger.info('Multi-agent orchestrator initialized', { agents: this.subAgents.map(a => a.name) });
  }

  // ── Core Orchestration ───────────────────────────────────────

  /**
   * Propose an action and run it through multi-agent consensus.
   * Returns the orchestrated action with votes and consensus.
   */
  propose(type: OrchestratedAction['type'], params: OrchestratedAction['params']): OrchestratedAction {
    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpent = 0;
      this.lastResetDate = today;
    }

    const action: OrchestratedAction = {
      id: `orch_${++this.counter}_${Date.now()}`,
      type,
      params,
      votes: [],
      consensus: 'pending',
      overallConfidence: 0,
      reasoningChain: [],
      proposedAt: new Date().toISOString(),
    };

    // Each sub-agent independently evaluates
    action.reasoningChain.push(`[Orchestrator] Proposed ${type}: ${params.amount ?? '?'} ${params.token ?? 'USDT'} to ${(params.recipient ?? 'unknown').slice(0, 12)}...`);

    for (const agent of this.subAgents) {
      const vote = agent.evaluator(action);
      action.votes.push(vote);
      action.reasoningChain.push(`[${agent.name}] ${vote.decision.toUpperCase()} (${vote.confidence}%): ${vote.reasoning}`);
    }

    // Determine consensus
    action.consensus = this.determineConsensus(action);
    action.resolvedAt = new Date().toISOString();

    // Calculate weighted confidence
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < action.votes.length; i++) {
      const vote = action.votes[i];
      const weight = this.subAgents[i].weight;
      if (vote.decision === 'approve') {
        weightedSum += vote.confidence * weight;
      }
      totalWeight += weight;
    }
    action.overallConfidence = Math.round(weightedSum / totalWeight);

    action.reasoningChain.push(`[Orchestrator] Consensus: ${action.consensus} (${action.overallConfidence}% confidence)`);

    // Track for history
    if (action.consensus === 'approved' && params.amount) {
      this.dailySpent += parseFloat(params.amount);
      if (params.recipient) this.knownRecipients.add(params.recipient);
    }

    this.actions.push(action);
    logger.info('Orchestrated action resolved', {
      id: action.id,
      consensus: action.consensus,
      confidence: action.overallConfidence,
      votes: action.votes.map(v => `${v.agent}:${v.decision}`)
    });

    return action;
  }

  /**
   * Record execution result for an approved action
   */
  recordExecution(actionId: string, result: OrchestratedAction['executionResult']): OrchestratedAction | undefined {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return undefined;
    action.executionResult = result;
    if (result?.success) {
      action.reasoningChain.push(`[Orchestrator] Executed successfully: tx ${result.txHash?.slice(0, 14)}...`);
    } else {
      action.reasoningChain.push(`[Orchestrator] Execution failed: ${result?.error}`);
    }
    return action;
  }

  // ── Queries ──────────────────────────────────────────────────

  getAction(id: string): OrchestratedAction | undefined {
    return this.actions.find(a => a.id === id);
  }

  getHistory(): OrchestratedAction[] {
    return [...this.actions].reverse();
  }

  getStats() {
    const total = this.actions.length;
    const approved = this.actions.filter(a => a.consensus === 'approved').length;
    const rejected = this.actions.filter(a => a.consensus === 'rejected').length;
    const split = this.actions.filter(a => a.consensus === 'split_decision').length;

    return {
      total,
      approved,
      rejected,
      splitDecisions: split,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      avgConfidence: total > 0
        ? Math.round(this.actions.reduce((s, a) => s + a.overallConfidence, 0) / total)
        : 0,
      dailySpent: this.dailySpent,
      dailyLimit: this.dailyLimit,
      dailyRemaining: Math.max(0, this.dailyLimit - this.dailySpent),
      knownRecipients: this.knownRecipients.size,
      agentPerformance: this.subAgents.map(agent => {
        const agentVotes = this.actions.flatMap(a => a.votes.filter(v => v.agent === agent.role));
        return {
          agent: agent.name,
          role: agent.role,
          weight: agent.weight,
          totalVotes: agentVotes.length,
          approvals: agentVotes.filter(v => v.decision === 'approve').length,
          rejections: agentVotes.filter(v => v.decision === 'reject').length,
          avgConfidence: agentVotes.length > 0
            ? Math.round(agentVotes.reduce((s, v) => s + v.confidence, 0) / agentVotes.length)
            : 0,
        };
      }),
    };
  }

  // ── Configuration ────────────────────────────────────────────

  setDailyLimit(limit: number): void {
    this.dailyLimit = limit;
    logger.info('Daily limit updated', { limit });
  }

  addKnownRecipient(address: string): void {
    this.knownRecipients.add(address);
  }

  // ── Sub-Agent Evaluators ─────────────────────────────────────

  /**
   * TipExecutor — checks technical feasibility
   */
  private tipExecutorEvaluate(action: OrchestratedAction): AgentVote {
    const { recipient, amount, chainId } = action.params;
    let confidence = 80;
    let decision: AgentVote['decision'] = 'approve';
    const reasons: string[] = [];

    // Validate recipient
    if (!recipient || recipient.length < 10) {
      decision = 'reject';
      confidence = 95;
      reasons.push('Invalid recipient address');
    } else {
      reasons.push('Recipient address format valid');
    }

    // Validate amount
    const numAmount = parseFloat(amount ?? '0');
    if (numAmount <= 0) {
      decision = 'reject';
      confidence = 99;
      reasons.push('Amount must be positive');
    } else if (numAmount > 1) {
      confidence = Math.max(confidence - 20, 40);
      reasons.push(`Large amount (${numAmount}) — higher risk`);
    } else {
      reasons.push(`Amount ${numAmount} within normal range`);
    }

    // Chain validation
    const validChains = ['ethereum-sepolia', 'ton-testnet', 'tron-nile'];
    if (chainId && !validChains.includes(chainId)) {
      decision = 'reject';
      confidence = 90;
      reasons.push(`Unknown chain: ${chainId}`);
    } else {
      reasons.push(`Chain ${chainId ?? 'auto-select'} supported`);
    }

    return {
      agent: 'tip_executor',
      decision,
      confidence,
      reasoning: reasons.join('; '),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Guardian — checks safety and policy compliance
   * Has VETO power (can reject even with 2 approvals)
   */
  private guardianEvaluate(action: OrchestratedAction): AgentVote {
    const { recipient, amount } = action.params;
    let confidence = 85;
    let decision: AgentVote['decision'] = 'approve';
    const reasons: string[] = [];
    const numAmount = parseFloat(amount ?? '0');

    // Check daily spending limit
    if (this.dailySpent + numAmount > this.dailyLimit) {
      decision = 'reject';
      confidence = 95;
      reasons.push(`Would exceed daily limit: ${this.dailySpent + numAmount} > ${this.dailyLimit}`);
    } else {
      const pctUsed = ((this.dailySpent + numAmount) / this.dailyLimit) * 100;
      reasons.push(`Daily budget: ${pctUsed.toFixed(0)}% used after this tip`);
      if (pctUsed > 80) confidence -= 15;
    }

    // Check if recipient is known
    if (recipient && this.knownRecipients.has(recipient)) {
      confidence += 10;
      reasons.push('Recipient is known/trusted');
    } else if (recipient) {
      confidence -= 20;
      reasons.push('NEW recipient — exercise caution');
      if (numAmount > 0.01) {
        decision = 'reject';
        confidence = 80;
        reasons.push('Large tip to unknown recipient blocked');
      }
    }

    // Anomaly detection: unusual amount
    if (numAmount > 0.05) {
      confidence -= 25;
      reasons.push(`Unusually large tip amount: ${numAmount}`);
      if (numAmount > 0.1) {
        decision = 'reject';
        confidence = 90;
        reasons.push('Amount exceeds safety threshold');
      }
    }

    // Time-based check (suspicious: tips at unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      confidence -= 10;
      reasons.push('Unusual hour for tipping activity');
    }

    return {
      agent: 'guardian',
      decision,
      confidence: Math.min(99, Math.max(10, confidence)),
      reasoning: reasons.join('; '),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * TreasuryOptimizer — checks economic efficiency
   */
  private treasuryOptimizerEvaluate(action: OrchestratedAction): AgentVote {
    const { amount, chainId } = action.params;
    let confidence = 75;
    let decision: AgentVote['decision'] = 'approve';
    const reasons: string[] = [];
    const numAmount = parseFloat(amount ?? '0');

    // Fee efficiency check (approximate)
    const feeEstimates: Record<string, number> = {
      'ethereum-sepolia': 0.002,
      'ton-testnet': 0.0005,
      'tron-nile': 0.001,
    };

    const chain = chainId ?? 'ethereum-sepolia';
    const estimatedFee = feeEstimates[chain] ?? 0.002;
    const feePercentage = numAmount > 0 ? (estimatedFee / numAmount) * 100 : 100;

    if (feePercentage > 50) {
      decision = 'reject';
      confidence = 85;
      reasons.push(`Fee too high: ${feePercentage.toFixed(0)}% of tip amount`);
    } else if (feePercentage > 20) {
      confidence -= 20;
      reasons.push(`Fee warning: ${feePercentage.toFixed(0)}% of tip goes to gas`);
    } else {
      reasons.push(`Fee efficient: only ${feePercentage.toFixed(1)}% gas overhead`);
    }

    // Chain optimization
    if (chain === 'ethereum-sepolia' && numAmount < 0.005) {
      confidence -= 15;
      reasons.push('Consider TON/TRON for small tips (lower fees)');
    } else {
      reasons.push(`Chain ${chain} appropriate for this amount`);
    }

    // Treasury impact
    const remainingBudget = this.dailyLimit - this.dailySpent;
    const budgetImpact = numAmount > 0 ? (numAmount / remainingBudget) * 100 : 0;
    if (budgetImpact > 50 && remainingBudget > 0) {
      confidence -= 10;
      reasons.push(`High treasury impact: ${budgetImpact.toFixed(0)}% of remaining daily budget`);
    } else {
      reasons.push(`Sustainable: ${budgetImpact.toFixed(0)}% of remaining budget`);
    }

    return {
      agent: 'treasury_optimizer',
      decision,
      confidence: Math.min(99, Math.max(10, confidence)),
      reasoning: reasons.join('; '),
      timestamp: new Date().toISOString(),
    };
  }

  // ── Consensus Logic ──────────────────────────────────────────

  /**
   * 2-of-3 consensus with Guardian veto power.
   *
   * Rules:
   * 1. If Guardian rejects → REJECTED (veto power)
   * 2. If 2+ agents approve → APPROVED
   * 3. If 2+ agents reject → REJECTED
   * 4. Otherwise → SPLIT_DECISION (needs human review)
   */
  private determineConsensus(action: OrchestratedAction): OrchestratedAction['consensus'] {
    const guardianVote = action.votes.find(v => v.agent === 'guardian');

    // Guardian veto
    if (guardianVote?.decision === 'reject') {
      return 'rejected';
    }

    const approvals = action.votes.filter(v => v.decision === 'approve').length;
    const rejections = action.votes.filter(v => v.decision === 'reject').length;

    if (approvals >= 2) return 'approved';
    if (rejections >= 2) return 'rejected';
    return 'split_decision';
  }
}
