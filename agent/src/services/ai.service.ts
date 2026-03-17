import { Ollama } from 'ollama';
import { logger } from '../utils/logger.js';
import type { ChainAnalysis, ChainId, NLPTipParse } from '../types/index.js';

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

  /**
   * Parse a natural language tip command into structured data.
   * Uses Ollama LLM when available, falls back to rule-based regex parsing.
   */
  async parseNaturalLanguageTip(input: string): Promise<NLPTipParse> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { recipient: '', amount: '', token: 'native', confidence: 0, rawInput: input };
    }

    // Try LLM parsing first
    if (this.available) {
      try {
        const result = await this.llmParseTip(trimmed);
        if (result.confidence > 0) return result;
      } catch (err) {
        logger.warn('LLM tip parsing failed, using fallback', { error: String(err) });
      }
    }

    // Fallback to rule-based parsing
    return this.regexParseTip(trimmed);
  }

  /** Parse tip using Ollama LLM */
  private async llmParseTip(input: string): Promise<NLPTipParse> {
    const prompt = `You are a tip command parser. Extract tip details from the user's natural language input.
Return ONLY a JSON object with these fields (no markdown, no explanation):
- recipient: the wallet address (0x... for EVM, UQ... or EQ... for TON), empty string if not found
- amount: the numeric amount as a string, empty string if not found
- token: "usdt" if USDT/Tether is mentioned, otherwise "native"
- chain: "ethereum-sepolia" if ETH/Ethereum/Sepolia mentioned, "ton-testnet" if TON mentioned, null if not specified
- message: any tip message or reason (e.g. "great work"), null if none

Input: "${input}"

JSON:`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      options: { temperature: 0.1, num_predict: 150 },
      format: 'json',
    });

    const raw = response.response.trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try extracting JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('LLM returned non-JSON response for tip parse');
        return { recipient: '', amount: '', token: 'native', confidence: 0, rawInput: input };
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const recipient = String(parsed.recipient ?? '').trim();
    const amount = String(parsed.amount ?? '').trim();
    const tokenRaw = String(parsed.token ?? 'native').toLowerCase();
    const token: 'native' | 'usdt' = tokenRaw === 'usdt' ? 'usdt' : 'native';
    const chain = parsed.chain ? String(parsed.chain) : undefined;
    const message = parsed.message ? String(parsed.message) : undefined;

    // Calculate confidence based on what was extracted
    let confidence = 0;
    if (recipient && this.isValidAddress(recipient)) confidence += 40;
    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) confidence += 40;
    if (token) confidence += 10;
    if (confidence > 0) confidence += 10; // bonus for LLM parse succeeding at all

    return {
      recipient,
      amount,
      token,
      chain: chain && (chain === 'ethereum-sepolia' || chain === 'ton-testnet') ? chain : undefined,
      message: message || undefined,
      confidence: Math.min(confidence, 100),
      rawInput: input,
    };
  }

  /** Rule-based regex fallback parser for common tip patterns */
  private regexParseTip(input: string): NLPTipParse {
    const lower = input.toLowerCase();

    // Extract recipient address: EVM (0x...) or TON (UQ.../EQ...)
    const evmMatch = input.match(/\b(0x[a-fA-F0-9]{40})\b/);
    const tonMatch = input.match(/\b([UE]Q[a-zA-Z0-9_-]{46})\b/);
    const recipient = evmMatch?.[1] ?? tonMatch?.[1] ?? '';

    // Extract amount: number potentially with decimals, before or after token name
    // Patterns: "0.01 ETH", "send 5 USDT", "tip 0.001", "$10"
    let amount = '';
    let token: 'native' | 'usdt' = 'native';

    // Pattern: "$X" or "X USDT" or "X usdt" or "X tether"
    const usdtAmountMatch = input.match(/\$\s*(\d+(?:\.\d+)?)/);
    const usdtNameMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:usdt|tether)/i);
    const usdtNameBeforeMatch = input.match(/(?:usdt|tether)\s*(\d+(?:\.\d+)?)/i);

    if (usdtAmountMatch) {
      amount = usdtAmountMatch[1];
      token = 'usdt';
    } else if (usdtNameMatch) {
      amount = usdtNameMatch[1];
      token = 'usdt';
    } else if (usdtNameBeforeMatch) {
      amount = usdtNameBeforeMatch[1];
      token = 'usdt';
    } else {
      // Native token pattern: "X ETH", "X TON", "X eth", or just a number
      const nativeMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:eth|ton|ether|toncoin)?/i);
      if (nativeMatch) {
        amount = nativeMatch[1];
      }
    }

    // Detect chain from token mentions or explicit chain names
    let chain: string | undefined;
    if (tonMatch || /\bton\b/i.test(lower)) {
      chain = 'ton-testnet';
    } else if (evmMatch || /\b(?:eth|ethereum|sepolia|evm)\b/i.test(lower)) {
      chain = 'ethereum-sepolia';
    }
    // USDT forces ethereum-sepolia
    if (token === 'usdt') {
      chain = 'ethereum-sepolia';
    }

    // Extract optional message: text after "for", "because", "msg:", "message:"
    let message: string | undefined;
    const msgMatch = input.match(/(?:for|because|msg:|message:)\s*["']?(.+?)["']?\s*$/i);
    if (msgMatch) {
      // Clean the message — remove the recipient address if it leaked in
      let msg = msgMatch[1].trim();
      if (evmMatch) msg = msg.replace(evmMatch[1], '').trim();
      if (tonMatch) msg = msg.replace(tonMatch[1], '').trim();
      if (msg.length > 0 && msg.length < 200) {
        message = msg;
      }
    }

    // Calculate confidence
    let confidence = 0;
    if (recipient && this.isValidAddress(recipient)) confidence += 40;
    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) confidence += 40;
    if (/\b(?:send|tip|transfer|pay)\b/i.test(lower)) confidence += 10;
    if (token === 'usdt' || /\b(?:eth|ton)\b/i.test(lower)) confidence += 10;

    return {
      recipient,
      amount,
      token,
      chain: chain as 'ethereum-sepolia' | 'ton-testnet' | undefined,
      message,
      confidence: Math.min(confidence, 100),
      rawInput: input,
    };
  }

  /** Validate an address format */
  private isValidAddress(addr: string): boolean {
    // EVM address
    if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return true;
    // TON address (UQ or EQ + 46 chars)
    if (/^[UE]Q[a-zA-Z0-9_-]{46}$/.test(addr)) return true;
    return false;
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
