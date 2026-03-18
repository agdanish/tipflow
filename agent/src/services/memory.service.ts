// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

export interface MemoryEntry {
  id: string;
  type: 'preference' | 'context' | 'fact' | 'correction';
  key: string;
  value: string;
  confidence: number;
  source: 'user_said' | 'observed' | 'inferred';
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
}

export interface ConversationSummary {
  id: string;
  timestamp: string;
  topics: string[];
  tipsMade: number;
  keyDecisions: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = join(__dirname, '..', '..', '.agent-memory.json');

/**
 * MemoryService — Persistent Agent Memory
 *
 * The agent remembers:
 * - User preferences (favorite chain, default amount, preferred creators)
 * - Context from past conversations
 * - Facts learned about the user
 * - Corrections (when user says "no, I meant...")
 *
 * This makes the agent smarter over time — TRUE intelligence.
 */
export class MemoryService {
  private memories: MemoryEntry[] = [];
  private conversations: ConversationSummary[] = [];
  private counter = 0;

  constructor() {
    this.load();
    logger.info('Agent memory loaded', { memories: this.memories.length, conversations: this.conversations.length });
  }

  // ── Store & Recall ───────────────────────────────────────────

  remember(type: MemoryEntry['type'], key: string, value: string, source: MemoryEntry['source'] = 'observed'): MemoryEntry {
    // Check if we already know this
    const existing = this.memories.find(m => m.key === key && m.type === type);
    if (existing) {
      existing.value = value;
      existing.lastAccessed = new Date().toISOString();
      existing.accessCount++;
      existing.confidence = Math.min(100, existing.confidence + 5);
      this.save();
      return existing;
    }

    const entry: MemoryEntry = {
      id: `mem_${++this.counter}_${Date.now()}`,
      type,
      key,
      value,
      confidence: source === 'user_said' ? 95 : source === 'observed' ? 70 : 50,
      source,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 1,
    };

    this.memories.push(entry);
    this.save();
    logger.info('Memory stored', { type, key, value: value.slice(0, 50) });
    return entry;
  }

  recall(key: string): MemoryEntry | undefined {
    const mem = this.memories.find(m => m.key === key);
    if (mem) {
      mem.lastAccessed = new Date().toISOString();
      mem.accessCount++;
      this.save();
    }
    return mem;
  }

  recallByType(type: MemoryEntry['type']): MemoryEntry[] {
    return this.memories.filter(m => m.type === type).sort((a, b) => b.confidence - a.confidence);
  }

  search(query: string): MemoryEntry[] {
    const q = query.toLowerCase();
    return this.memories.filter(m =>
      m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
    ).sort((a, b) => b.confidence - a.confidence);
  }

  forget(id: string): boolean {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.memories.splice(idx, 1);
    this.save();
    return true;
  }

  // ── Conversation Summaries ───────────────────────────────────

  summarizeConversation(topics: string[], tipsMade: number, keyDecisions: string[]): ConversationSummary {
    const summary: ConversationSummary = {
      id: `conv_${Date.now()}`,
      timestamp: new Date().toISOString(),
      topics,
      tipsMade,
      keyDecisions,
    };
    this.conversations.push(summary);
    if (this.conversations.length > 50) this.conversations.shift();
    this.save();
    return summary;
  }

  getConversationHistory(): ConversationSummary[] {
    return [...this.conversations].reverse();
  }

  // ── Auto-Learn from Tips ─────────────────────────────────────

  learnFromTip(recipient: string, amount: string, chain: string, token: string): void {
    this.remember('preference', 'last_recipient', recipient, 'observed');
    this.remember('preference', 'last_amount', amount, 'observed');
    this.remember('preference', 'last_chain', chain, 'observed');
    this.remember('preference', 'last_token', token, 'observed');

    // Track frequency
    const freqKey = `recipient_freq_${recipient.slice(0, 10)}`;
    const existing = this.recall(freqKey);
    const count = existing ? parseInt(existing.value) + 1 : 1;
    this.remember('fact', freqKey, String(count), 'observed');
  }

  // ── Stats ────────────────────────────────────────────────────

  getStats() {
    return {
      totalMemories: this.memories.length,
      preferences: this.memories.filter(m => m.type === 'preference').length,
      facts: this.memories.filter(m => m.type === 'fact').length,
      contexts: this.memories.filter(m => m.type === 'context').length,
      corrections: this.memories.filter(m => m.type === 'correction').length,
      conversations: this.conversations.length,
      avgConfidence: this.memories.length > 0
        ? Math.round(this.memories.reduce((s, m) => s + m.confidence, 0) / this.memories.length)
        : 0,
      topMemories: this.memories
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5)
        .map(m => ({ key: m.key, value: m.value, accessed: m.accessCount })),
    };
  }

  getAllMemories(): MemoryEntry[] {
    return [...this.memories].sort((a, b) => b.accessCount - a.accessCount);
  }

  // ── Persistence ──────────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(MEMORY_FILE)) {
        const data = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'));
        this.memories = data.memories ?? [];
        this.conversations = data.conversations ?? [];
        this.counter = data.counter ?? 0;
      }
    } catch {
      logger.warn('Could not load agent memory, starting fresh');
    }
  }

  private save(): void {
    try {
      writeFileSync(MEMORY_FILE, JSON.stringify({
        memories: this.memories,
        conversations: this.conversations,
        counter: this.counter,
      }, null, 2));
    } catch (err) {
      logger.error('Failed to save agent memory', { error: String(err) });
    }
  }
}
