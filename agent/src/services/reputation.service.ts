// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — Social Reputation Engine

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import type { ChainId } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '..', '..', '.reputation.json');

/** Reputation tier levels */
export type ReputationTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/** Creator reputation profile */
export interface CreatorReputation {
  address: string;
  name?: string;
  score: number;          // 0-1000
  rawScore: number;       // before decay
  tier: ReputationTier;
  totalReceived: number;
  tipCount: number;
  uniqueTippers: Set<string> extends never ? number : number; // serialized as number
  uniqueTippersList: string[];
  avgTipAmount: number;
  firstTipAt: string;
  lastTipAt: string;
  scoreHistory: Array<{ date: string; score: number }>;
  chains: ChainId[];
}

/** Serialized form for persistence (Sets don't serialize) */
interface CreatorReputationData {
  address: string;
  name?: string;
  rawScore: number;
  totalReceived: number;
  tipCount: number;
  uniqueTippersList: string[];
  avgTipAmount: number;
  firstTipAt: string;
  lastTipAt: string;
  scoreHistory: Array<{ date: string; score: number }>;
  chains: ChainId[];
}

/** Recommendation for who to tip */
export interface ReputationRecommendation {
  address: string;
  name?: string;
  score: number;
  tier: ReputationTier;
  reason: string;
  suggestedAmount: string;
  confidence: number;     // 0-100
}

/** Scoring configuration */
export interface ReputationConfig {
  volumeWeight: number;
  frequencyWeight: number;
  uniqueTippersWeight: number;
  recencyWeight: number;
  decayHalfLifeDays: number;
  tierThresholds: Record<ReputationTier, number>;
}

const DEFAULT_CONFIG: ReputationConfig = {
  volumeWeight: 0.3,
  frequencyWeight: 0.25,
  uniqueTippersWeight: 0.25,
  recencyWeight: 0.2,
  decayHalfLifeDays: 14,
  tierThresholds: {
    bronze: 0,
    silver: 201,
    gold: 401,
    platinum: 601,
    diamond: 801,
  },
};

export class ReputationService {
  private reputations = new Map<string, CreatorReputationData>();
  private config: ReputationConfig = { ...DEFAULT_CONFIG };

  constructor() {
    this.load();
  }

  /** Record a tip to update recipient's reputation */
  recordTip(from: string, to: string, amount: number, chainId: ChainId): void {
    let data = this.reputations.get(to);
    const now = new Date().toISOString();

    if (!data) {
      data = {
        address: to,
        rawScore: 0,
        totalReceived: 0,
        tipCount: 0,
        uniqueTippersList: [],
        avgTipAmount: 0,
        firstTipAt: now,
        lastTipAt: now,
        scoreHistory: [],
        chains: [],
      };
    }

    // Update stats
    data.tipCount += 1;
    data.totalReceived += amount;
    data.avgTipAmount = data.totalReceived / data.tipCount;
    data.lastTipAt = now;

    if (!data.uniqueTippersList.includes(from)) {
      data.uniqueTippersList.push(from);
    }

    if (!data.chains.includes(chainId)) {
      data.chains.push(chainId);
    }

    // Recalculate raw score
    data.rawScore = this.calculateRawScore(data);

    // Add to score history (daily granularity)
    const today = now.slice(0, 10);
    const lastEntry = data.scoreHistory[data.scoreHistory.length - 1];
    if (!lastEntry || lastEntry.date !== today) {
      data.scoreHistory.push({ date: today, score: data.rawScore });
      // Keep last 90 days
      if (data.scoreHistory.length > 90) {
        data.scoreHistory = data.scoreHistory.slice(-90);
      }
    } else {
      lastEntry.score = data.rawScore;
    }

    this.reputations.set(to, data);
    this.persist();

    logger.info('Reputation updated', {
      address: to,
      rawScore: data.rawScore,
      tipCount: data.tipCount,
      tier: this.getTier(this.applyDecay(data)),
    });
  }

  /** Calculate raw score (before decay) */
  private calculateRawScore(data: CreatorReputationData): number {
    // Normalize each dimension to 0-1000 using logarithmic scaling
    const volumeScore = Math.min(1000, Math.log10(data.totalReceived + 1) * 300);
    const frequencyScore = Math.min(1000, Math.log10(data.tipCount + 1) * 400);
    const uniqueScore = Math.min(1000, data.uniqueTippersList.length * 200);

    // Recency: full score if tipped today, decays over days
    const daysSinceLast = (Date.now() - new Date(data.lastTipAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1000 - daysSinceLast * 50);

    return Math.round(
      volumeScore * this.config.volumeWeight +
      frequencyScore * this.config.frequencyWeight +
      uniqueScore * this.config.uniqueTippersWeight +
      recencyScore * this.config.recencyWeight
    );
  }

  /** Apply time-decay to a score */
  private applyDecay(data: CreatorReputationData): number {
    const daysSinceLast = (Date.now() - new Date(data.lastTipAt).getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.5, daysSinceLast / this.config.decayHalfLifeDays);
    return Math.round(data.rawScore * decayFactor);
  }

  /** Get tier from score */
  private getTier(score: number): ReputationTier {
    if (score >= this.config.tierThresholds.diamond) return 'diamond';
    if (score >= this.config.tierThresholds.platinum) return 'platinum';
    if (score >= this.config.tierThresholds.gold) return 'gold';
    if (score >= this.config.tierThresholds.silver) return 'silver';
    return 'bronze';
  }

  /** Get reputation for a specific address */
  getReputation(address: string): CreatorReputation | null {
    const data = this.reputations.get(address);
    if (!data) return null;

    const score = this.applyDecay(data);
    return {
      address: data.address,
      name: data.name,
      score,
      rawScore: data.rawScore,
      tier: this.getTier(score),
      totalReceived: data.totalReceived,
      tipCount: data.tipCount,
      uniqueTippers: data.uniqueTippersList.length,
      uniqueTippersList: data.uniqueTippersList,
      avgTipAmount: data.avgTipAmount,
      firstTipAt: data.firstTipAt,
      lastTipAt: data.lastTipAt,
      scoreHistory: data.scoreHistory,
      chains: data.chains,
    };
  }

  /** Get leaderboard sorted by decayed score */
  getLeaderboard(limit = 20): CreatorReputation[] {
    const all: CreatorReputation[] = [];
    for (const data of this.reputations.values()) {
      const score = this.applyDecay(data);
      all.push({
        address: data.address,
        name: data.name,
        score,
        rawScore: data.rawScore,
        tier: this.getTier(score),
        totalReceived: data.totalReceived,
        tipCount: data.tipCount,
        uniqueTippers: data.uniqueTippersList.length,
        uniqueTippersList: data.uniqueTippersList,
        avgTipAmount: data.avgTipAmount,
        firstTipAt: data.firstTipAt,
        lastTipAt: data.lastTipAt,
        scoreHistory: data.scoreHistory,
        chains: data.chains,
      });
    }
    return all.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /** Get AI-powered recommendations for who to tip */
  getRecommendations(budget: number, count = 5): ReputationRecommendation[] {
    const leaderboard = this.getLeaderboard(50);
    if (leaderboard.length === 0) return [];

    const recommendations: ReputationRecommendation[] = [];
    const perRecipient = budget / Math.min(count, leaderboard.length);

    for (const creator of leaderboard.slice(0, count)) {
      // Weight suggested amount by score
      const scoreRatio = creator.score / 1000;
      const suggestedAmount = (perRecipient * (0.5 + scoreRatio * 0.5)).toFixed(4);

      let reason: string;
      if (creator.tier === 'diamond') {
        reason = 'Top-tier creator with exceptional engagement';
      } else if (creator.tier === 'platinum') {
        reason = 'High-reputation creator with consistent tipping activity';
      } else if (creator.tier === 'gold') {
        reason = 'Growing creator with strong community support';
      } else if (creator.uniqueTippers > 3) {
        reason = 'Popular creator with diverse supporter base';
      } else if (creator.tipCount > 5) {
        reason = 'Active creator with frequent tipping interactions';
      } else {
        reason = 'Rising star — early supporter bonus opportunity';
      }

      recommendations.push({
        address: creator.address,
        name: creator.name,
        score: creator.score,
        tier: creator.tier,
        reason,
        suggestedAmount,
        confidence: Math.min(95, Math.round(50 + creator.score / 20)),
      });
    }

    return recommendations;
  }

  /** Get current config */
  getConfig(): ReputationConfig {
    return { ...this.config };
  }

  /** Update scoring config */
  updateConfig(updates: Partial<ReputationConfig>): ReputationConfig {
    Object.assign(this.config, updates);
    logger.info('Reputation config updated', { config: this.config });
    return this.config;
  }

  /** Get total number of tracked creators */
  getCreatorCount(): number {
    return this.reputations.size;
  }

  /** Load from disk */
  private load(): void {
    try {
      if (existsSync(DATA_FILE)) {
        const raw = readFileSync(DATA_FILE, 'utf-8');
        const entries: CreatorReputationData[] = JSON.parse(raw);
        for (const entry of entries) {
          this.reputations.set(entry.address, entry);
        }
        logger.info(`Loaded ${this.reputations.size} creator reputations`);
      }
    } catch (err) {
      logger.warn('Failed to load reputation data', { error: String(err) });
    }
  }

  /** Persist to disk */
  private persist(): void {
    try {
      const entries = Array.from(this.reputations.values());
      writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Failed to persist reputation data', { error: String(err) });
    }
  }
}
