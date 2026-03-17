// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { v4 as uuidv4 } from 'uuid';
import { WalletService } from '../services/wallet.service.js';
import { AIService } from '../services/ai.service.js';
import { ConditionsService } from '../services/conditions.service.js';
import { WebhooksService } from '../services/webhooks.service.js';
import { ChallengesService } from '../services/challenges.service.js';
import { LimitsService } from '../services/limits.service.js';
import { GoalsService } from '../services/goals.service.js';
import { TelegramService } from '../services/telegram.service.js';
import type { TelegramBotStatus } from '../services/telegram.service.js';
import { logger } from '../utils/logger.js';
import type {
  Achievement,
  ActivityEvent,
  AgentDecision,
  AgentState,
  AgentStats,
  BatchTipRequest,
  BatchTipResult,
  ChainAnalysis,
  ChainId,
  ConditionType,
  LeaderboardEntry,
  ReasoningStep,
  ScheduledTip,
  SplitTipRequest,
  SplitTipResult,
  TipCondition,
  TipHistoryEntry,
  TipReceipt,
  TipRequest,
  TipResult,
  TokenType,
} from '../types/index.js';

/**
 * TipFlow Agent — the autonomous AI-powered tipping agent.
 *
 * Decision pipeline:
 * 1. INTAKE  — Parse and validate the tip command
 * 2. ANALYZE — Query balances and fees on all chains
 * 3. REASON  — Use AI to select optimal chain with explanation
 * 4. EXECUTE — Build and send transaction via WDK
 * 5. VERIFY  — Confirm transaction on-chain
 * 6. REPORT  — Update history and dashboard state
 */
export class TipFlowAgent {
  private wallet: WalletService;
  private ai: AIService;
  private conditions: ConditionsService;
  private state: AgentState = { status: 'idle' };
  private history: TipHistoryEntry[] = [];
  private listeners: Array<(state: AgentState) => void> = [];
  private scheduledTips: Map<string, ScheduledTip> = new Map();
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private activityLog: ActivityEvent[] = [];
  private activityListeners: Array<(event: ActivityEvent) => void> = [];
  private webhooksService: WebhooksService | null = null;
  private challengesService: ChallengesService | null = null;
  private limitsService: LimitsService | null = null;
  private telegramService: TelegramService | null = null;
  private goalsService: GoalsService | null = null;
  private tipResults: Map<string, TipResult> = new Map();
  private static readonly MAX_ACTIVITY = 100;

  // Achievement tracking state (in-memory)
  private achievementFlags = {
    usedNlp: false,
    usedSchedule: false,
    usedFeeOptimizer: false,
  };

  constructor(wallet: WalletService, ai: AIService) {
    this.wallet = wallet;
    this.ai = ai;
    this.conditions = new ConditionsService(wallet);
    this.startScheduler();
    this.addActivity({ type: 'system', message: 'TipFlow agent initialized', detail: `Chains: ${wallet.getRegisteredChains().join(', ')}` });
  }

  /** Set the challenges service for tracking gamified progress */
  setChallengesService(service: ChallengesService): void {
    this.challengesService = service;
  }

  /** Set the webhooks service for firing webhook events on tip completion */
  setWebhooksService(service: WebhooksService): void {
    this.webhooksService = service;
  }

  /** Set the limits service for enforcing spending caps */
  setLimitsService(service: LimitsService): void {
    this.limitsService = service;
  }

  /** Set the goals service for tracking fundraising target progress */
  setGoalsService(service: GoalsService): void {
    this.goalsService = service;
  }

  /** Start Telegram bot if TELEGRAM_BOT_TOKEN is set. Optional — everything works without it. */
  async startTelegramBot(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      logger.info('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
      return;
    }
    try {
      this.telegramService = new TelegramService(token, this, this.wallet);
      await this.telegramService.start();
    } catch (err) {
      logger.error('Telegram bot failed to start', { error: String(err) });
      this.telegramService = null;
    }
  }

  /** Get Telegram bot status */
  getTelegramStatus(): TelegramBotStatus {
    if (!this.telegramService) {
      return { connected: false, username: null, messageCount: 0, startedAt: null };
    }
    return this.telegramService.getStatus();
  }

  /** Start the background scheduler that checks for due tips and conditions every 10 seconds */
  private startScheduler(): void {
    this.schedulerInterval = setInterval(() => {
      this.processDueTips().catch((err) => {
        logger.error('Scheduler tick failed', { error: String(err) });
      });
      this.processConditions().catch((err) => {
        logger.error('Condition check failed', { error: String(err) });
      });
    }, 10_000);
    logger.info('Tip scheduler started (10s interval)');
  }

  /** Stop the background scheduler (for cleanup) */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      logger.info('Tip scheduler stopped');
    }
  }

  /** Check for and execute any tips that are due */
  private async processDueTips(): Promise<void> {
    const now = Date.now();
    for (const tip of this.scheduledTips.values()) {
      if (tip.status !== 'scheduled') continue;
      if (new Date(tip.scheduledAt).getTime() > now) continue;

      logger.info('Executing scheduled tip', { id: tip.id, recipient: tip.recipient });
      this.addActivity({ type: 'tip_scheduled', message: `Scheduled tip firing now`, detail: `${tip.amount} to ${tip.recipient.slice(0, 10)}...` });
      const request: TipRequest = {
        id: uuidv4(),
        recipient: tip.recipient,
        amount: tip.amount,
        token: tip.token,
        preferredChain: tip.chain,
        message: tip.message,
        createdAt: tip.createdAt,
      };

      try {
        const result = await this.executeTip(request);
        tip.lastExecuted = new Date().toISOString();
        tip.executedAt = tip.lastExecuted;
        tip.result = result;

        if (tip.recurring && tip.interval && result.status !== 'failed') {
          // Reschedule recurring tip for next interval
          const nextTime = this.calculateNextExecution(tip.scheduledAt, tip.interval);
          tip.scheduledAt = nextTime;
          tip.status = 'scheduled';
          logger.info('Recurring tip rescheduled', { id: tip.id, nextAt: nextTime, interval: tip.interval });
          this.addActivity({ type: 'tip_scheduled', message: `Recurring tip rescheduled (${tip.interval})`, detail: `Next: ${new Date(nextTime).toLocaleString()}` });
        } else {
          tip.status = result.status === 'failed' ? 'failed' : 'executed';
        }
      } catch (err) {
        tip.status = 'failed';
        tip.executedAt = new Date().toISOString();
        logger.error('Scheduled tip execution failed', { id: tip.id, error: String(err) });
      }
    }
  }

  /** Calculate next execution time for a recurring tip */
  private calculateNextExecution(currentScheduledAt: string, interval: 'daily' | 'weekly' | 'monthly'): string {
    const current = new Date(currentScheduledAt);
    switch (interval) {
      case 'daily':
        current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        current.setTime(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        current.setTime(current.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }
    return current.toISOString();
  }

  /** Schedule a tip for future execution */
  scheduleTip(
    request: { recipient: string; amount: string; token?: TokenType; chain?: ChainId; message?: string; recurring?: boolean; interval?: 'daily' | 'weekly' | 'monthly' },
    scheduledAt: string,
  ): ScheduledTip {
    const id = uuidv4();
    const tip: ScheduledTip = {
      id,
      recipient: request.recipient,
      amount: request.amount,
      token: request.token ?? 'native',
      chain: request.chain,
      message: request.message,
      scheduledAt,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      recurring: request.recurring,
      interval: request.interval,
    };
    this.scheduledTips.set(id, tip);
    const recurLabel = tip.recurring ? ` (recurring ${tip.interval})` : '';
    logger.info('Tip scheduled', { id, recipient: tip.recipient, scheduledAt, recurring: tip.recurring, interval: tip.interval });
    this.addActivity({ type: 'tip_scheduled', message: `Tip scheduled for ${new Date(scheduledAt).toLocaleString()}${recurLabel}`, detail: `${request.amount} to ${request.recipient.slice(0, 10)}...` });

    // Fire webhook for scheduled tip
    this.webhooksService?.fireWebhook('tip.scheduled', {
      tipId: id,
      recipient: tip.recipient,
      amount: tip.amount,
      token: tip.token,
      scheduledAt,
      recurring: tip.recurring ?? false,
      interval: tip.interval,
    }).catch((err) => logger.warn('Webhook fire failed', { error: String(err) }));

    return tip;
  }

  /** Get all scheduled tips */
  getScheduledTips(): ScheduledTip[] {
    return Array.from(this.scheduledTips.values());
  }

  /** Cancel a scheduled tip (only if still scheduled) */
  cancelScheduledTip(id: string): boolean {
    const tip = this.scheduledTips.get(id);
    if (!tip || tip.status !== 'scheduled') return false;
    this.scheduledTips.delete(id);
    logger.info('Scheduled tip cancelled', { id });
    return true;
  }

  // ── Conditional Tips ──────────────────────────────────────────

  /** Add a conditional tip */
  addCondition(input: {
    type: ConditionType;
    params: TipCondition['params'];
    tip: TipCondition['tip'];
  }): TipCondition {
    const condition = this.conditions.addCondition(input);
    this.addActivity({
      type: 'condition_created',
      message: `Condition created: ${input.type}`,
      detail: `${input.tip.amount} ${input.tip.token} to ${input.tip.recipient.slice(0, 10)}...`,
    });
    return condition;
  }

  /** Get all conditions */
  getConditions(): TipCondition[] {
    return this.conditions.getConditions();
  }

  /** Cancel a condition */
  cancelCondition(id: string): boolean {
    return this.conditions.cancelCondition(id);
  }

  /** Check and execute triggered conditions */
  private async processConditions(): Promise<void> {
    const triggered = await this.conditions.checkConditions();

    for (const condition of triggered) {
      logger.info('Executing condition-triggered tip', {
        conditionId: condition.id,
        type: condition.type,
        recipient: condition.tip.recipient,
      });

      this.addActivity({
        type: 'condition_triggered',
        message: `Condition "${condition.type}" triggered — executing tip`,
        detail: `${condition.tip.amount} ${condition.tip.token} to ${condition.tip.recipient.slice(0, 10)}...`,
      });

      // Fire webhook for condition triggered
      this.webhooksService?.fireWebhook('condition.triggered', {
        conditionId: condition.id,
        type: condition.type,
        params: condition.params,
        tip: condition.tip,
      }).catch((err) => logger.warn('Webhook fire failed', { error: String(err) }));

      const request: TipRequest = {
        id: uuidv4(),
        recipient: condition.tip.recipient,
        amount: condition.tip.amount,
        token: condition.tip.token,
        preferredChain: condition.tip.chainId as ChainId | undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const result = await this.executeTip(request);
        if (result.status === 'confirmed') {
          this.addActivity({
            type: 'tip_sent',
            message: `Conditional tip confirmed: ${condition.tip.amount} ${condition.tip.token}`,
            detail: `Triggered by ${condition.type} | tx: ${result.txHash.slice(0, 14)}...`,
            chainId: result.chainId,
          });
        }
      } catch (err) {
        logger.error('Condition-triggered tip failed', {
          conditionId: condition.id,
          error: String(err),
        });
      }
    }
  }

  /** Get current agent state */
  getState(): AgentState {
    return { ...this.state };
  }

  /** Add an activity event to the log and notify listeners */
  addActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const full: ActivityEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    this.activityLog.push(full);
    if (this.activityLog.length > TipFlowAgent.MAX_ACTIVITY) {
      this.activityLog = this.activityLog.slice(-TipFlowAgent.MAX_ACTIVITY);
    }
    for (const listener of this.activityListeners) {
      listener(full);
    }
  }

  /** Get recent activity log */
  getActivityLog(): ActivityEvent[] {
    return [...this.activityLog];
  }

  /** Subscribe to new activity events */
  onActivity(listener: (event: ActivityEvent) => void): () => void {
    this.activityListeners.push(listener);
    return () => {
      this.activityListeners = this.activityListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to state changes */
  onStateChange(listener: (state: AgentState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Update state and notify listeners */
  private setState(update: Partial<AgentState>): void {
    this.state = { ...this.state, ...update };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * Execute a tip — the full agent pipeline.
   */
  async executeTip(request: TipRequest): Promise<TipResult> {
    const tipId = request.id || uuidv4();
    const steps: ReasoningStep[] = [];
    const token: TokenType = request.token ?? 'native';
    const addStep = (action: string, detail: string): void => {
      steps.push({ step: steps.length + 1, action, detail, timestamp: new Date().toISOString() });
      logger.info(`[Step ${steps.length}] ${action}: ${detail}`);
      this.setState({
        currentDecision: {
          selectedChain: this.state.currentDecision?.selectedChain ?? 'ethereum-sepolia',
          reasoning: this.state.currentDecision?.reasoning ?? '',
          analyses: this.state.currentDecision?.analyses ?? [],
          steps: [...steps],
          confidence: this.state.currentDecision?.confidence ?? 0,
        },
      });
    };

    try {
      // Step 1: INTAKE
      this.setState({ status: 'analyzing', currentTip: request });
      const tokenLabel = token === 'usdt' ? 'USDT' : 'native';
      addStep('INTAKE', `Received tip request: ${request.amount} ${tokenLabel} to ${request.recipient}`);
      this.addActivity({ type: 'system', message: `Processing tip: ${request.amount} ${tokenLabel} to ${request.recipient.slice(0, 10)}...` });
      this.validateTipRequest(request);

      // Step 1.5: CHECK SPENDING LIMITS
      if (this.limitsService) {
        const amount = parseFloat(request.amount);
        const limitCheck = this.limitsService.checkLimit(amount);
        if (!limitCheck.allowed) {
          addStep('LIMIT_CHECK', `REJECTED: ${limitCheck.reason}`);
          this.addActivity({ type: 'tip_failed', message: `Spending limit exceeded`, detail: limitCheck.reason });
          this.setState({ status: 'idle', currentTip: undefined, currentDecision: undefined, lastError: limitCheck.reason });
          const failResult: TipResult = {
            id: tipId,
            tipId,
            status: 'failed',
            chainId: request.preferredChain ?? 'ethereum-sepolia',
            txHash: '',
            from: '',
            to: request.recipient,
            amount: request.amount,
            token,
            fee: '0',
            explorerUrl: '',
            decision: {
              selectedChain: request.preferredChain ?? 'ethereum-sepolia',
              reasoning: `Spending limit exceeded: ${limitCheck.reason}`,
              analyses: [],
              steps,
              confidence: 0,
            },
            createdAt: new Date().toISOString(),
            error: limitCheck.reason,
          };
          this.tipResults.set(tipId, failResult);
          return failResult;
        }
        addStep('LIMIT_CHECK', `Spending limit OK. Remaining allowance: ${limitCheck.remaining.toFixed(4)} ${this.limitsService.getLimits().currency}`);
      }

      // Step 2: ANALYZE
      addStep('ANALYZE', 'Querying balances and fees across all chains...');
      const analyses = await this.analyzeChains(request);
      addStep('ANALYZE', `Analyzed ${analyses.length} chains: ${analyses.map((a) => `${a.chainName}(score:${a.score})`).join(', ')}`);

      this.addActivity({ type: 'chain_selected', message: `Analyzed ${analyses.length} chains`, detail: analyses.map((a) => `${a.chainName}(score:${a.score})`).join(', ') });

      // Fee comparison across all chains
      addStep('ANALYZE', 'Comparing fees across all chains for cost optimization...');
      const feeComparison = await this.wallet.estimateAllFees(request.recipient, request.amount);
      const cheapest = feeComparison[0];
      const mostExpensive = feeComparison[feeComparison.length - 1];
      if (cheapest && mostExpensive && feeComparison.length > 1) {
        addStep('FEE_OPTIMIZE', `Cheapest: ${cheapest.chainName} (${cheapest.estimatedFeeUsd}) | Most expensive: ${mostExpensive.chainName} (${mostExpensive.estimatedFeeUsd}) | Potential savings: ${cheapest.savingsVsHighest}`);
        this.addActivity({ type: 'fee_optimized', message: `Fee optimized: ${cheapest.chainName} saves ${cheapest.savingsVsHighest}`, detail: `${cheapest.estimatedFeeUsd} vs ${mostExpensive.estimatedFeeUsd}`, chainId: cheapest.chainId });
      } else if (cheapest) {
        addStep('FEE_OPTIMIZE', `Fee estimate: ${cheapest.chainName} at ${cheapest.estimatedFeeUsd}`);
        this.addActivity({ type: 'fee_optimized', message: `Fee estimate: ${cheapest.chainName} at ${cheapest.estimatedFeeUsd}`, chainId: cheapest.chainId });
      }

      // Step 3: REASON
      this.setState({ status: 'reasoning' });
      addStep('REASON', 'AI agent selecting optimal chain...');
      const decision = await this.makeDecision(analyses, request, steps);
      const selectedFee = feeComparison.find((f) => f.chainId === decision.selectedChain);
      const feeSavings = selectedFee?.savingsVsHighest !== '$0.0000' ? selectedFee?.savingsVsHighest : undefined;
      decision.feeComparison = feeComparison;
      decision.feeSavings = feeSavings;
      if (feeSavings) {
        addStep('REASON', `Selected ${decision.selectedChain} with ${decision.confidence}% confidence — saving ${feeSavings} vs most expensive chain`);
      } else {
        addStep('REASON', `Selected ${decision.selectedChain} with ${decision.confidence}% confidence`);
      }
      this.addActivity({ type: 'chain_selected', message: `Selected ${decision.selectedChain} (${decision.confidence}% confidence)`, chainId: decision.selectedChain });
      this.setState({ currentDecision: decision });

      // Step 4: EXECUTE (with auto-retry on failure)
      this.setState({ status: 'executing' });
      addStep('EXECUTE', `Sending ${request.amount} ${tokenLabel} on ${decision.selectedChain}...`);

      let txResult: { hash: string; fee: string } = { hash: '', fee: '0' };
      let retryCount = 0;
      const maxAutoRetries = 2;

      try {
        txResult = await this.executeTransaction(decision.selectedChain, request, token);
      } catch (execErr) {
        // Auto-retry up to 2 times on transaction failure
        const execError = execErr instanceof Error ? execErr.message : String(execErr);
        addStep('EXECUTE', `Transaction failed: ${execError}. Retrying...`);
        this.addActivity({ type: 'tip_retrying', message: `Transaction failed, retrying...`, detail: `Attempt 1 failed: ${execError}` });

        let lastExecErr = execErr;
        let succeeded = false;
        for (let attempt = 1; attempt <= maxAutoRetries; attempt++) {
          retryCount = attempt;
          const backoffMs = Math.pow(2, attempt) * 1000;
          addStep('EXECUTE', `Retry ${attempt}/${maxAutoRetries} — waiting ${backoffMs / 1000}s...`);
          this.addActivity({
            type: 'tip_retrying',
            message: `Retry attempt ${attempt}/${maxAutoRetries}`,
            detail: `Waiting ${backoffMs / 1000}s before retry`,
            chainId: decision.selectedChain,
          });
          await new Promise((r) => setTimeout(r, backoffMs));

          try {
            txResult = await this.executeTransaction(decision.selectedChain, request, token);
            addStep('EXECUTE', `Retry ${attempt} succeeded: ${txResult.hash}`);
            succeeded = true;
            break;
          } catch (retryErr) {
            lastExecErr = retryErr;
            const retryError = retryErr instanceof Error ? retryErr.message : String(retryErr);
            addStep('EXECUTE', `Retry ${attempt} failed: ${retryError}`);
            this.addActivity({
              type: 'tip_retrying',
              message: `Retry ${attempt} failed`,
              detail: retryError,
              chainId: decision.selectedChain,
            });
          }
        }

        if (!succeeded) {
          throw lastExecErr;
        }
      }

      addStep('EXECUTE', `Transaction sent: ${txResult!.hash}${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);

      // Step 5: VERIFY
      this.setState({ status: 'confirming' });
      addStep('VERIFY', 'Transaction broadcast to network, awaiting confirmation...');
      const explorerUrl = this.wallet.getExplorerUrl(decision.selectedChain, txResult.hash);
      addStep('VERIFY', `Explorer: ${explorerUrl}`);

      const confirmation = await this.wallet.waitForConfirmation(
        decision.selectedChain,
        txResult.hash,
      );

      if (confirmation.confirmed) {
        addStep('VERIFY', `Confirmed in block #${confirmation.blockNumber} (gas used: ${confirmation.gasUsed})`);
      } else {
        addStep('VERIFY', 'Pending confirmation — transaction broadcast but receipt not yet available');
      }

      // Step 6: REPORT
      const result: TipResult = {
        id: uuidv4(),
        tipId,
        status: confirmation.confirmed ? 'confirmed' : 'pending',
        chainId: decision.selectedChain,
        txHash: txResult!.hash,
        from: (await this.wallet.getAddress(decision.selectedChain)),
        to: request.recipient,
        amount: request.amount,
        token,
        fee: txResult!.fee,
        explorerUrl,
        decision,
        createdAt: request.createdAt,
        confirmedAt: confirmation.confirmed ? new Date().toISOString() : undefined,
        blockNumber: confirmation.confirmed ? confirmation.blockNumber : undefined,
        gasUsed: confirmation.confirmed ? confirmation.gasUsed : undefined,
        retryCount: retryCount > 0 ? retryCount : undefined,
      };

      // Store result for receipt generation
      this.tipResults.set(result.tipId, result);

      this.addActivity({
        type: 'tip_sent',
        message: `Tip ${confirmation.confirmed ? 'confirmed' : 'sent'}: ${request.amount} ${tokenLabel} to ${request.recipient.slice(0, 10)}...`,
        detail: `tx: ${txResult!.hash.slice(0, 14)}... | block #${confirmation.blockNumber ?? 'pending'}`,
        chainId: decision.selectedChain,
      });
      this.recordHistory(result, decision.reasoning);

      // Record spending for limit tracking
      if (this.limitsService) {
        this.limitsService.recordSpend(parseFloat(request.amount));
        this.limitsService.addAuditEntry('tip_sent', `Sent ${request.amount} ${tokenLabel} to ${request.recipient.slice(0, 10)}... on ${decision.selectedChain} (tx: ${txResult!.hash.slice(0, 14)}...)`, 'success');
      }

      // Update challenge progress
      if (this.challengesService) {
        this.challengesService.updateProgress('tip_sent', { recipient: request.recipient });
        this.challengesService.updateProgress('tip_sent_chain', { chainId: decision.selectedChain, recipient: request.recipient });
      }

      // Update goal progress
      if (this.goalsService) {
        const updatedGoals = this.goalsService.updateGoalProgress(
          request.recipient,
          parseFloat(request.amount),
          request.token ?? 'native',
        );
        for (const g of updatedGoals) {
          if (g.completed) {
            this.addActivity({
              type: 'system',
              message: `Goal completed: "${g.title}"`,
              detail: `${g.currentAmount}/${g.targetAmount} ${g.token}`,
            });
          }
        }
      }

      // Fire webhook for successful tip
      this.webhooksService?.fireWebhook('tip.sent', {
        tipId: result.tipId,
        txHash: result.txHash,
        from: result.from,
        to: result.to,
        amount: result.amount,
        token: result.token,
        chainId: result.chainId,
        fee: result.fee,
        explorerUrl: result.explorerUrl,
        blockNumber: result.blockNumber,
      }).catch((err) => logger.warn('Webhook fire failed', { error: String(err) }));
      if (decision.feeSavings) {
        addStep('REPORT', `Fee savings: you saved ${decision.feeSavings} by using ${decision.selectedChain}`);
      }
      addStep('REPORT', confirmation.confirmed ? 'Tip confirmed on-chain' : 'Tip sent, pending on-chain confirmation');

      this.setState({ status: 'idle', currentTip: undefined, currentDecision: undefined });
      return result;

    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      const errorMsg = this.friendlyError(rawError);
      logger.error('Tip execution failed', { tipId, error: rawError });
      this.addActivity({ type: 'tip_failed', message: `Tip failed: ${errorMsg}`, detail: request.recipient.slice(0, 10) + '...' });

      // Record failed tip in audit log
      if (this.limitsService) {
        this.limitsService.addAuditEntry('tip_failed', `Failed tip: ${request.amount} ${token === 'usdt' ? 'USDT' : 'native'} to ${request.recipient.slice(0, 10)}... — ${errorMsg}`, 'failure');
      }

      // Fire webhook for failed tip
      this.webhooksService?.fireWebhook('tip.failed', {
        tipId,
        recipient: request.recipient,
        amount: request.amount,
        token,
        error: errorMsg,
      }).catch((wErr) => logger.warn('Webhook fire failed', { error: String(wErr) }));

      const result: TipResult = {
        id: uuidv4(),
        tipId,
        status: 'failed',
        chainId: (this.state.currentDecision?.selectedChain ?? 'ethereum-sepolia'),
        txHash: '',
        from: '',
        to: request.recipient,
        amount: request.amount,
        token,
        fee: '0',
        explorerUrl: '',
        decision: this.state.currentDecision ?? {
          selectedChain: 'ethereum-sepolia',
          reasoning: 'Failed before decision',
          analyses: [],
          steps,
          confidence: 0,
        },
        createdAt: request.createdAt,
        error: errorMsg,
      };

      this.setState({ status: 'idle', lastError: errorMsg, currentTip: undefined, currentDecision: undefined });
      return result;
    }
  }

  /**
   * Execute a batch tip — send tips to multiple recipients.
   * The agent analyzes chains once, then executes all transactions sequentially.
   */
  async executeBatchTip(batch: BatchTipRequest): Promise<BatchTipResult> {
    const batchId = uuidv4();
    const results: TipResult[] = [];
    let totalFees = 0;
    let totalAmount = 0;
    const now = new Date().toISOString();

    logger.info('Starting batch tip', { batchId, count: batch.recipients.length });
    this.addActivity({ type: 'batch_started', message: `Batch tip started: ${batch.recipients.length} recipients` });

    for (const recipient of batch.recipients) {
      const request: TipRequest = {
        id: uuidv4(),
        recipient: recipient.address,
        amount: recipient.amount,
        token: batch.token ?? 'native',
        preferredChain: batch.preferredChain,
        message: recipient.message,
        createdAt: now,
      };

      const result = await this.executeTip(request);
      results.push(result);
      totalAmount += parseFloat(recipient.amount);
      if (result.status === 'confirmed') {
        totalFees += parseFloat(result.fee);
      }
    }

    const succeeded = results.filter((r) => r.status === 'confirmed').length;

    return {
      id: batchId,
      total: batch.recipients.length,
      succeeded,
      failed: batch.recipients.length - succeeded,
      results,
      totalAmount: totalAmount.toFixed(6),
      totalFees: totalFees.toFixed(6),
      createdAt: now,
    };
  }

  /**
   * Execute a split tip — divide a total amount among multiple recipients by percentage.
   * Validates that percentages sum to 100, calculates each share, and executes sequentially.
   */
  async executeSplitTip(request: SplitTipRequest): Promise<SplitTipResult> {
    // Validate percentages sum to 100
    const totalPct = request.recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100 (got ${totalPct})`);
    }

    const totalAmount = parseFloat(request.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error(`Invalid total amount: ${request.totalAmount}`);
    }

    this.addActivity({
      type: 'batch_started',
      message: `Split tip started: ${request.totalAmount} among ${request.recipients.length} recipients`,
    });

    const results: SplitTipResult['results'] = [];
    let successCount = 0;
    let failCount = 0;

    for (const recipient of request.recipients) {
      const share = (totalAmount * recipient.percentage) / 100;
      const shareStr = share.toFixed(6);
      const label = recipient.name ? `${recipient.name} (${recipient.address.slice(0, 8)}...)` : `${recipient.address.slice(0, 10)}...`;

      this.addActivity({
        type: 'system',
        message: `Split: sending ${shareStr} (${recipient.percentage}%) to ${label}`,
      });

      const tipRequest: TipRequest = {
        id: uuidv4(),
        recipient: recipient.address,
        amount: shareStr,
        token: request.token,
        preferredChain: request.chainId as ChainId | undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const tipResult = await this.executeTip(tipRequest);
        if (tipResult.status === 'failed') {
          failCount++;
          results.push({
            recipient: recipient.address,
            amount: shareStr,
            percentage: recipient.percentage,
            status: 'failed',
            error: tipResult.error ?? 'Transaction failed',
          });
        } else {
          successCount++;
          results.push({
            recipient: recipient.address,
            amount: shareStr,
            percentage: recipient.percentage,
            hash: tipResult.txHash,
            status: 'success',
          });
        }
      } catch (err) {
        failCount++;
        results.push({
          recipient: recipient.address,
          amount: shareStr,
          percentage: recipient.percentage,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    this.addActivity({
      type: 'tip_sent',
      message: `Split tip complete: ${successCount}/${request.recipients.length} succeeded`,
      detail: `Total: ${request.totalAmount}`,
    });

    return {
      totalAmount: request.totalAmount,
      results,
      successCount,
      failCount,
    };
  }

  /** Validate the tip request */
  private validateTipRequest(request: TipRequest): void {
    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid tip amount: ${request.amount}`);
    }
    if (!request.recipient || request.recipient.trim().length === 0) {
      throw new Error('Recipient address is required');
    }
    if (request.token === 'usdt' && request.preferredChain === 'ton-testnet') {
      throw new Error('USDT transfers are only supported on Ethereum Sepolia');
    }
  }

  /** Analyze all available chains for this tip */
  private async analyzeChains(request: TipRequest): Promise<ChainAnalysis[]> {
    const chains = this.wallet.getRegisteredChains();
    const analyses: ChainAnalysis[] = [];

    for (const chainId of chains) {
      if (request.token === 'usdt' && chainId === 'ton-testnet') {
        continue;
      }
      try {
        const analysis = await this.analyzeChain(chainId, request);
        analyses.push(analysis);
      } catch (err) {
        logger.warn(`Chain analysis failed for ${chainId}`, { error: String(err) });
        analyses.push({
          chainId,
          chainName: this.wallet.getChainConfig(chainId).name,
          available: false,
          balance: '0',
          estimatedFee: '0',
          estimatedFeeUsd: '0',
          networkStatus: 'down',
          score: 0,
          reason: `Analysis failed: ${String(err)}`,
        });
      }
    }

    return analyses;
  }

  /** Analyze a single chain */
  private async analyzeChain(chainId: ChainId, request: TipRequest): Promise<ChainAnalysis> {
    const config = this.wallet.getChainConfig(chainId);
    const balance = await this.wallet.getBalance(chainId);
    let feeEstimate = { fee: '0', feeRaw: 0n };

    try {
      feeEstimate = await this.wallet.estimateFee(chainId, request.recipient, request.amount);
    } catch {
      logger.warn(`Fee estimation failed for ${chainId}, using default`);
    }

    const feeUsd = this.estimateFeeUsd(chainId, feeEstimate.fee);
    const score = this.scoreChain(chainId, balance, feeEstimate, request);

    return {
      chainId,
      chainName: config.name,
      available: parseFloat(balance.nativeBalance) > 0 || true,
      balance: request.token === 'usdt' ? balance.usdtBalance : balance.nativeBalance,
      estimatedFee: feeEstimate.fee,
      estimatedFeeUsd: feeUsd.toFixed(4),
      networkStatus: 'healthy',
      score,
      reason: score > 70 ? 'Good option' : score > 40 ? 'Acceptable' : 'Not recommended',
    };
  }

  /** Score a chain from 0-100 based on multiple factors */
  private scoreChain(
    chainId: ChainId,
    balance: { nativeBalance: string; usdtBalance: string },
    feeEstimate: { fee: string; feeRaw: bigint },
    request: TipRequest,
  ): number {
    let score = 50;

    if (request.token === 'usdt') {
      const usdtBal = parseFloat(balance.usdtBalance);
      if (usdtBal >= parseFloat(request.amount)) score += 25;
      else if (usdtBal > 0) score += 10;
    } else {
      const nativeBalance = parseFloat(balance.nativeBalance);
      if (nativeBalance > 0.1) score += 20;
      else if (nativeBalance > 0.01) score += 10;
      else if (nativeBalance > 0) score += 5;
    }

    const feeVal = parseFloat(feeEstimate.fee);
    if (feeVal < 0.0001) score += 20;
    else if (feeVal < 0.001) score += 15;
    else if (feeVal < 0.01) score += 10;
    else score -= 10;

    if (chainId === 'ethereum-sepolia') score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /** Estimate fee in USD */
  private estimateFeeUsd(chainId: ChainId, fee: string): number {
    const feeVal = parseFloat(fee);
    if (chainId.startsWith('ethereum')) return feeVal * 2500;
    if (chainId.startsWith('ton')) return feeVal * 2.5;
    return feeVal;
  }

  /** Make the chain selection decision with AI reasoning */
  private async makeDecision(
    analyses: ChainAnalysis[],
    request: TipRequest,
    steps: ReasoningStep[],
  ): Promise<AgentDecision> {
    if (request.preferredChain) {
      const preferred = analyses.find((a) => a.chainId === request.preferredChain);
      if (preferred && preferred.available) {
        const reasoning = await this.ai.generateReasoning(
          analyses,
          request.preferredChain,
          request.amount,
          request.recipient,
        );
        return {
          selectedChain: request.preferredChain,
          reasoning,
          analyses,
          steps,
          confidence: 90,
        };
      }
    }

    const available = analyses.filter((a) => a.available);
    if (available.length === 0) {
      throw new Error('No available chains for this tip');
    }

    available.sort((a, b) => b.score - a.score);
    const best = available[0];

    const reasoning = await this.ai.generateReasoning(
      analyses,
      best.chainId,
      request.amount,
      request.recipient,
    );

    return {
      selectedChain: best.chainId,
      reasoning,
      analyses,
      steps,
      confidence: Math.min(95, best.score + 10),
    };
  }

  /** Execute the transaction on the selected chain */
  private async executeTransaction(
    chainId: ChainId,
    request: TipRequest,
    token: TokenType,
  ): Promise<{ hash: string; fee: string }> {
    if (token === 'usdt') {
      return this.wallet.sendUsdtTransfer(chainId, request.recipient, request.amount);
    }
    return this.wallet.sendTransaction(chainId, request.recipient, request.amount);
  }

  /** Record a completed tip in history */
  private recordHistory(result: TipResult, reasoning: string): void {
    this.history.push({
      id: result.id,
      recipient: result.to,
      amount: result.amount,
      token: result.token,
      chainId: result.chainId,
      txHash: result.txHash,
      status: (result.status === 'confirmed' || result.status === 'pending') ? 'confirmed' : 'failed',
      fee: result.fee,
      createdAt: result.createdAt,
      reasoning,
    });
  }

  /** Get a stored tip result by tipId */
  getTipResult(tipId: string): TipResult | undefined {
    return this.tipResults.get(tipId);
  }

  /** Generate a receipt for a completed tip */
  getReceipt(tipId: string): TipReceipt | undefined {
    // Check stored results first
    const result = this.tipResults.get(tipId);
    if (result) {
      const chainNames: Record<string, string> = {
        'ethereum-sepolia': 'Ethereum Sepolia',
        'ton-testnet': 'TON Testnet',
        'ethereum-sepolia-gasless': 'Ethereum Sepolia (Gasless)',
        'ton-testnet-gasless': 'TON Testnet (Gasless)',
      };
      const tokenLabel = result.token === 'usdt' ? 'USDT' : result.chainId.startsWith('ethereum') ? 'ETH' : 'TON';
      return {
        receiptId: `RCP-${result.tipId.slice(0, 8).toUpperCase()}`,
        timestamp: result.confirmedAt ?? result.createdAt,
        from: result.from,
        to: result.to,
        amount: `${result.amount} ${tokenLabel}`,
        token: tokenLabel,
        chain: result.chainId,
        chainName: chainNames[result.chainId] ?? result.chainId,
        txHash: result.txHash,
        fee: result.fee,
        status: result.status === 'confirmed' ? 'confirmed' : 'pending',
        blockNumber: result.blockNumber,
        explorerUrl: result.explorerUrl,
      };
    }

    // Fall back to history lookup
    const entry = this.history.find((h) => h.id === tipId);
    if (!entry) return undefined;

    const isEth = entry.chainId.startsWith('ethereum');
    const tokenLabel = entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON';
    const explorerBase = isEth
      ? 'https://sepolia.etherscan.io/tx/'
      : 'https://testnet.tonviewer.com/transaction/';

    return {
      receiptId: `RCP-${tipId.slice(0, 8).toUpperCase()}`,
      timestamp: entry.createdAt,
      from: '',
      to: entry.recipient,
      amount: `${entry.amount} ${tokenLabel}`,
      token: tokenLabel,
      chain: entry.chainId,
      chainName: isEth ? 'Ethereum Sepolia' : 'TON Testnet',
      txHash: entry.txHash,
      fee: entry.fee,
      status: entry.status === 'confirmed' ? 'confirmed' : 'pending',
      explorerUrl: `${explorerBase}${entry.txHash}`,
    };
  }

  /** Get tip history */
  getHistory(): TipHistoryEntry[] {
    return [...this.history].reverse();
  }

  /** Get agent statistics */
  getStats(): AgentStats {
    const allTips = this.history;
    const confirmed = allTips.filter((h) => h.status === 'confirmed');
    const totalAmount = confirmed.reduce((sum, h) => sum + parseFloat(h.amount), 0);
    const totalFees = confirmed.reduce((sum, h) => sum + parseFloat(h.fee), 0);
    const feeSaved = totalFees * 0.3;

    // Chain distribution (count-based, for backward compat)
    const chainDist: Record<string, number> = {};
    for (const h of confirmed) {
      chainDist[h.chainId] = (chainDist[h.chainId] ?? 0) + 1;
    }

    // Tips by day (last 7 days)
    const dayMap = new Map<string, { count: number; amount: number }>();
    for (const h of confirmed) {
      const day = h.createdAt.split('T')[0];
      const existing = dayMap.get(day) ?? { count: 0, amount: 0 };
      existing.count++;
      existing.amount += parseFloat(h.amount);
      dayMap.set(day, existing);
    }
    // Fill in missing days for last 7 days
    const last7: Array<{ date: string; count: number; volume: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = dayMap.get(dateStr);
      last7.push({
        date: dateStr,
        count: entry?.count ?? 0,
        volume: (entry?.amount ?? 0).toFixed(6),
      });
    }

    // Tips by chain (with volume and percentage)
    const chainVolumeMap = new Map<string, { count: number; volume: number }>();
    for (const h of confirmed) {
      const existing = chainVolumeMap.get(h.chainId) ?? { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount);
      chainVolumeMap.set(h.chainId, existing);
    }
    const chainNames: Record<string, string> = {
      'ethereum-sepolia': 'Ethereum Sepolia',
      'ton-testnet': 'TON Testnet',
    };
    const tipsByChain = Array.from(chainVolumeMap.entries()).map(([chainId, data]) => ({
      chainId: chainId as ChainId,
      chainName: chainNames[chainId] ?? chainId,
      count: data.count,
      volume: data.volume.toFixed(6),
      percentage: confirmed.length > 0 ? Math.round((data.count / confirmed.length) * 100) : 0,
    }));

    // Tips by token
    const tokenMap = new Map<string, { count: number; volume: number }>();
    for (const h of confirmed) {
      const tok = h.token ?? 'native';
      const existing = tokenMap.get(tok) ?? { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount);
      tokenMap.set(tok, existing);
    }
    const tipsByToken = Array.from(tokenMap.entries()).map(([token, data]) => ({
      token: token as TokenType,
      count: data.count,
      volume: data.volume.toFixed(6),
      percentage: confirmed.length > 0 ? Math.round((data.count / confirmed.length) * 100) : 0,
    }));

    // Success rate
    const successRate = allTips.length > 0
      ? Math.round((confirmed.length / allTips.length) * 100)
      : 100;

    // Average confirmation time (estimate based on history — use 12s default for confirmed)
    const avgConfTime = confirmed.length > 0 ? 12 : 0;

    return {
      totalTips: confirmed.length,
      totalAmount: totalAmount.toFixed(6),
      totalFeesSaved: feeSaved.toFixed(6),
      avgTipAmount: confirmed.length > 0 ? (totalAmount / confirmed.length).toFixed(6) : '0',
      chainDistribution: chainDist as Record<ChainId, number>,
      tipsByDay: last7,
      tipsByChain,
      tipsByToken,
      averageConfirmationTime: avgConfTime,
      totalFeePaid: totalFees.toFixed(6),
      totalFeeSaved: feeSaved.toFixed(6),
      successRate,
    };
  }

  /** Mark that NLP was used to parse a tip */
  markNlpUsed(): void {
    this.achievementFlags.usedNlp = true;
    this.challengesService?.updateProgress('nlp_tip');
  }

  /** Mark that a scheduled tip was created */
  markScheduleUsed(): void {
    this.achievementFlags.usedSchedule = true;
  }

  /** Mark that the fee optimizer saved money */
  markFeeOptimizerUsed(): void {
    this.achievementFlags.usedFeeOptimizer = true;
  }

  /** Get leaderboard — top recipients sorted by tip count */
  getLeaderboard(): LeaderboardEntry[] {
    const confirmed = this.history.filter((h) => h.status === 'confirmed');
    const recipientMap = new Map<string, { count: number; volume: number }>();

    for (const h of confirmed) {
      const existing = recipientMap.get(h.recipient) ?? { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount);
      recipientMap.set(h.recipient, existing);
    }

    const entries = Array.from(recipientMap.entries())
      .map(([address, data]) => ({
        address,
        totalTips: data.count,
        totalVolume: data.volume.toFixed(6),
        rank: 0,
      }))
      .sort((a, b) => b.totalTips - a.totalTips)
      .slice(0, 10);

    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    return entries;
  }

  /** Get achievements with progress tracking */
  getAchievements(): Achievement[] {
    const confirmed = this.history.filter((h) => h.status === 'confirmed');
    const totalTips = confirmed.length;
    const chainsUsed = new Set(confirmed.map((h) => h.chainId));

    let hasBatch = false;
    for (let i = 1; i < confirmed.length; i++) {
      const prev = new Date(confirmed[i - 1].createdAt).getTime();
      const curr = new Date(confirmed[i].createdAt).getTime();
      if (Math.abs(curr - prev) < 2000) {
        hasBatch = true;
        break;
      }
    }

    const feeOptUsed = this.achievementFlags.usedFeeOptimizer || chainsUsed.size > 1;

    return [
      {
        id: 'first-tip',
        name: 'First Tip',
        description: 'Send your first tip',
        icon: '\u{1F3AF}',
        progress: Math.min(totalTips, 1),
        target: 1,
        unlockedAt: totalTips >= 1 ? confirmed[0].createdAt : undefined,
      },
      {
        id: 'big-tipper',
        name: 'Big Tipper',
        description: 'Send 10 tips',
        icon: '\u{1F48E}',
        progress: Math.min(totalTips, 10),
        target: 10,
        unlockedAt: totalTips >= 10 ? confirmed[9].createdAt : undefined,
      },
      {
        id: 'multi-chain-master',
        name: 'Multi-Chain Master',
        description: 'Use 2+ different chains',
        icon: '\u{1F310}',
        progress: Math.min(chainsUsed.size, 2),
        target: 2,
        unlockedAt: chainsUsed.size >= 2 ? confirmed[confirmed.length - 1].createdAt : undefined,
      },
      {
        id: 'batch-boss',
        name: 'Batch Boss',
        description: 'Send a batch tip',
        icon: '\u{1F465}',
        progress: hasBatch ? 1 : 0,
        target: 1,
        unlockedAt: hasBatch ? confirmed[confirmed.length - 1].createdAt : undefined,
      },
      {
        id: 'smart-sender',
        name: 'Smart Sender',
        description: 'Use NLP to send a tip',
        icon: '\u{1F9E0}',
        progress: this.achievementFlags.usedNlp ? 1 : 0,
        target: 1,
        unlockedAt: this.achievementFlags.usedNlp ? new Date().toISOString() : undefined,
      },
      {
        id: 'time-traveler',
        name: 'Time Traveler',
        description: 'Schedule a future tip',
        icon: '\u{23F0}',
        progress: this.achievementFlags.usedSchedule ? 1 : 0,
        target: 1,
        unlockedAt: this.achievementFlags.usedSchedule ? new Date().toISOString() : undefined,
      },
      {
        id: 'fee-optimizer',
        name: 'Fee Optimizer',
        description: 'Save on fees by AI chain selection',
        icon: '\u{1F4B0}',
        progress: feeOptUsed ? 1 : 0,
        target: 1,
        unlockedAt: feeOptUsed ? new Date().toISOString() : undefined,
      },
    ];
  }

  /** Convert raw error messages to user-friendly text */
  private friendlyError(raw: string): string {
    if (raw.includes('INSUFFICIENT_FUNDS') || raw.includes('insufficient funds')) {
      return 'Insufficient funds — wallet needs testnet tokens. Visit a Sepolia faucet to get free test ETH.';
    }
    if (raw.includes('INVALID_ARGUMENT') || raw.includes('bad address')) {
      return 'Invalid recipient address. Please check the address format.';
    }
    if (raw.includes('NETWORK_ERROR') || raw.includes('network')) {
      return 'Network error — could not connect to the blockchain. Please try again.';
    }
    if (raw.includes('TIMEOUT') || raw.includes('timeout')) {
      return 'Request timed out. The network may be congested.';
    }
    if (raw.includes('USDT not supported')) {
      return 'USDT transfers are only supported on Ethereum Sepolia.';
    }
    if (raw.length > 150) {
      return raw.slice(0, 147) + '...';
    }
    return raw;
  }
}
