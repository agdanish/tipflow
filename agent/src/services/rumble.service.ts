// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent
// Rumble Integration Service — Creator tipping ecosystem for Rumble platform

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUMBLE_FILE = join(__dirname, '..', '..', '.rumble-creators.json');

// === Types ===

export interface Creator {
  id: string;
  name: string;
  channelUrl: string;
  walletAddress: string;
  categories: string[];
  totalTipsReceived: number;
  totalTipAmount: number;
  subscriberCount: number;
  registeredAt: string;
}

export interface WatchSession {
  id: string;
  userId: string;
  creatorId: string;
  videoId: string;
  watchPercent: number;
  timestamp: string;
  autoTipTriggered: boolean;
}

export interface AutoTipRule {
  id: string;
  userId: string;
  minWatchPercent: number;
  tipAmount: number;
  maxTipsPerDay: number;
  enabledCategories: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AutoTipRecommendation {
  creatorId: string;
  creatorName: string;
  walletAddress: string;
  videoId: string;
  watchPercent: number;
  suggestedAmount: number;
  reason: string;
}

export interface TipPool {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  goalAmount: number;
  currentAmount: number;
  contributors: Array<{ contributor: string; amount: number; timestamp: string }>;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface EventTrigger {
  id: string;
  creatorId: string;
  event: 'new_video' | 'milestone' | 'live_start' | 'anniversary';
  tipAmount: number;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  creatorName: string;
  channelUrl: string;
  walletAddress: string;
  totalTips: number;
  totalAmount: number;
  categories: string[];
}

export interface CollabSplit {
  id: string;
  videoId: string;
  creators: Array<{ creatorId: string; creatorName: string; percentage: number; walletAddress: string }>;
  totalTipAmount: number;
  createdAt: string;
}

interface RumbleData {
  creators: Creator[];
  watchSessions: WatchSession[];
  autoTipRules: AutoTipRule[];
  tipPools: TipPool[];
  eventTriggers: EventTrigger[];
  collabSplits: CollabSplit[];
}

/**
 * RumbleService — Manages Rumble creator tipping ecosystem.
 * Provides watch-time auto-tipping, community pools, event triggers,
 * leaderboards, and collaboration splits.
 */
export class RumbleService {
  private creators: Map<string, Creator> = new Map();
  private watchSessions: WatchSession[] = [];
  private autoTipRules: Map<string, AutoTipRule[]> = new Map(); // userId -> rules
  private tipPools: Map<string, TipPool> = new Map();
  private eventTriggers: EventTrigger[] = [];
  private collabSplits: Map<string, CollabSplit> = new Map();

  constructor() {
    this.load();
  }

  // === Creator Management ===

  /** Register a new Rumble creator */
  registerCreator(name: string, channelUrl: string, walletAddress: string, categories: string[]): Creator {
    // Check for duplicate channel URL
    for (const c of this.creators.values()) {
      if (c.channelUrl === channelUrl) {
        c.name = name;
        c.walletAddress = walletAddress;
        c.categories = categories;
        this.save();
        logger.info('Creator updated', { id: c.id, name });
        return c;
      }
    }

    const creator: Creator = {
      id: uuidv4(),
      name,
      channelUrl,
      walletAddress,
      categories,
      totalTipsReceived: 0,
      totalTipAmount: 0,
      subscriberCount: 0,
      registeredAt: new Date().toISOString(),
    };

    this.creators.set(creator.id, creator);
    this.save();
    logger.info('Creator registered', { id: creator.id, name, channelUrl });
    return creator;
  }

  /** Get a creator by ID */
  getCreator(id: string): Creator | undefined {
    return this.creators.get(id);
  }

  /** List all registered creators */
  listCreators(): Creator[] {
    return Array.from(this.creators.values()).sort((a, b) => b.totalTipAmount - a.totalTipAmount);
  }

  // === Watch-Time Auto-Tip ===

  /** Record a watch session for a user watching a creator's video */
  recordWatchTime(creatorId: string, videoId: string, watchPercent: number, userId: string): WatchSession {
    const creator = this.creators.get(creatorId);
    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    // Check if auto-tip should trigger
    const rules = this.autoTipRules.get(userId) ?? [];
    let autoTipTriggered = false;

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (watchPercent < rule.minWatchPercent) continue;

      // Check category filter
      if (rule.enabledCategories.length > 0) {
        const hasCategory = creator.categories.some((cat) => rule.enabledCategories.includes(cat));
        if (!hasCategory) continue;
      }

      // Check daily tip limit
      const today = new Date().toISOString().slice(0, 10);
      const todayTips = this.watchSessions.filter(
        (s) => s.userId === userId && s.autoTipTriggered && s.timestamp.startsWith(today),
      ).length;

      if (todayTips >= rule.maxTipsPerDay) continue;

      autoTipTriggered = true;
      break;
    }

    const session: WatchSession = {
      id: uuidv4(),
      userId,
      creatorId,
      videoId,
      watchPercent,
      timestamp: new Date().toISOString(),
      autoTipTriggered,
    };

    this.watchSessions.push(session);

    // Keep only last 1000 sessions
    if (this.watchSessions.length > 1000) {
      this.watchSessions = this.watchSessions.slice(-1000);
    }

    this.save();
    logger.info('Watch session recorded', { creatorId, videoId, watchPercent, autoTipTriggered });
    return session;
  }

  /** Get auto-tip recommendations for a user based on their watch history */
  getAutoTipRecommendations(userId: string): AutoTipRecommendation[] {
    const rules = this.autoTipRules.get(userId) ?? [];
    if (rules.length === 0) return [];

    const recommendations: AutoTipRecommendation[] = [];

    // Find sessions that qualify for auto-tip but haven't been tipped yet
    const recentSessions = this.watchSessions
      .filter((s) => s.userId === userId && !s.autoTipTriggered)
      .slice(-50); // Last 50 sessions

    for (const session of recentSessions) {
      const creator = this.creators.get(session.creatorId);
      if (!creator) continue;

      for (const rule of rules) {
        if (!rule.enabled) continue;
        if (session.watchPercent < rule.minWatchPercent) continue;

        if (rule.enabledCategories.length > 0) {
          const hasCategory = creator.categories.some((cat) => rule.enabledCategories.includes(cat));
          if (!hasCategory) continue;
        }

        recommendations.push({
          creatorId: creator.id,
          creatorName: creator.name,
          walletAddress: creator.walletAddress,
          videoId: session.videoId,
          watchPercent: session.watchPercent,
          suggestedAmount: rule.tipAmount,
          reason: `Watched ${session.watchPercent}% of video (rule: tip when >=${rule.minWatchPercent}%)`,
        });
        break; // One recommendation per session
      }
    }

    return recommendations;
  }

  /** Set auto-tip rules for a user */
  setAutoTipRules(userId: string, rules: Array<Omit<AutoTipRule, 'id' | 'userId' | 'createdAt'>>): void {
    const fullRules: AutoTipRule[] = rules.map((r) => ({
      id: uuidv4(),
      userId,
      minWatchPercent: r.minWatchPercent,
      tipAmount: r.tipAmount,
      maxTipsPerDay: r.maxTipsPerDay,
      enabledCategories: r.enabledCategories,
      enabled: r.enabled,
      createdAt: new Date().toISOString(),
    }));

    this.autoTipRules.set(userId, fullRules);
    this.save();
    logger.info('Auto-tip rules set', { userId, ruleCount: fullRules.length });
  }

  /** Get auto-tip rules for a user */
  getAutoTipRules(userId: string): AutoTipRule[] {
    return this.autoTipRules.get(userId) ?? [];
  }

  // === Community Pools ===

  /** Create a community tip pool for a creator */
  createTipPool(creatorId: string, goalAmount: number, title: string, deadline?: string): TipPool {
    const creator = this.creators.get(creatorId);
    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    const pool: TipPool = {
      id: uuidv4(),
      creatorId,
      creatorName: creator.name,
      title,
      goalAmount,
      currentAmount: 0,
      contributors: [],
      deadline,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tipPools.set(pool.id, pool);
    this.save();
    logger.info('Tip pool created', { poolId: pool.id, creatorId, goalAmount, title });
    return pool;
  }

  /** Contribute to a community tip pool */
  contributeToPool(poolId: string, amount: number, contributor: string): void {
    const pool = this.tipPools.get(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }
    if (pool.completed) {
      throw new Error('Pool has already reached its goal');
    }
    if (pool.deadline && new Date(pool.deadline) < new Date()) {
      throw new Error('Pool deadline has passed');
    }

    pool.contributors.push({
      contributor,
      amount,
      timestamp: new Date().toISOString(),
    });
    pool.currentAmount += amount;

    if (pool.currentAmount >= pool.goalAmount) {
      pool.completed = true;
      logger.info('Tip pool goal reached!', { poolId, creatorId: pool.creatorId });
    }

    // Update creator stats
    const creator = this.creators.get(pool.creatorId);
    if (creator) {
      creator.totalTipsReceived++;
      creator.totalTipAmount += amount;
    }

    this.save();
    logger.info('Pool contribution', { poolId, amount, contributor, newTotal: pool.currentAmount });
  }

  /** Get all active (non-completed) pools */
  getActivePools(): TipPool[] {
    return Array.from(this.tipPools.values())
      .filter((p) => !p.completed)
      .sort((a, b) => b.currentAmount / b.goalAmount - a.currentAmount / a.goalAmount);
  }

  /** Get all pools including completed */
  getAllPools(): TipPool[] {
    return Array.from(this.tipPools.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // === Event Triggers ===

  /** Register an event trigger for a creator */
  registerEventTrigger(
    creatorId: string,
    event: 'new_video' | 'milestone' | 'live_start' | 'anniversary',
    tipAmount: number,
  ): EventTrigger {
    const creator = this.creators.get(creatorId);
    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    const trigger: EventTrigger = {
      id: uuidv4(),
      creatorId,
      event,
      tipAmount,
      enabled: true,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.eventTriggers.push(trigger);
    this.save();
    logger.info('Event trigger registered', { triggerId: trigger.id, creatorId, event, tipAmount });
    return trigger;
  }

  /** Process an event and return matching trigger if found */
  processEvent(creatorId: string, event: string, metadata?: Record<string, unknown>): EventTrigger | undefined {
    const trigger = this.eventTriggers.find(
      (t) => t.creatorId === creatorId && t.event === event && t.enabled,
    );

    if (!trigger) return undefined;

    trigger.lastTriggered = new Date().toISOString();
    trigger.triggerCount++;

    // Update creator stats
    const creator = this.creators.get(creatorId);
    if (creator) {
      creator.totalTipsReceived++;
      creator.totalTipAmount += trigger.tipAmount;
    }

    this.save();
    logger.info('Event trigger fired', {
      triggerId: trigger.id,
      creatorId,
      event,
      tipAmount: trigger.tipAmount,
      metadata,
    });
    return trigger;
  }

  /** Get all event triggers */
  getEventTriggers(): EventTrigger[] {
    return [...this.eventTriggers];
  }

  // === Leaderboard ===

  /** Get creator leaderboard sorted by total tip amount */
  getCreatorLeaderboard(timeframe?: 'day' | 'week' | 'month' | 'all'): LeaderboardEntry[] {
    const creators = Array.from(this.creators.values());

    // For simplicity, the leaderboard uses cumulative stats stored on creators.
    // A production system would filter by timeframe from transaction history.
    // The timeframe parameter is accepted for API compatibility (future enhancement).
    void timeframe;

    const sorted = creators.sort((a, b) => b.totalTipAmount - a.totalTipAmount);

    return sorted.map((c, index) => ({
      rank: index + 1,
      creatorId: c.id,
      creatorName: c.name,
      channelUrl: c.channelUrl,
      walletAddress: c.walletAddress,
      totalTips: c.totalTipsReceived,
      totalAmount: c.totalTipAmount,
      categories: c.categories,
    }));
  }

  // === Collab Splits ===

  /** Create a collaboration split for a video with multiple creators */
  createCollabSplit(videoId: string, creators: Array<{ creatorId: string; percentage: number }>): CollabSplit {
    // Validate percentages sum to 100
    const total = creators.reduce((sum, c) => sum + c.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Split percentages must sum to 100, got ${total}`);
    }

    // Validate all creators exist
    const splitCreators = creators.map((c) => {
      const creator = this.creators.get(c.creatorId);
      if (!creator) {
        throw new Error(`Creator not found: ${c.creatorId}`);
      }
      return {
        creatorId: c.creatorId,
        creatorName: creator.name,
        percentage: c.percentage,
        walletAddress: creator.walletAddress,
      };
    });

    const split: CollabSplit = {
      id: uuidv4(),
      videoId,
      creators: splitCreators,
      totalTipAmount: 0,
      createdAt: new Date().toISOString(),
    };

    this.collabSplits.set(split.id, split);
    this.save();
    logger.info('Collab split created', { splitId: split.id, videoId, creatorCount: creators.length });
    return split;
  }

  /** Get all collab splits */
  getCollabSplits(): CollabSplit[] {
    return Array.from(this.collabSplits.values());
  }

  // === Engagement Score Algorithm (CORE INNOVATION) ===
  //
  // This is TipFlow's key differentiator: instead of flat-rate tipping,
  // the agent calculates a dynamic "engagement score" that determines
  // how much to tip. Higher engagement = higher tip. This creates an
  // economic feedback loop:
  //   Better content → More engagement → Higher tips → Creator incentive
  //
  // The algorithm considers:
  //   1. Watch completion (0-100%)  → weighted 40%
  //   2. Rewatch count              → weighted 20%
  //   3. Session frequency          → weighted 15%
  //   4. Creator loyalty (history)  → weighted 15%
  //   5. Content category premium   → weighted 10%

  /**
   * Calculate engagement score for a user-creator relationship.
   * Returns a score from 0.0 to 1.0 that scales the tip amount.
   */
  calculateEngagementScore(userId: string, creatorId: string): {
    score: number;
    breakdown: {
      watchCompletion: number;
      rewatchBonus: number;
      frequency: number;
      loyalty: number;
      categoryPremium: number;
    };
    suggestedMultiplier: number;
    reasoning: string;
  } {
    const sessions = this.watchSessions.filter(
      (s) => s.userId === userId && s.creatorId === creatorId,
    );

    if (sessions.length === 0) {
      return {
        score: 0,
        breakdown: { watchCompletion: 0, rewatchBonus: 0, frequency: 0, loyalty: 0, categoryPremium: 0 },
        suggestedMultiplier: 0,
        reasoning: 'No watch history with this creator',
      };
    }

    // 1. Watch completion — average watch % across all sessions (0-1)
    const avgWatch = sessions.reduce((sum, s) => sum + s.watchPercent, 0) / sessions.length / 100;
    const watchCompletion = Math.min(1, avgWatch); // Cap at 1.0

    // 2. Rewatch bonus — videos watched more than once show high engagement
    const videoIds = sessions.map((s) => s.videoId);
    const uniqueVideos = new Set(videoIds).size;
    const rewatchRatio = uniqueVideos > 0 ? (sessions.length - uniqueVideos) / sessions.length : 0;
    const rewatchBonus = Math.min(1, rewatchRatio * 2); // Double weight for rewatches

    // 3. Frequency — how often they watch this creator (sessions per week)
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(
      (s) => now - new Date(s.timestamp).getTime() < weekMs,
    );
    const frequency = Math.min(1, recentSessions.length / 10); // 10+ per week = max

    // 4. Loyalty — how long they've been watching this creator
    const firstWatch = new Date(sessions[0].timestamp).getTime();
    const daysFollowing = (now - firstWatch) / (24 * 60 * 60 * 1000);
    const loyalty = Math.min(1, daysFollowing / 30); // 30+ days = max loyalty

    // 5. Category premium — certain content categories get bonus
    const creator = this.creators.get(creatorId);
    const premiumCategories = ['education', 'news', 'technology', 'science'];
    const hasPremium = creator?.categories.some((c) =>
      premiumCategories.includes(c.toLowerCase()),
    ) ?? false;
    const categoryPremium = hasPremium ? 1.0 : 0.5;

    // Weighted score
    const score =
      watchCompletion * 0.40 +
      rewatchBonus * 0.20 +
      frequency * 0.15 +
      loyalty * 0.15 +
      categoryPremium * 0.10;

    // Suggested tip multiplier: 0.5x to 3.0x base amount
    const suggestedMultiplier = 0.5 + score * 2.5;

    // Build reasoning string
    const parts: string[] = [];
    if (watchCompletion > 0.8) parts.push('consistently completes videos');
    else if (watchCompletion > 0.5) parts.push('watches most of each video');
    if (rewatchBonus > 0.3) parts.push('rewatches content (high interest)');
    if (frequency > 0.5) parts.push('watches frequently this week');
    if (loyalty > 0.5) parts.push(`loyal viewer for ${Math.round(daysFollowing)}+ days`);
    if (hasPremium) parts.push('premium content category');

    const reasoning = parts.length > 0
      ? `Engagement: ${parts.join(', ')}. Score: ${(score * 100).toFixed(0)}% → ${suggestedMultiplier.toFixed(1)}x multiplier`
      : `Low engagement (${(score * 100).toFixed(0)}%). Suggest base rate tip.`;

    return {
      score: Math.round(score * 1000) / 1000,
      breakdown: {
        watchCompletion: Math.round(watchCompletion * 100) / 100,
        rewatchBonus: Math.round(rewatchBonus * 100) / 100,
        frequency: Math.round(frequency * 100) / 100,
        loyalty: Math.round(loyalty * 100) / 100,
        categoryPremium: Math.round(categoryPremium * 100) / 100,
      },
      suggestedMultiplier: Math.round(suggestedMultiplier * 100) / 100,
      reasoning,
    };
  }

  /**
   * Get engagement-weighted tip recommendations.
   * Unlike flat auto-tip rules, this dynamically adjusts tip amounts
   * based on how engaged the viewer is with each creator.
   */
  getEngagementWeightedRecommendations(userId: string, baseTipAmount = 0.01): Array<{
    creatorId: string;
    creatorName: string;
    walletAddress: string;
    engagementScore: number;
    multiplier: number;
    adjustedAmount: number;
    reasoning: string;
  }> {
    const rules = this.autoTipRules.get(userId) ?? [];
    if (rules.length === 0) return [];

    const recommendations: Array<{
      creatorId: string;
      creatorName: string;
      walletAddress: string;
      engagementScore: number;
      multiplier: number;
      adjustedAmount: number;
      reasoning: string;
    }> = [];

    // Get unique creators the user has watched
    const watchedCreatorIds = new Set(
      this.watchSessions.filter((s) => s.userId === userId).map((s) => s.creatorId),
    );

    for (const creatorId of watchedCreatorIds) {
      const creator = this.creators.get(creatorId);
      if (!creator) continue;

      const engagement = this.calculateEngagementScore(userId, creatorId);
      if (engagement.score < 0.1) continue; // Skip very low engagement

      const adjustedAmount = Math.round(baseTipAmount * engagement.suggestedMultiplier * 1e6) / 1e6;

      recommendations.push({
        creatorId,
        creatorName: creator.name,
        walletAddress: creator.walletAddress,
        engagementScore: engagement.score,
        multiplier: engagement.suggestedMultiplier,
        adjustedAmount,
        reasoning: engagement.reasoning,
      });
    }

    // Sort by engagement score (highest first)
    return recommendations.sort((a, b) => b.engagementScore - a.engagementScore);
  }

  // === Persistence ===

  /** Load data from disk */
  private load(): void {
    try {
      if (existsSync(RUMBLE_FILE)) {
        const raw = JSON.parse(readFileSync(RUMBLE_FILE, 'utf-8')) as RumbleData;

        if (raw.creators) {
          for (const c of raw.creators) {
            this.creators.set(c.id, c);
          }
        }
        if (raw.watchSessions) {
          this.watchSessions = raw.watchSessions;
        }
        if (raw.autoTipRules) {
          // Group rules by userId
          for (const rule of raw.autoTipRules) {
            const existing = this.autoTipRules.get(rule.userId) ?? [];
            existing.push(rule);
            this.autoTipRules.set(rule.userId, existing);
          }
        }
        if (raw.tipPools) {
          for (const p of raw.tipPools) {
            this.tipPools.set(p.id, p);
          }
        }
        if (raw.eventTriggers) {
          this.eventTriggers = raw.eventTriggers;
        }
        if (raw.collabSplits) {
          for (const s of raw.collabSplits) {
            this.collabSplits.set(s.id, s);
          }
        }

        logger.info(`Loaded Rumble data: ${this.creators.size} creators, ${this.tipPools.size} pools`);
      }
    } catch (err) {
      logger.warn('Failed to load Rumble data file', { error: String(err) });
    }
  }

  /** Persist data to disk */
  private save(): void {
    try {
      const data: RumbleData = {
        creators: Array.from(this.creators.values()),
        watchSessions: this.watchSessions,
        autoTipRules: Array.from(this.autoTipRules.values()).flat(),
        tipPools: Array.from(this.tipPools.values()),
        eventTriggers: this.eventTriggers,
        collabSplits: Array.from(this.collabSplits.values()),
      };
      writeFileSync(RUMBLE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Failed to save Rumble data file', { error: String(err) });
    }
  }
}
