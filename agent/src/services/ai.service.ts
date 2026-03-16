import { Ollama } from 'ollama';
import { logger } from '../utils/logger.js';
import type { ChainAnalysis, ChainId } from '../types/index.js';

/**
 * AI Service — provides LLM-powered reasoning for agent decisions.
 * Uses Ollama (local) for zero-cost inference.
 * Falls back to rule-based reasoning if Ollama is unavailable.
 */
export class AIService {
  private ollama: Ollama;
  private model: string;
  private available = false;

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
    });
    this.model = process.env.OLLAMA_MODEL ?? 'phi3:mini';
  }

  /** Check if Ollama is available and model is loaded */
  async initialize(): Promise<void> {
    try {
      const models = await this.ollama.list();
      const hasModel = models.models.some((m) => m.name.startsWith(this.model.split(':')[0]));
      if (hasModel) {
        this.available = true;
        logger.info('Ollama AI service initialized', { model: this.model });
      } else {
        logger.warn('Ollama model not found, using rule-based reasoning', { model: this.model });
      }
    } catch {
      logger.warn('Ollama not available, using rule-based reasoning');
    }
  }

  /** Whether LLM reasoning is available */
  isAvailable(): boolean {
    return this.available;
  }

  /** Generate reasoning for chain selection decision */
  async generateReasoning(
    analyses: ChainAnalysis[],
    selectedChain: ChainId,
    tipAmount: string,
    recipient: string,
  ): Promise<string> {
    if (!this.available) {
      return this.ruleBasedReasoning(analyses, selectedChain, tipAmount);
    }

    try {
      const prompt = this.buildReasoningPrompt(analyses, tipAmount, recipient);
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        options: {
          temperature: 0.3,
          num_predict: 200,
        },
      });
      return response.response.trim();
    } catch (err) {
      logger.error('Ollama reasoning failed, falling back to rules', { error: String(err) });
      return this.ruleBasedReasoning(analyses, selectedChain, tipAmount);
    }
  }

  /** Build the LLM prompt for chain analysis */
  private buildReasoningPrompt(
    analyses: ChainAnalysis[],
    tipAmount: string,
    recipient: string,
  ): string {
    const chainSummaries = analyses.map((a) =>
      `- ${a.chainName}: balance=${a.balance}, fee=${a.estimatedFee} (~$${a.estimatedFeeUsd}), status=${a.networkStatus}, score=${a.score}/100`
    ).join('\n');

    return `You are TipFlow's AI agent. Analyze these blockchain options and explain your chain selection decision in 2-3 sentences. Be concise and technical.

Tip: ${tipAmount} to ${recipient}

Chain Analysis:
${chainSummaries}

Explain which chain you recommend and why, considering fees, balance, and network health. Start with "Selected [chain] because..."`;
  }

  /** Deterministic rule-based reasoning as fallback */
  private ruleBasedReasoning(
    analyses: ChainAnalysis[],
    selectedChain: ChainId,
    tipAmount: string,
  ): string {
    const selected = analyses.find((a) => a.chainId === selectedChain);
    const other = analyses.find((a) => a.chainId !== selectedChain);

    if (!selected) {
      return `Selected ${selectedChain} as the only available chain for this ${tipAmount} tip.`;
    }

    const parts: string[] = [];
    parts.push(`Selected ${selected.chainName} for this ${tipAmount} tip.`);

    if (other && other.available) {
      const feeDiff = parseFloat(other.estimatedFeeUsd) - parseFloat(selected.estimatedFeeUsd);
      if (feeDiff > 0) {
        parts.push(`This saves approximately $${feeDiff.toFixed(4)} in fees compared to ${other.chainName}.`);
      }
    }

    if (selected.networkStatus === 'healthy') {
      parts.push('Network status is healthy with normal confirmation times.');
    } else if (selected.networkStatus === 'congested') {
      parts.push('Note: network is congested, confirmation may take longer.');
    }

    return parts.join(' ');
  }

  /** Generate a summary of agent activity for the dashboard */
  async generateActivitySummary(
    totalTips: number,
    totalAmount: string,
    topChain: string,
  ): Promise<string> {
    if (!this.available) {
      return `Processed ${totalTips} tips totaling ${totalAmount}. Primary chain: ${topChain}.`;
    }

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt: `Summarize this tipping agent activity in one sentence: ${totalTips} tips sent, total ${totalAmount}, most used chain: ${topChain}. Be concise and professional.`,
        options: { temperature: 0.3, num_predict: 60 },
      });
      return response.response.trim();
    } catch {
      return `Processed ${totalTips} tips totaling ${totalAmount}. Primary chain: ${topChain}.`;
    }
  }
}
