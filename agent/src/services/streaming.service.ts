// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — Tip Streaming Protocol (Continuous Micro-Tipping)

import { randomUUID } from 'node:crypto';
import { logger } from '../utils/logger.js';
import type { WalletService } from './wallet.service.js';
import type { ChainId, TokenType } from '../types/index.js';

/** A live tip stream — continuous micro-tips at intervals */
export interface TipStream {
  id: string;
  recipient: string;
  microTipAmount: string;
  intervalMs: number;
  token: TokenType;
  chainId: ChainId;
  status: 'active' | 'paused' | 'stopped' | 'error';
  totalStreamed: string;
  totalTransactions: number;
  totalFees: string;
  startedAt: string;
  stoppedAt?: string;
  lastTipAt?: string;
  lastTxHash?: string;
  maxBudget?: string;
  elapsedSeconds: number;
  error?: string;
}

/** Configuration to start a tip stream */
export interface StreamConfig {
  recipient: string;
  amountPerTick: string;        // amount per micro-tip (e.g., "0.0001")
  intervalSeconds: number;      // seconds between ticks (default: 30)
  token: TokenType;
  chainId: ChainId;
  maxBudget?: string;           // optional total budget cap
}

/** Stream statistics */
export interface StreamStats {
  activeStreams: number;
  totalStreamsCreated: number;
  totalAmountStreamed: string;
  totalTransactionsSent: number;
}

export class StreamingService {
  private wallet: WalletService;
  private streams = new Map<string, TipStream>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private history: TipStream[] = [];
  private onActivity?: (msg: string, detail?: string, chainId?: ChainId) => void;

  constructor(walletService: WalletService) {
    this.wallet = walletService;
  }

  /** Set activity callback for event notifications */
  setActivityCallback(cb: (msg: string, detail?: string, chainId?: ChainId) => void): void {
    this.onActivity = cb;
  }

  /** Start a new tip stream — sends micro-tips at intervals */
  startStream(config: StreamConfig): TipStream {
    const id = randomUUID();
    const intervalMs = (config.intervalSeconds || 30) * 1000;

    const stream: TipStream = {
      id,
      recipient: config.recipient,
      microTipAmount: config.amountPerTick,
      intervalMs,
      token: config.token,
      chainId: config.chainId,
      status: 'active',
      totalStreamed: '0',
      totalTransactions: 0,
      totalFees: '0',
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      maxBudget: config.maxBudget,
    };

    this.streams.set(id, stream);

    // Start the interval timer
    const timer = setInterval(() => {
      this.tick(id).catch((err) => {
        logger.error('Stream tick failed', { streamId: id, error: String(err) });
      });
    }, intervalMs);

    this.timers.set(id, timer);

    logger.info('Tip stream started', {
      streamId: id,
      recipient: config.recipient,
      amountPerTick: config.amountPerTick,
      intervalSeconds: config.intervalSeconds,
    });

    this.onActivity?.(
      `Tip stream started: ${config.amountPerTick} ${config.token} every ${config.intervalSeconds}s to ${config.recipient.slice(0, 10)}...`,
      `Stream ${id.slice(0, 8)}`,
      config.chainId,
    );

    return stream;
  }

  /** Internal: execute one micro-tip tick */
  private async tick(streamId: string): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream || stream.status !== 'active') return;

    // Update elapsed time
    stream.elapsedSeconds = Math.floor(
      (Date.now() - new Date(stream.startedAt).getTime()) / 1000
    );

    // Check budget cap
    if (stream.maxBudget) {
      const total = parseFloat(stream.totalStreamed);
      const budget = parseFloat(stream.maxBudget);
      if (total >= budget) {
        logger.info('Stream budget reached', { streamId, total, budget });
        this.stopStream(streamId);
        this.onActivity?.(
          `Stream budget reached: ${stream.totalStreamed}/${stream.maxBudget} ${stream.token}`,
          `Stream ${streamId.slice(0, 8)} auto-stopped`,
          stream.chainId,
        );
        return;
      }
    }

    // Send the micro-tip
    try {
      const result = await this.wallet.sendTransaction(
        stream.chainId,
        stream.recipient,
        stream.microTipAmount,
      );

      // Update stream stats
      stream.totalTransactions += 1;
      stream.totalStreamed = (
        parseFloat(stream.totalStreamed) + parseFloat(stream.microTipAmount)
      ).toFixed(8);
      stream.totalFees = (
        parseFloat(stream.totalFees) + parseFloat(result.fee)
      ).toFixed(8);
      stream.lastTipAt = new Date().toISOString();
      stream.lastTxHash = result.hash;

      logger.info('Stream micro-tip sent', {
        streamId,
        txHash: result.hash,
        total: stream.totalStreamed,
        count: stream.totalTransactions,
      });

      this.onActivity?.(
        `Stream micro-tip #${stream.totalTransactions}: ${stream.microTipAmount} ${stream.token}`,
        `tx: ${result.hash.slice(0, 14)}... | total: ${stream.totalStreamed}`,
        stream.chainId,
      );
    } catch (err) {
      stream.error = String(err);
      logger.error('Stream micro-tip failed', { streamId, error: stream.error });

      // Don't stop on single failure — retry next tick
      this.onActivity?.(
        `Stream micro-tip failed (will retry): ${String(err).slice(0, 60)}`,
        `Stream ${streamId.slice(0, 8)}`,
        stream.chainId,
      );
    }
  }

  /** Pause a stream (keeps timer but skips ticks) */
  pauseStream(streamId: string): TipStream | null {
    const stream = this.streams.get(streamId);
    if (!stream || stream.status !== 'active') return null;

    stream.status = 'paused';
    const timer = this.timers.get(streamId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(streamId);
    }

    logger.info('Tip stream paused', { streamId });
    this.onActivity?.(`Tip stream paused after ${stream.totalTransactions} transactions`, `Total: ${stream.totalStreamed} ${stream.token}`, stream.chainId);
    return stream;
  }

  /** Resume a paused stream */
  resumeStream(streamId: string): TipStream | null {
    const stream = this.streams.get(streamId);
    if (!stream || stream.status !== 'paused') return null;

    stream.status = 'active';

    const timer = setInterval(() => {
      this.tick(streamId).catch((err) => {
        logger.error('Stream tick failed', { streamId, error: String(err) });
      });
    }, stream.intervalMs);

    this.timers.set(streamId, timer);

    logger.info('Tip stream resumed', { streamId });
    this.onActivity?.(`Tip stream resumed`, `Stream ${streamId.slice(0, 8)}`, stream.chainId);
    return stream;
  }

  /** Stop a stream permanently */
  stopStream(streamId: string): TipStream | null {
    const stream = this.streams.get(streamId);
    if (!stream || stream.status === 'stopped') return null;

    stream.status = 'stopped';
    stream.stoppedAt = new Date().toISOString();
    stream.elapsedSeconds = Math.floor(
      (Date.now() - new Date(stream.startedAt).getTime()) / 1000
    );

    const timer = this.timers.get(streamId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(streamId);
    }

    // Move to history
    this.history.push({ ...stream });
    this.streams.delete(streamId);

    logger.info('Tip stream stopped', {
      streamId,
      totalStreamed: stream.totalStreamed,
      totalTransactions: stream.totalTransactions,
    });

    this.onActivity?.(
      `Tip stream stopped: ${stream.totalStreamed} ${stream.token} in ${stream.totalTransactions} transactions`,
      `Duration: ${stream.elapsedSeconds}s`,
      stream.chainId,
    );

    return stream;
  }

  /** Get all active streams */
  getActiveStreams(): TipStream[] {
    const streams = Array.from(this.streams.values());
    // Update elapsed seconds for each active stream
    for (const s of streams) {
      s.elapsedSeconds = Math.floor(
        (Date.now() - new Date(s.startedAt).getTime()) / 1000
      );
    }
    return streams;
  }

  /** Get stream history (completed streams) */
  getStreamHistory(): TipStream[] {
    return this.history;
  }

  /** Get a specific stream by ID */
  getStream(id: string): TipStream | undefined {
    return this.streams.get(id);
  }

  /** Get streaming statistics */
  getStats(): StreamStats {
    let totalAmount = 0;
    let totalTx = 0;
    for (const s of this.streams.values()) {
      totalAmount += parseFloat(s.totalStreamed);
      totalTx += s.totalTransactions;
    }
    for (const s of this.history) {
      totalAmount += parseFloat(s.totalStreamed);
      totalTx += s.totalTransactions;
    }
    return {
      activeStreams: this.streams.size,
      totalStreamsCreated: this.streams.size + this.history.length,
      totalAmountStreamed: totalAmount.toFixed(8),
      totalTransactionsSent: totalTx,
    };
  }

  /** Stop all active streams (for graceful shutdown) */
  stopAll(): void {
    for (const id of Array.from(this.streams.keys())) {
      this.stopStream(id);
    }
  }
}
