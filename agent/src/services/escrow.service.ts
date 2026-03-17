// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

// ── Types ──────────────────────────────────────────────────────

export interface EscrowTip {
  id: string;
  /** Who's sending the tip */
  sender: string;
  /** Intended recipient */
  recipient: string;
  /** Amount in token units */
  amount: string;
  /** Token type */
  token: string;
  /** Chain */
  chainId: string;
  /** Current escrow status */
  status: 'held' | 'released' | 'refunded' | 'expired' | 'disputed';
  /** When the escrow was created */
  createdAt: string;
  /** When the tip was released to recipient */
  releasedAt?: string;
  /** When the escrow expires (auto-release after this) */
  expiresAt: string;
  /** Optional message */
  memo?: string;
  /** Transaction hash if released */
  txHash?: string;
  /** Reason for dispute/refund */
  reason?: string;
  /** Release condition */
  releaseCondition: 'manual' | 'auto_after_24h' | 'creator_confirm' | 'watch_time';
  /** Auto-release threshold in hours */
  autoReleaseHours: number;
}

export interface EscrowStats {
  totalEscrowed: number;
  totalReleased: number;
  totalRefunded: number;
  activeCount: number;
  avgHoldTime: number; // hours
  disputeRate: number; // percentage
}

// ── Service ────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ESCROW_FILE = join(__dirname, '..', '..', '.escrow-tips.json');

/**
 * EscrowService — Tip Escrow Protocol
 *
 * Holds tips in a virtual escrow until release conditions are met:
 * - Manual: Sender explicitly releases
 * - Auto after 24h: Auto-releases after hold period
 * - Creator confirm: Released when creator acknowledges
 * - Watch time: Released when viewer watches X more minutes
 *
 * This protects both tippers (can dispute/refund) and creators
 * (guaranteed payment once conditions met). Demonstrates
 * responsible autonomous agent design for the hackathon.
 */
export class EscrowService {
  private escrows: EscrowTip[] = [];
  private counter = 0;

  constructor() {
    this.load();
    // Start auto-release checker
    setInterval(() => this.processAutoReleases(), 30_000);
    logger.info('Escrow service initialized', { active: this.getActiveCount() });
  }

  // ── Core Operations ──────────────────────────────────────────

  /**
   * Create a new escrowed tip
   */
  createEscrow(params: {
    sender: string;
    recipient: string;
    amount: string;
    token: string;
    chainId: string;
    memo?: string;
    releaseCondition?: EscrowTip['releaseCondition'];
    autoReleaseHours?: number;
  }): EscrowTip {
    const now = new Date();
    const autoReleaseHours = params.autoReleaseHours ?? 24;
    const expiresAt = new Date(now.getTime() + autoReleaseHours * 60 * 60 * 1000);

    const escrow: EscrowTip = {
      id: `escrow_${++this.counter}_${Date.now()}`,
      sender: params.sender,
      recipient: params.recipient,
      amount: params.amount,
      token: params.token,
      chainId: params.chainId,
      status: 'held',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      memo: params.memo,
      releaseCondition: params.releaseCondition ?? 'auto_after_24h',
      autoReleaseHours,
    };

    this.escrows.push(escrow);
    this.save();
    logger.info('Escrow created', { id: escrow.id, amount: escrow.amount, condition: escrow.releaseCondition });
    return escrow;
  }

  /**
   * Release an escrowed tip to the recipient
   */
  releaseEscrow(escrowId: string, txHash?: string): EscrowTip | undefined {
    const escrow = this.escrows.find(e => e.id === escrowId);
    if (!escrow || escrow.status !== 'held') return undefined;

    escrow.status = 'released';
    escrow.releasedAt = new Date().toISOString();
    if (txHash) escrow.txHash = txHash;
    this.save();
    logger.info('Escrow released', { id: escrowId, txHash });
    return escrow;
  }

  /**
   * Refund an escrowed tip back to the sender
   */
  refundEscrow(escrowId: string, reason?: string): EscrowTip | undefined {
    const escrow = this.escrows.find(e => e.id === escrowId);
    if (!escrow || escrow.status !== 'held') return undefined;

    escrow.status = 'refunded';
    escrow.releasedAt = new Date().toISOString();
    escrow.reason = reason ?? 'Sender requested refund';
    this.save();
    logger.info('Escrow refunded', { id: escrowId, reason: escrow.reason });
    return escrow;
  }

  /**
   * Dispute an escrowed tip
   */
  disputeEscrow(escrowId: string, reason: string): EscrowTip | undefined {
    const escrow = this.escrows.find(e => e.id === escrowId);
    if (!escrow || escrow.status !== 'held') return undefined;

    escrow.status = 'disputed';
    escrow.reason = reason;
    this.save();
    logger.info('Escrow disputed', { id: escrowId, reason });
    return escrow;
  }

  // ── Queries ──────────────────────────────────────────────────

  getEscrow(id: string): EscrowTip | undefined {
    return this.escrows.find(e => e.id === id);
  }

  getActiveEscrows(): EscrowTip[] {
    return this.escrows.filter(e => e.status === 'held');
  }

  getAllEscrows(): EscrowTip[] {
    return [...this.escrows].reverse();
  }

  getEscrowsByRecipient(recipient: string): EscrowTip[] {
    return this.escrows.filter(e => e.recipient === recipient);
  }

  getActiveCount(): number {
    return this.escrows.filter(e => e.status === 'held').length;
  }

  /**
   * Get comprehensive escrow statistics
   */
  getStats(): EscrowStats {
    const released = this.escrows.filter(e => e.status === 'released');
    const refunded = this.escrows.filter(e => e.status === 'refunded');
    const disputed = this.escrows.filter(e => e.status === 'disputed');
    const active = this.escrows.filter(e => e.status === 'held');

    // Calculate average hold time for released tips
    let totalHoldHours = 0;
    for (const e of released) {
      if (e.releasedAt) {
        const holdMs = new Date(e.releasedAt).getTime() - new Date(e.createdAt).getTime();
        totalHoldHours += holdMs / (1000 * 60 * 60);
      }
    }

    return {
      totalEscrowed: this.escrows.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      totalReleased: released.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      totalRefunded: refunded.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      activeCount: active.length,
      avgHoldTime: released.length > 0 ? totalHoldHours / released.length : 0,
      disputeRate: this.escrows.length > 0 ? (disputed.length / this.escrows.length) * 100 : 0,
    };
  }

  // ── Auto-release ─────────────────────────────────────────────

  /**
   * Process auto-releases for expired escrows
   */
  private processAutoReleases(): void {
    const now = Date.now();
    let released = 0;

    for (const escrow of this.escrows) {
      if (escrow.status !== 'held') continue;
      if (escrow.releaseCondition !== 'auto_after_24h') continue;
      if (new Date(escrow.expiresAt).getTime() > now) continue;

      escrow.status = 'released';
      escrow.releasedAt = new Date().toISOString();
      released++;
      logger.info('Escrow auto-released (expired)', { id: escrow.id });
    }

    if (released > 0) {
      this.save();
      logger.info(`Auto-released ${released} expired escrow(s)`);
    }
  }

  // ── Persistence ──────────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(ESCROW_FILE)) {
        const data = JSON.parse(readFileSync(ESCROW_FILE, 'utf-8'));
        this.escrows = data.escrows ?? [];
        this.counter = data.counter ?? 0;
      }
    } catch {
      logger.warn('Could not load escrow data, starting fresh');
    }
  }

  private save(): void {
    try {
      writeFileSync(ESCROW_FILE, JSON.stringify({ escrows: this.escrows, counter: this.counter }, null, 2));
    } catch (err) {
      logger.error('Failed to save escrow data', { error: String(err) });
    }
  }
}
