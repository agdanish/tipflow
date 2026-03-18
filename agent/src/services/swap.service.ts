/**
 * Swap Service — Token swaps via WDK Velora Protocol
 *
 * Uses @tetherto/wdk-protocol-swap-velora-evm for DEX aggregation.
 * Enables swapping between any EVM tokens (ETH ↔ USDT, etc.)
 * on Sepolia testnet.
 *
 * Part of TipFlow's DeFi infrastructure layer.
 */

import { logger } from '../utils/logger.js';
import type { WalletService } from './wallet.service.js';

interface SwapQuote {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  estimatedGas: string;
  priceImpact: string;
  route: string[];
  timestamp: string;
}

interface SwapResult {
  id: string;
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'completed' | 'failed';
  timestamp: string;
}

export class SwapService {
  private walletService: WalletService;
  private protocol: any = null;
  private available = false;
  private history: SwapResult[] = [];

  constructor(walletService: WalletService) {
    this.walletService = walletService;
  }

  /** Initialize Velora swap protocol with WDK account */
  async initialize(): Promise<void> {
    try {
      const { default: VeloraProtocol } = await import('@tetherto/wdk-protocol-swap-velora-evm');
      const account = await this.walletService.getWdkAccount('ethereum-sepolia');
      this.protocol = new VeloraProtocol(account);
      this.available = true;
      logger.info('Swap service initialized (Velora DEX aggregator)');
    } catch (err) {
      logger.warn('Swap service unavailable (non-critical)', { error: String(err) });
    }
  }

  /** Check if swap service is available */
  isAvailable(): boolean {
    return this.available;
  }

  /** Get a swap quote */
  async getQuote(fromToken: string, toToken: string, amount: string): Promise<SwapQuote> {
    if (!this.available || !this.protocol) {
      throw new Error('Swap service not available');
    }

    try {
      const quote = await this.protocol.quoteSwap({
        fromToken,
        toToken,
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
      });

      const result: SwapQuote = {
        id: `swap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: (Number(quote.toAmount ?? quote.destAmount ?? 0n) / 1e18).toFixed(6),
        exchangeRate: quote.rate?.toString() ?? 'N/A',
        estimatedGas: (Number(quote.gasCost ?? 0n) / 1e18).toFixed(8),
        priceImpact: (quote.priceImpact ?? 0).toFixed(2) + '%',
        route: quote.route ?? [fromToken, toToken],
        timestamp: new Date().toISOString(),
      };

      logger.info('Swap quote generated', { id: result.id, from: fromToken, to: toToken, amount });
      return result;
    } catch (err) {
      logger.error('Swap quote failed', { error: String(err), fromToken, toToken, amount });
      throw new Error(`Swap quote failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Execute a token swap */
  async executeSwap(fromToken: string, toToken: string, amount: string, slippage: number = 1): Promise<SwapResult> {
    if (!this.available || !this.protocol) {
      throw new Error('Swap service not available');
    }

    const id = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const result = await this.protocol.swap({
        fromToken,
        toToken,
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
        slippage: slippage * 100, // basis points
      });

      const swapResult: SwapResult = {
        id,
        hash: result.hash ?? result.transactionHash ?? '',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: (Number(result.toAmount ?? result.destAmount ?? 0n) / 1e18).toFixed(6),
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      this.history.push(swapResult);
      logger.info('Swap executed', { id, hash: swapResult.hash, from: fromToken, to: toToken });
      return swapResult;
    } catch (err) {
      const failedResult: SwapResult = {
        id,
        hash: '',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: '0',
        status: 'failed',
        timestamp: new Date().toISOString(),
      };
      this.history.push(failedResult);
      logger.error('Swap execution failed', { error: String(err) });
      throw new Error(`Swap failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Get swap history */
  getHistory(): SwapResult[] {
    return [...this.history].reverse();
  }

  /** Get service stats */
  getStats() {
    return {
      available: this.available,
      protocol: 'Velora DEX Aggregator',
      totalSwaps: this.history.length,
      successfulSwaps: this.history.filter(s => s.status === 'completed').length,
      failedSwaps: this.history.filter(s => s.status === 'failed').length,
    };
  }
}
