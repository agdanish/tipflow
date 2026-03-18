// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import type { TipHistoryEntry, ActivityEvent, ChainId, TokenType } from '../types/index.js';
import type { AutonomyPolicy } from './autonomy.service.js';

/**
 * DemoService — Seeds the system with RICH, realistic sample data
 * so judges see a populated, active dashboard immediately on startup.
 *
 * Only runs when DEMO_MODE=true in .env (default: true for hackathon).
 */
export class DemoService {

  /** 15 realistic Rumble creators across diverse categories */
  getSampleCreators(): Array<{
    name: string;
    channelUrl: string;
    walletAddress: string;
    categories: string[];
  }> {
    return [
      { name: 'TechReviewer', channelUrl: 'https://rumble.com/c/TechReviewer', walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68', categories: ['tech', 'reviews'] },
      { name: 'CryptoDaily', channelUrl: 'https://rumble.com/c/CryptoDaily', walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', categories: ['crypto', 'finance'] },
      { name: 'GameStreamPro', channelUrl: 'https://rumble.com/c/GameStreamPro', walletAddress: 'UQBanAkpRVoVeUHJVSLbaCjregNDAejcBdKl1VA3ujWMWpOv', categories: ['gaming', 'entertainment'] },
      { name: 'NewsAnalyst', channelUrl: 'https://rumble.com/c/NewsAnalyst', walletAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', categories: ['news', 'politics'] },
      { name: 'FitnessGuru', channelUrl: 'https://rumble.com/c/FitnessGuru', walletAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', categories: ['fitness', 'health'] },
      { name: 'CodingMaster', channelUrl: 'https://rumble.com/c/CodingMaster', walletAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', categories: ['tech', 'education'] },
      { name: 'MusicMaven', channelUrl: 'https://rumble.com/c/MusicMaven', walletAddress: '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF', categories: ['music', 'entertainment'] },
      { name: 'TravelVlogger', channelUrl: 'https://rumble.com/c/TravelVlogger', walletAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', categories: ['travel', 'lifestyle'] },
      { name: 'ChefSpecial', channelUrl: 'https://rumble.com/c/ChefSpecial', walletAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', categories: ['cooking', 'food'] },
      { name: 'ScienceExplained', channelUrl: 'https://rumble.com/c/ScienceExplained', walletAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA', categories: ['science', 'education'] },
      { name: 'IndieFilmmaker', channelUrl: 'https://rumble.com/c/IndieFilmmaker', walletAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', categories: ['film', 'art'] },
      { name: 'DebateKing', channelUrl: 'https://rumble.com/c/DebateKing', walletAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', categories: ['politics', 'debate'] },
      { name: 'PetLovers', channelUrl: 'https://rumble.com/c/PetLovers', walletAddress: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', categories: ['animals', 'lifestyle'] },
      { name: 'BlockchainDev', channelUrl: 'https://rumble.com/c/BlockchainDev', walletAddress: '0x3845badAde8e6dFF049820680d1F14bD3903a5d0', categories: ['crypto', 'tech', 'education'] },
      { name: 'ComedyClub', channelUrl: 'https://rumble.com/c/ComedyClub', walletAddress: '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD', categories: ['comedy', 'entertainment'] },
    ];
  }

  /** 50 rich tip history entries across all chains and tokens */
  getSampleTipHistory(): TipHistoryEntry[] {
    const creators = this.getSampleCreators();
    const chains: ChainId[] = ['ethereum-sepolia', 'ton-testnet', 'tron-nile'];
    const tokens: TokenType[] = ['usdt', 'native', 'usdt', 'usdt', 'native'];
    const amounts = ['0.001', '0.005', '0.01', '0.002', '0.003', '0.008', '0.004', '0.015', '0.02', '0.006', '0.012', '0.007', '0.025', '0.009', '0.0015'];
    const fees = ['0.0001', '0.0002', '0.00015', '0.00008', '0.0003', '0.00005', '0.00012', '0.00025'];
    const memos = [
      'Great video on WDK!', 'Love the crypto analysis', 'Thanks for the tutorial',
      'Keep up the great content', 'Auto-tip: high watch time', 'Community pool contribution',
      'Weekly recurring tip', 'Exceptional live stream!', 'Your breakdown was spot-on',
      'Supporting your mission', 'This content changed my perspective', 'Quality over quantity — respect',
      'Engagement-scored tip', 'Top fan reward', 'Consistency bonus from TipFlow agent',
      'Discovered through AI recommendation', 'Viral tip propagation', 'Revenue smoothing contribution',
      'Watch-time milestone reached', 'Weekly supporter tip',
    ];
    const reasonings = [
      'AI selected ethereum-sepolia for lowest fees ($0.0001)',
      'Pattern-based: frequent tipping to this creator on weekdays',
      'TON testnet chosen — 4x faster confirmation than EVM',
      'Fee optimizer found 60% savings on TRON Nile',
      'Multi-agent consensus: 3/3 approved (TipExecutor, Guardian, TreasuryOptimizer)',
      'Auto-tip triggered by watch time threshold (>80%)',
      'Engagement score 87/100 — auto-tip policy matched',
      'Recurring schedule: weekly tip to trusted creator',
      'Creator discovery: undervalued creator with high engagement',
      'Predictive tipping: time pattern matched (10am weekday)',
      'Revenue smoothing: creator income below threshold',
      'Tip propagation: 3x amplifier from community pool',
      'Risk assessment: LOW (12/100) — safe to auto-execute',
      'DCA installment #3 of 10 — 0.005 USDT per interval',
      'Fee arbitrage: TRON 85% cheaper than Ethereum today',
    ];

    const tips: TipHistoryEntry[] = [];
    for (let i = 0; i < 50; i++) {
      const hoursAgo = Math.floor(Math.random() * 720); // up to 30 days
      const chain = chains[i % chains.length];
      const creator = creators[i % creators.length];
      const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const status: 'confirmed' | 'failed' = i < 48 ? 'confirmed' : 'failed';
      tips.push({
        id: `demo_tip_${i + 1}`,
        recipient: creator.walletAddress,
        amount: amounts[i % amounts.length],
        token: tokens[i % tokens.length],
        chainId: chain,
        txHash,
        status,
        fee: fees[i % fees.length],
        createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
        reasoning: reasonings[i % reasonings.length],
        memo: memos[i % memos.length],
      });
    }
    // Sort by recency
    return tips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** 25 rich activity feed entries showing the full agent capability spectrum */
  getSampleActivities(): Array<Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp: string }> {
    const now = Date.now();
    return [
      { type: 'tip_sent', message: 'Tipped CryptoDaily 0.005 USDT', detail: 'Ethereum Sepolia · Fee: $0.0001 · Watch time: 94%', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(now - 30_000).toISOString() },
      { type: 'system', message: 'Multi-agent consensus: APPROVED', detail: 'TipExecutor: approve (95%) · Guardian: approve (88%) · Treasury: approve (92%)', timestamp: new Date(now - 60_000).toISOString() },
      { type: 'tip_sent', message: 'Auto-tipped TechReviewer 0.003 USDT', detail: 'Watch time 340 min · Engagement score: 87/100 · TON Testnet', chainId: 'ton-testnet' as ChainId, timestamp: new Date(now - 180_000).toISOString() },
      { type: 'system', message: 'Risk assessment completed', detail: 'Score: 12/100 (LOW) · All 8 factors within safe range', timestamp: new Date(now - 300_000).toISOString() },
      { type: 'condition_triggered', message: 'Engagement threshold reached', detail: 'CodingMaster engagement score 91/100 — auto-tip triggered', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(now - 420_000).toISOString() },
      { type: 'tip_sent', message: 'Tipped GameStreamPro 0.01 native', detail: 'TRON Nile · 85% cheaper than Ethereum · Live stream tip', chainId: 'tron-nile' as ChainId, timestamp: new Date(now - 600_000).toISOString() },
      { type: 'system', message: 'Fee arbitrage: TRON recommended', detail: 'ETH: $0.42 · TON: $0.08 · TRON: $0.002 · Savings: 99.5%', timestamp: new Date(now - 900_000).toISOString() },
      { type: 'system', message: 'Predictive tipping: 3 predictions generated', detail: 'time_pattern (85%) · recipient_affinity (78%) · streak (72%)', timestamp: new Date(now - 1_200_000).toISOString() },
      { type: 'tip_sent', message: 'DCA installment: 0.005 USDT to BlockchainDev', detail: 'Installment 3/10 · Next: in 24h · Total plan: 0.05 USDT', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(now - 1_800_000).toISOString() },
      { type: 'system', message: 'Creator discovery: 2 undervalued creators found', detail: 'ScienceExplained (score: 0.82) · IndieFilmmaker (score: 0.79)', timestamp: new Date(now - 2_400_000).toISOString() },
      { type: 'condition_triggered', message: 'Revenue smoothing activated', detail: 'MusicMaven income dropped 40% — reserve contribution sent', chainId: 'ton-testnet' as ChainId, timestamp: new Date(now - 3_000_000).toISOString() },
      { type: 'system', message: 'Proof-of-Engagement attestation created', detail: 'PoE #demo_poe_1 · Creator: CryptoDaily · Watch: 94% · Signed by agent', timestamp: new Date(now - 3_600_000).toISOString() },
      { type: 'tip_sent', message: 'Community pool tip: 0.008 USDT to NewsAnalyst', detail: 'Pool: "News Supporters" · 12 contributors · Auto-distributed', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(now - 5_400_000).toISOString() },
      { type: 'system', message: 'Treasury rebalanced', detail: '70% reserve · 20% yield (Aave V3: 4.2% APY) · 10% gas buffer', timestamp: new Date(now - 7_200_000).toISOString() },
      { type: 'tip_sent', message: 'Tip propagation wave: 5 creators reached', detail: 'Viral coefficient: 2.3x · Original: FitnessGuru · Wave depth: 2', chainId: 'tron-nile' as ChainId, timestamp: new Date(now - 10_800_000).toISOString() },
      { type: 'system', message: 'Tip streaming session completed', detail: '120 micro-tips to GameStreamPro · Total: 0.012 USDT · 2h duration', timestamp: new Date(now - 14_400_000).toISOString() },
      { type: 'system', message: 'Autonomous cycle #47 complete', detail: '3 tips evaluated · 2 approved · 1 deferred (high risk) · 0 vetoed', timestamp: new Date(now - 18_000_000).toISOString() },
      { type: 'condition_triggered', message: 'Milestone reached: 50 tips sent!', detail: 'Achievement unlocked: "Tip Master" · Total volume: 0.35 USDT', timestamp: new Date(now - 21_600_000).toISOString() },
      { type: 'system', message: 'x402 payment received', detail: 'Agent earned 0.001 USDT for /api/analytics endpoint access', timestamp: new Date(now - 28_800_000).toISOString() },
      { type: 'tip_sent', message: 'Escrow released: 0.015 USDT to ChefSpecial', detail: 'Condition met: 24h hold expired · Auto-release by escrow protocol', chainId: 'ethereum-sepolia' as ChainId, timestamp: new Date(now - 36_000_000).toISOString() },
      { type: 'system', message: 'Agent memory updated', detail: 'Stored: "CryptoDaily prefers TON chain" · Category: preference', timestamp: new Date(now - 43_200_000).toISOString() },
      { type: 'system', message: 'USDT0 bridge quote obtained', detail: 'Ethereum → Arbitrum: 10 USDT · Fee: 0.0012 ETH · LayerZero OFT', timestamp: new Date(now - 50_400_000).toISOString() },
      { type: 'system', message: 'Aave V3 yield check', detail: 'Current USDT APY: 4.2% · Position: 0.5 USDT supplied · Earnings: 0.0001', timestamp: new Date(now - 57_600_000).toISOString() },
      { type: 'system', message: 'WDK wallets initialized', detail: '7 chains: EVM + TON + TRON + BTC + Solana + Plasma + Stable', timestamp: new Date(now - 86_400_000).toISOString() },
      { type: 'system', message: 'TipFlow Agent v1.0.0 started', detail: '43 services · 234 endpoints · 12 innovations · Agent identity generated', timestamp: new Date(now - 86_400_000 * 2).toISOString() },
    ];
  }

  /** 6 autonomy policies covering all policy types */
  getSamplePolicies(): Array<Omit<AutonomyPolicy, 'id' | 'userId' | 'createdAt'>> {
    return [
      {
        name: 'Daily Budget Cap',
        type: 'budget' as const,
        enabled: true,
        rules: { maxDailyTotal: 0.05, maxPerTip: 0.01, requireConfirmationAbove: 0.005 },
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
            '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
          ],
        },
      },
      {
        name: 'Weekly Auto-Tip Schedule',
        type: 'recurring' as const,
        enabled: true,
        rules: { schedule: { dayOfWeek: [1, 3, 5], hour: 10 }, maxPerTip: 0.003 },
      },
      {
        name: 'High-Value Approval Required',
        type: 'budget' as const,
        enabled: true,
        rules: { maxPerTip: 0.05, requireConfirmationAbove: 0.02 },
      },
      {
        name: 'Engagement-Based Auto-Tip',
        type: 'budget' as const,
        enabled: true,
        rules: { maxPerTip: 0.005, maxDailyTotal: 0.03, requireConfirmationAbove: 0.004 },
      },
      {
        name: 'Gas Cost Guardian',
        type: 'budget' as const,
        enabled: true,
        rules: { maxPerTip: 0.01, requireConfirmationAbove: 0.008 },
      },
    ];
  }

  /** Check if demo mode is enabled */
  isEnabled(): boolean {
    return process.env.DEMO_MODE !== 'false'; // Default: true for hackathon
  }
}
