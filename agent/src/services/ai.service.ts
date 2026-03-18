import { Ollama } from 'ollama';
import { logger } from '../utils/logger.js';
import type { ChainAnalysis, ChainId, ChatIntent, NLPTipParse } from '../types/index.js';

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

    const feeToTipRatios = analyses
      .filter((a) => a.available)
      .map((a) => `${a.chainName}: fee is ${((parseFloat(a.estimatedFee) / parseFloat(tipAmount)) * 100).toFixed(1)}% of tip`)
      .join(', ');

    const availableSorted = [...analyses].filter((a) => a.available).sort((a, b) => parseFloat(a.estimatedFee) - parseFloat(b.estimatedFee));
    const cheapest = availableSorted[0];
    const mostExpensive = availableSorted[availableSorted.length - 1];
    const savings = cheapest && mostExpensive && availableSorted.length > 1
      ? `Cheapest option saves ~$${(parseFloat(mostExpensive.estimatedFee) - parseFloat(cheapest.estimatedFee)).toFixed(6)} vs most expensive`
      : '';

    return `You are TipFlow, an autonomous AI tipping agent managing USDT tips for Rumble creators via Tether WDK.

TASK: Select the optimal blockchain for this tip and explain your reasoning.

TIP DETAILS:
- Amount: ${tipAmount} to ${recipient.slice(0, 10)}...${recipient.slice(-4)}
- Token: USDT (stablecoin)

CHAIN ANALYSIS:
${chainSummaries}

ECONOMIC CONTEXT:
- Fee-to-tip ratios: ${feeToTipRatios}
${savings ? `- ${savings}` : ''}
- Economic rule: gas should be <50% of tip amount for sound economics

DECISION FACTORS (weighted):
1. Cost efficiency (40%): minimize gas fees
2. Transaction speed (20%): faster confirmation is better
3. Balance adequacy (15%): don't drain the wallet
4. Historical reliability (15%): avoid chains with recent failures
5. Address compatibility (10%): recipient format must match chain

Provide a 2-3 sentence technical explanation starting with "Selected [chain] because...". Include specific numbers.`;
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
- recipient: the wallet address (0x... for EVM, UQ... or EQ... for TON, T... for Tron), empty string if not found
- amount: the numeric amount as a string, empty string if not found
- token: "usdt" if USDT/Tether is mentioned, otherwise "native"
- chain: "ethereum-sepolia" if ETH/Ethereum/Sepolia mentioned, "ton-testnet" if TON mentioned, "tron-nile" if Tron/TRX mentioned, null if not specified
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
    const token: 'native' | 'usdt' | 'usat' | 'xaut' = tokenRaw === 'usdt' ? 'usdt' : tokenRaw === 'usat' ? 'usat' : tokenRaw === 'xaut' || tokenRaw === 'gold' ? 'xaut' : 'native';
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
      chain: chain && (chain === 'ethereum-sepolia' || chain === 'ton-testnet' || chain === 'tron-nile') ? chain : undefined,
      message: message || undefined,
      confidence: Math.min(confidence, 100),
      rawInput: input,
    };
  }

  /** Rule-based regex fallback parser for common tip patterns */
  private regexParseTip(input: string): NLPTipParse {
    const lower = input.toLowerCase();

    // Extract recipient address: EVM (0x...), TON (UQ.../EQ...), or Tron (T...)
    const evmMatch = input.match(/\b(0x[a-fA-F0-9]{40})\b/);
    const tonMatch = input.match(/\b([UE]Q[a-zA-Z0-9_-]{46})\b/);
    const tronMatch = input.match(/\b(T[a-zA-Z0-9]{33})\b/);
    const recipient = evmMatch?.[1] ?? tonMatch?.[1] ?? tronMatch?.[1] ?? '';

    // Extract amount: number potentially with decimals, before or after token name
    // Patterns: "0.01 ETH", "send 5 USDT", "tip 0.001", "$10"
    let amount = '';
    let token: 'native' | 'usdt' | 'usat' | 'xaut' = 'native';

    // Pattern: "X XAUT" or "X xau₮" or "X gold" or "X tether gold"
    const xautNameMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:xaut|xau₮|xau|tether\s*gold|gold)/i);
    const xautNameBeforeMatch = input.match(/(?:xaut|xau₮|xau|tether\s*gold|gold)\s*(\d+(?:\.\d+)?)/i);

    // Pattern: "X USAT" or "X usa₮" — Tether's US dollar-backed stablecoin
    const usatNameMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:usat|usa₮)/i);
    const usatNameBeforeMatch = input.match(/(?:usat|usa₮)\s*(\d+(?:\.\d+)?)/i);

    // Pattern: "$X" or "X USDT" or "X usdt" or "X tether"
    const usdtAmountMatch = input.match(/\$\s*(\d+(?:\.\d+)?)/);
    const usdtNameMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:usdt|tether)/i);
    const usdtNameBeforeMatch = input.match(/(?:usdt|tether)\s*(\d+(?:\.\d+)?)/i);

    if (xautNameMatch) {
      amount = xautNameMatch[1];
      token = 'xaut';
    } else if (xautNameBeforeMatch) {
      amount = xautNameBeforeMatch[1];
      token = 'xaut';
    } else if (usatNameMatch) {
      amount = usatNameMatch[1];
      token = 'usat';
    } else if (usatNameBeforeMatch) {
      amount = usatNameBeforeMatch[1];
      token = 'usat';
    } else if (usdtAmountMatch) {
      amount = usdtAmountMatch[1];
      token = 'usdt';
    } else if (usdtNameMatch) {
      amount = usdtNameMatch[1];
      token = 'usdt';
    } else if (usdtNameBeforeMatch) {
      amount = usdtNameBeforeMatch[1];
      token = 'usdt';
    } else {
      // Native token pattern: "X ETH", "X TON", "X TRX", "X eth", or just a number
      const nativeMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:eth|ton|trx|tron|ether|toncoin)?/i);
      if (nativeMatch) {
        amount = nativeMatch[1];
      }
    }

    // Detect chain from token mentions or explicit chain names
    let chain: string | undefined;
    if (tronMatch || /\b(?:tron|trx|nile)\b/i.test(lower)) {
      chain = 'tron-nile';
    } else if (tonMatch || /\bton\b/i.test(lower)) {
      chain = 'ton-testnet';
    } else if (evmMatch || /\b(?:eth|ethereum|sepolia|evm)\b/i.test(lower)) {
      chain = 'ethereum-sepolia';
    }
    // USDT/USAT/XAUT forces ethereum-sepolia (ERC-20 tokens)
    if (token === 'usdt' || token === 'usat' || token === 'xaut') {
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
    if (token === 'usdt' || token === 'usat' || token === 'xaut' || /\b(?:eth|ton)\b/i.test(lower)) confidence += 10;

    return {
      recipient,
      amount,
      token,
      chain: chain as 'ethereum-sepolia' | 'ton-testnet' | 'tron-nile' | undefined,
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

  /**
   * Detect the user's intent from a chat message.
   * Uses Ollama LLM when available, falls back to regex pattern matching.
   */
  async detectIntent(message: string): Promise<ChatIntent> {
    const trimmed = message.trim().toLowerCase();
    if (!trimmed) {
      return { intent: 'unknown', params: {} };
    }

    // Try LLM-based intent detection first
    if (this.available) {
      try {
        return await this.llmDetectIntent(message.trim());
      } catch (err) {
        logger.warn('LLM intent detection failed, using regex fallback', { error: String(err) });
      }
    }

    // Regex fallback
    return this.regexDetectIntent(trimmed, message.trim());
  }

  /** LLM-powered intent detection */
  private async llmDetectIntent(input: string): Promise<ChatIntent> {
    const prompt = `You are a chat intent classifier for TipFlow, a crypto tipping bot. Classify the user's message into one of these intents:
- tip: user wants to send/tip crypto (extract "recipient" address and "amount" if present)
- balance: user wants to check wallet balances
- fees: user wants to compare fees or know costs
- address: user wants to see wallet addresses
- help: user asks what you can do or needs help
- history: user wants to see past tips/transactions
- unknown: doesn't match any intent

Return ONLY a JSON object: {"intent": "...", "params": {"key": "value"}}

Message: "${input}"

JSON:`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      options: { temperature: 0.1, num_predict: 100 },
      format: 'json',
    });

    const raw = response.response.trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { intent: 'unknown', params: {} };
      parsed = JSON.parse(jsonMatch[0]);
    }

    const intent = String(parsed.intent ?? 'unknown');
    const validIntents = ['tip', 'balance', 'fees', 'address', 'help', 'history', 'unknown'] as const;
    const validIntent = validIntents.includes(intent as typeof validIntents[number])
      ? (intent as ChatIntent['intent'])
      : 'unknown';

    const params: Record<string, string> = {};
    if (parsed.params && typeof parsed.params === 'object') {
      for (const [k, v] of Object.entries(parsed.params as Record<string, unknown>)) {
        if (typeof v === 'string') params[k] = v;
      }
    }

    return { intent: validIntent, params };
  }

  /** Rule-based regex intent detection */
  private regexDetectIntent(lower: string, original: string): ChatIntent {
    // Help intent
    if (/\b(?:help|what can you do|commands|how to|how do i|capabilities|guide)\b/.test(lower)) {
      return { intent: 'help', params: {} };
    }

    // Tip intent
    if (/\b(?:send|tip|transfer|pay|give)\b/.test(lower)) {
      const params: Record<string, string> = {};
      // Extract amount
      const amountMatch = original.match(/(\d+(?:\.\d+)?)\s*(?:eth|ton|usdt|tether)?/i);
      if (amountMatch) params.amount = amountMatch[1];
      // Extract address
      const evmMatch = original.match(/\b(0x[a-fA-F0-9]{40})\b/);
      const tonMatch = original.match(/\b([UE]Q[a-zA-Z0-9_-]{46})\b/);
      if (evmMatch) params.recipient = evmMatch[1];
      else if (tonMatch) params.recipient = tonMatch[1];
      // Token
      if (/\busdt|tether|\$\s*\d/i.test(lower)) params.token = 'usdt';
      return { intent: 'tip', params };
    }

    // Balance intent
    if (/\b(?:balance|how much|funds|wallet balance|my wallet)\b/.test(lower)) {
      return { intent: 'balance', params: {} };
    }

    // Fees intent
    if (/\b(?:fee|fees|cost|gas|cheapest|compare|estimate)\b/.test(lower)) {
      return { intent: 'fees', params: {} };
    }

    // Address intent
    if (/\b(?:address|addresses|wallet address|my address|receive)\b/.test(lower)) {
      return { intent: 'address', params: {} };
    }

    // History intent
    if (/\b(?:history|past tips|transactions|recent tips|previous)\b/.test(lower)) {
      return { intent: 'history', params: {} };
    }

    return { intent: 'unknown', params: {} };
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
