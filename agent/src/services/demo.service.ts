// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import type { TipHistoryEntry, ActivityEvent, ChainId, TokenType } from '../types/index.js';
import type { AutonomyPolicy } from './autonomy.service.js';

/**
 * DemoService — Seeds the system with realistic sample data
 * so judges see a rich, active dashboard immediately on startup.
 *
 * Only runs when DEMO_MODE=true in .env (default: true for hackathon).
 */
export class DemoService {

  /**
   * Seed sample Rumble creators (returns params for registerCreator)
   */
  getSampleCreators(): Array<{
    name: string;
    channelUrl: string;
    walletAddress: string;
    categories: string[];
  }> {
    return [
      {
        name: 'TechReviewer',
        channelUrl: 'https://rumble.com/c/TechReviewer',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68',
        categories: ['tech', 'reviews'],
      },
      {
        name: 'CryptoDaily',
        channelUrl: 'https://rumble.com/c/CryptoDaily',
        walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        categories: ['crypto', 'finance'],
      },
      {
        name: 'GameStreamPro',
        channelUrl: 'https://rumble.com/c/GameStreamPro',
        walletAddress: 'UQBanAkpRVoVeUHJVSLbaCjregNDAejcBdKl1VA3ujWMWpOv',
        categories: ['gaming', 'entertainment'],
      },
      {
        name: 'NewsAnalyst',
        channelUrl: 'https://rumble.com/c/NewsAnalyst',
        walletAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        categories: ['news', 'politics'],
      },
      {
        name: 'FitnessGuru',
        channelUrl: 'https://rumble.com/c/FitnessGuru',
        walletAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        categories: ['fitness', 'health'],
      },
    ];
  }

  /**
   * Seed sample tip history entries
   */
  getSampleTipHistory(): TipHistoryEntry[] {
    const chains: ChainId[] = ['ethereum-sepolia', 'ton-testnet', 'tron-nile'];
    const recipients = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68',
      '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      'UQBanAkpRVoVeUHJVSLbaCjregNDAejcBdKl1VA3ujWMWpOv',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    ];
    const amounts = ['0.001', '0.005', '0.01', '0.002', '0.003', '0.008', '0.004'];
    const fees = ['0.0001', '0.0002', '0.00015', '0.00008', '0.0003'];
    const memos = [
      'Great video on WDK!',
      'Love the crypto analysis',
      'Thanks for the tutorial',
      'Keep up the great content',
      'Auto-tip: high watch time',
      'Community pool contribution',
      'Weekly recurring tip',
    ];
    const reasonings = [
      'AI selected ethereum-sepolia for lowest fees',
      'Pattern-based: frequent tipping on this day',
      'TON testnet chosen for speed',
      'User preference for this chain',
      'Fee optimizer found best route',
      'Auto-tip triggered by watch time threshold',
      'Recurring schedule matched',
    ];

    const tips: TipHistoryEntry[] = [];
    for (let i = 0; i < 12; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const chain = chains[i % chains.length];
      const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      tips.push({
        id: `demo_tip_${i + 1}`,
        recipient: recipients[i % recipients.length],
        amount: amounts[i % amounts.length],
        token: 'usdt' as TokenType,
        chainId: chain,
        txHash,
        status: i < 11 ? 'confirmed' : 'failed',
        fee: fees[i % fees.length],
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        reasoning: reasonings[i % reasonings.length],
        memo: memos[i % memos.length],
      });
    }
    return tips;
  }

  /**
   * Seed sample activity feed entries
   */
  getSampleActivities(): Array<Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp: string }> {
    return [
      { type: 'tip_sent', message: 'Tipped CryptoDaily 0.005 USDT', detail: 'Ethereum Sepolia', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(Date.now() - 60000).toISOString() },
      { type: 'system', message: 'Autonomous decision loop active', detail: 'Monitoring 5 Rumble creators', timestamp: new Date(Date.now() - 120000).toISOString() },
      { type: 'tip_sent', message: 'Auto-tipped TechReviewer 0.003 USDT', detail: 'Watch time threshold reached (340 min)', chainId: 'ton-testnet' as ChainId, timestamp: new Date(Date.now() - 300000).toISOString() },
      { type: 'condition_triggered', message: 'Recurring tip executed', detail: 'Weekly tip to NewsAnalyst', chainId: 'tron-nile' as ChainId, timestamp: new Date(Date.now() - 600000).toISOString() },
      { type: 'system', message: 'WDK wallets initialized', detail: '3 chains: EVM + TON + TRON', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { type: 'system', message: 'Tip streaming session completed', detail: '120 micro-tips to GameStreamPro', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { type: 'system', message: 'Proof-of-Tip receipt verified', detail: 'WDK signature valid for tip #demo_tip_1', timestamp: new Date(Date.now() - 10800000).toISOString() },
    ];
  }

  /**
   * Seed sample autonomy policies
   */
  getSamplePolicies(): Array<Omit<AutonomyPolicy, 'id' | 'userId' | 'createdAt'>> {
    return [
      {
        name: 'Daily Budget Cap',
        type: 'budget' as const,
        enabled: true,
        rules: {
          maxDailyTotal: 0.05,
          maxPerTip: 0.01,
          requireConfirmationAbove: 0.005,
        },
      },
      {
        name: 'Trusted Creators Only',
        type: 'recipient_limit' as const,
        enabled: true,
        rules: {
          allowedRecipients: [
            '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68',
            '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
            'UQBanAkpRVoVeUHJVSLbaCjregNDAejcBdKl1VA3ujWMWpOv',
            '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          ],
        },
      },
      {
        name: 'Weekly Auto-Tip Schedule',
        type: 'recurring' as const,
        enabled: true,
        rules: {
          schedule: { dayOfWeek: [1, 3, 5], hour: 10 },
          maxPerTip: 0.003,
        },
      },
    ];
  }

  /**
   * Check if demo mode is enabled
   */
  isEnabled(): boolean {
    return process.env.DEMO_MODE !== 'false'; // Default: true for hackathon
  }
}
