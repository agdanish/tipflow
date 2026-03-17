// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { logger } from '../utils/logger.js';

// ── Types ──────────────────────────────────────────────────────

export interface ChainFeeData {
  chainId: string;
  chainName: string;
  /** Estimated fee in USD equivalent */
  feeUsd: number;
  /** Fee in native token */
  feeNative: number;
  /** Native token symbol */
  nativeToken: string;
  /** Gas price or fee rate */
  gasPrice: number;
  /** Current congestion level */
  congestion: 'low' | 'medium' | 'high';
  /** Estimated confirmation time in seconds */
  confirmationTime: number;
  /** Last updated */
  updatedAt: string;
}

export interface FeeComparison {
  amount: string;
  token: string;
  chains: ChainFeeData[];
  recommendation: {
    bestChain: string;
    reason: string;
    savings: string;
    savingsPercent: number;
  };
  /** Overall fee optimization score (0-100) */
  optimizationScore: number;
  timestamp: string;
}

export interface FeeHistory {
  chainId: string;
  fees: { timestamp: string; feeUsd: number }[];
  avgFee: number;
  minFee: number;
  maxFee: number;
  trend: 'rising' | 'falling' | 'stable';
}

// ── Service ────────────────────────────────────────────────────

/**
 * FeeArbitrageService — Cross-Chain Fee Optimization
 *
 * Monitors fees across all 3 chains (EVM, TON, TRON) in real-time
 * and recommends the optimal chain for each tip amount.
 *
 * Features:
 * - Live fee comparison across chains
 * - Historical fee tracking with trend analysis
 * - Optimal timing recommendations
 * - Fee savings calculator
 * - Congestion-aware routing
 */
export class FeeArbitrageService {
  private feeHistory = new Map<string, { timestamp: string; feeUsd: number }[]>();
  private lastFees = new Map<string, ChainFeeData>();
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize with baseline fees
    this.updateFees();
    // Update fees every 30 seconds
    this.updateInterval = setInterval(() => this.updateFees(), 30_000);
    logger.info('Fee arbitrage service initialized');
  }

  // ── Core Operations ──────────────────────────────────────────

  /**
   * Compare fees across all chains for a given tip amount
   */
  compareFees(amount: string, token: string = 'usdt'): FeeComparison {
    const numAmount = parseFloat(amount) || 0.001;
    const chains = this.getCurrentFees();

    // Find cheapest chain
    const sorted = [...chains].sort((a, b) => a.feeUsd - b.feeUsd);
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];

    const savings = mostExpensive.feeUsd - cheapest.feeUsd;
    const savingsPercent = mostExpensive.feeUsd > 0
      ? Math.round((savings / mostExpensive.feeUsd) * 100)
      : 0;

    // Calculate optimization score
    const feeRatio = cheapest.feeUsd / numAmount;
    const optimizationScore = Math.max(0, Math.min(100, Math.round(100 - feeRatio * 1000)));

    let reason = `${cheapest.chainName} has the lowest fees`;
    if (cheapest.congestion === 'low') {
      reason += ' and low congestion';
    }
    if (savingsPercent > 30) {
      reason += ` — saves ${savingsPercent}% vs ${mostExpensive.chainName}`;
    }

    return {
      amount,
      token,
      chains,
      recommendation: {
        bestChain: cheapest.chainId,
        reason,
        savings: savings.toFixed(6),
        savingsPercent,
      },
      optimizationScore,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current fees for all chains
   */
  getCurrentFees(): ChainFeeData[] {
    return Array.from(this.lastFees.values());
  }

  /**
   * Get fee history and trends for a specific chain
   */
  getChainHistory(chainId: string): FeeHistory | undefined {
    const history = this.feeHistory.get(chainId);
    if (!history || history.length === 0) return undefined;

    const fees = history.map(h => h.feeUsd);
    const avg = fees.reduce((s, f) => s + f, 0) / fees.length;
    const min = Math.min(...fees);
    const max = Math.max(...fees);

    // Determine trend from last 5 data points
    let trend: FeeHistory['trend'] = 'stable';
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const firstAvg = (recent[0].feeUsd + recent[1].feeUsd) / 2;
      const lastAvg = (recent[3].feeUsd + recent[4].feeUsd) / 2;
      if (lastAvg > firstAvg * 1.1) trend = 'rising';
      else if (lastAvg < firstAvg * 0.9) trend = 'falling';
    }

    return {
      chainId,
      fees: history.slice(-50), // Last 50 data points
      avgFee: avg,
      minFee: min,
      maxFee: max,
      trend,
    };
  }

  /**
   * Get all chain histories for comparison
   */
  getAllHistory(): FeeHistory[] {
    const result: FeeHistory[] = [];
    for (const chainId of ['ethereum-sepolia', 'ton-testnet', 'tron-nile']) {
      const h = this.getChainHistory(chainId);
      if (h) result.push(h);
    }
    return result;
  }

  /**
   * Get optimal timing recommendation
   */
  getOptimalTiming(): { recommendation: string; currentStatus: string; chains: Record<string, string> } {
    const fees = this.getCurrentFees();
    const lowCongestion = fees.filter(f => f.congestion === 'low');

    let recommendation: string;
    if (lowCongestion.length === 3) {
      recommendation = 'All chains have low congestion — great time to tip!';
    } else if (lowCongestion.length >= 1) {
      recommendation = `Best to use ${lowCongestion.map(f => f.chainName).join(' or ')} — lowest congestion right now.`;
    } else {
      recommendation = 'All chains are congested. Consider waiting 10-15 minutes for lower fees.';
    }

    const chains: Record<string, string> = {};
    for (const fee of fees) {
      chains[fee.chainId] = `${fee.congestion} congestion, ~${fee.confirmationTime}s confirmation, $${fee.feeUsd.toFixed(6)} fee`;
    }

    return {
      recommendation,
      currentStatus: lowCongestion.length >= 2 ? 'optimal' : lowCongestion.length >= 1 ? 'acceptable' : 'wait',
      chains,
    };
  }

  // ── Fee Updates ──────────────────────────────────────────────

  /**
   * Update fee data for all chains.
   * In production, this would call real RPC endpoints.
   * For the hackathon, we use realistic simulated data based on actual
   * testnet fee structures.
   */
  private updateFees(): void {
    const now = new Date().toISOString();

    // Ethereum Sepolia — highest fees, ~12s blocks
    const ethGasPrice = 20 + Math.random() * 30; // 20-50 gwei (realistic Sepolia range)
    const ethFeeUsd = (ethGasPrice * 21000 * 1e-9) * (2000 + Math.random() * 500); // ETH price ~$2000-2500
    const ethCongestion = ethGasPrice > 40 ? 'high' : ethGasPrice > 28 ? 'medium' : 'low';

    this.setFee({
      chainId: 'ethereum-sepolia',
      chainName: 'Ethereum Sepolia',
      feeUsd: ethFeeUsd,
      feeNative: ethGasPrice * 21000 * 1e-9,
      nativeToken: 'ETH',
      gasPrice: ethGasPrice,
      congestion: ethCongestion as ChainFeeData['congestion'],
      confirmationTime: 12,
      updatedAt: now,
    });

    // TON Testnet — very low fees, ~5s blocks
    const tonFee = 0.003 + Math.random() * 0.005; // 0.003-0.008 TON
    const tonFeeUsd = tonFee * (2 + Math.random()); // TON price ~$2-3
    const tonCongestion = tonFee > 0.006 ? 'medium' : 'low';

    this.setFee({
      chainId: 'ton-testnet',
      chainName: 'TON Testnet',
      feeUsd: tonFeeUsd,
      feeNative: tonFee,
      nativeToken: 'TON',
      gasPrice: tonFee * 1e9,
      congestion: tonCongestion as ChainFeeData['congestion'],
      confirmationTime: 5,
      updatedAt: now,
    });

    // TRON Nile — low fees, ~3s blocks
    const tronBandwidth = 200 + Math.random() * 100; // bandwidth points
    const tronFeeUsd = (tronBandwidth / 100000) * (0.12 + Math.random() * 0.03); // TRX price ~$0.12-0.15
    const tronCongestion = tronBandwidth > 270 ? 'medium' : 'low';

    this.setFee({
      chainId: 'tron-nile',
      chainName: 'TRON Nile',
      feeUsd: tronFeeUsd,
      feeNative: tronBandwidth / 100000,
      nativeToken: 'TRX',
      gasPrice: tronBandwidth,
      congestion: tronCongestion as ChainFeeData['congestion'],
      confirmationTime: 3,
      updatedAt: now,
    });
  }

  private setFee(fee: ChainFeeData): void {
    this.lastFees.set(fee.chainId, fee);

    // Track history
    const history = this.feeHistory.get(fee.chainId) ?? [];
    history.push({ timestamp: fee.updatedAt, feeUsd: fee.feeUsd });
    // Keep last 200 data points
    if (history.length > 200) history.splice(0, history.length - 200);
    this.feeHistory.set(fee.chainId, history);
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
