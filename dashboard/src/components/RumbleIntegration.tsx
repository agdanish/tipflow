// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent
// Rumble Integration Dashboard Component

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import {
  Tv,
  UserPlus,
  Users,
  Trophy,
  Zap,
  Eye,
  Target,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// === Types ===

interface Creator {
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

interface AutoTipRule {
  id: string;
  userId: string;
  minWatchPercent: number;
  tipAmount: number;
  maxTipsPerDay: number;
  enabledCategories: string[];
  enabled: boolean;
  createdAt: string;
}

interface TipPool {
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

interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  creatorName: string;
  channelUrl: string;
  walletAddress: string;
  totalTips: number;
  totalAmount: number;
  categories: string[];
}

// === Sub-tabs ===

type RumbleTab = 'creators' | 'autotip' | 'pools' | 'events' | 'leaderboard';

const tabs: Array<{ id: RumbleTab; label: string; icon: typeof Tv }> = [
  { id: 'creators', label: 'Creators', icon: Users },
  { id: 'autotip', label: 'Auto-Tip', icon: Eye },
  { id: 'pools', label: 'Pools', icon: Target },
  { id: 'events', label: 'Events', icon: Zap },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

// === Creators Tab ===

function CreatorsPanel() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [categories, setCategories] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const { creators: c } = await api.rumbleGetCreators();
      setCreators(c as unknown as Creator[]);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !channelUrl || !walletAddress) return;
    setSubmitting(true);
    setError('');
    try {
      await api.rumbleRegisterCreator(
        name,
        channelUrl,
        walletAddress,
        categories.split(',').map((s) => s.trim()).filter(Boolean),
      );
      setName('');
      setChannelUrl('');
      setWalletAddress('');
      setCategories('');
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Register and manage Rumble creators for tipping.</p>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-2 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent-border text-xs font-medium hover:bg-accent/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Creator
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Creator Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CryptoNews Daily"
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Rumble Channel URL</label>
              <input
                type="url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://rumble.com/c/channel"
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Categories (comma-separated)</label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="crypto, news, tech"
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No creators registered yet. Add your first Rumble creator above.
        </div>
      ) : (
        <div className="space-y-3">
          {creators.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{c.name}</h3>
                    <a href={c.channelUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-text-muted font-mono mt-0.5">{c.walletAddress.slice(0, 10)}...{c.walletAddress.slice(-6)}</p>
                  {c.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.categories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded-full bg-surface-3 border border-border text-[10px] text-text-secondary">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-accent">{c.totalTipAmount.toFixed(4)}</p>
                  <p className="text-[10px] text-text-muted">{c.totalTipsReceived} tips</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === Auto-Tip Tab ===

function AutoTipPanel() {
  const [rules, setRules] = useState<AutoTipRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userId] = useState('default-user');
  const [minWatchPercent, setMinWatchPercent] = useState('80');
  const [tipAmount, setTipAmount] = useState('0.001');
  const [maxTipsPerDay, setMaxTipsPerDay] = useState('10');
  const [enabledCategories, setEnabledCategories] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { rules: r } = await api.rumbleGetAutoTipRules(userId);
      setRules(r as unknown as AutoTipRule[]);
    } catch {
      // keep existing
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newRule = {
        minWatchPercent: Number(minWatchPercent),
        tipAmount: Number(tipAmount),
        maxTipsPerDay: Number(maxTipsPerDay),
        enabledCategories: enabledCategories.split(',').map((s) => s.trim()).filter(Boolean),
        enabled: true,
      };
      await api.rumbleSetAutoTipRules(userId, [...rules.map((r) => ({
        minWatchPercent: r.minWatchPercent,
        tipAmount: r.tipAmount,
        maxTipsPerDay: r.maxTipsPerDay,
        enabledCategories: r.enabledCategories,
        enabled: r.enabled,
      })), newRule]);
      setShowForm(false);
      setMinWatchPercent('80');
      setTipAmount('0.001');
      setMaxTipsPerDay('10');
      setEnabledCategories('');
      refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Auto-tip creators when you watch their content.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent-border text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Rule
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Min Watch % to Trigger</label>
              <input
                type="number"
                min="1"
                max="100"
                value={minWatchPercent}
                onChange={(e) => setMinWatchPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Tip Amount (ETH)</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Max Tips Per Day</label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxTipsPerDay}
                onChange={(e) => setMaxTipsPerDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Categories (optional, comma-separated)</label>
              <input
                type="text"
                value={enabledCategories}
                onChange={(e) => setEnabledCategories(e.target.value)}
                placeholder="crypto, gaming"
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No auto-tip rules configured. Add a rule to start auto-tipping creators based on watch time.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Tip <span className="text-accent">{rule.tipAmount} ETH</span> when watch &ge; <span className="text-cyan-400">{rule.minWatchPercent}%</span>
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Max {rule.maxTipsPerDay}/day
                      {rule.enabledCategories.length > 0 && ` | Categories: ${rule.enabledCategories.join(', ')}`}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rule.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                  {rule.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === Community Pools Tab ===

function PoolsPanel() {
  const [pools, setPools] = useState<TipPool[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creatorId, setCreatorId] = useState('');
  const [title, setTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('1');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contributingPool, setContributingPool] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('0.01');
  const [contributorName, setContributorName] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [poolRes, creatorRes] = await Promise.all([
        api.rumbleGetPools(),
        api.rumbleGetCreators(),
      ]);
      setPools(poolRes.pools as unknown as TipPool[]);
      setCreators(creatorRes.creators as unknown as Creator[]);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorId || !title || !goalAmount) return;
    setSubmitting(true);
    try {
      await api.rumbleCreatePool(creatorId, Number(goalAmount), title, deadline || undefined);
      setShowForm(false);
      setTitle('');
      setGoalAmount('1');
      setDeadline('');
      refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (poolId: string) => {
    if (!contributionAmount || !contributorName) return;
    try {
      await api.rumbleContributeToPool(poolId, Number(contributionAmount), contributorName);
      setContributingPool(null);
      setContributionAmount('0.01');
      setContributorName('');
      refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Pool funds with others to support your favorite creators.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent-border text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Pool
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreatePool} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Creator</label>
              <select
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              >
                <option value="">Select creator...</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Pool Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Support for next video"
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Goal Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2 p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No active pools. Create one to start crowdfunding tips for a creator.
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map((pool) => {
            const pct = Math.min(100, Math.round((pool.currentAmount / pool.goalAmount) * 100));
            return (
              <div key={pool.id} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{pool.title}</h3>
                    <p className="text-xs text-text-muted">for {pool.creatorName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-accent">{pool.currentAmount.toFixed(4)} / {pool.goalAmount} ETH</p>
                    <p className="text-[10px] text-text-muted">{pool.contributors.length} contributors</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 100
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                        : 'bg-gradient-to-r from-accent to-cyan-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>{pct}% funded</span>
                  {pool.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(pool.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {/* Contribute */}
                {contributingPool === pool.id ? (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-text-muted mb-0.5">Your name</label>
                      <input
                        type="text"
                        value={contributorName}
                        onChange={(e) => setContributorName(e.target.value)}
                        placeholder="Anonymous"
                        className="w-full px-2 py-1.5 rounded-lg bg-surface-3 border border-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-text-muted mb-0.5">Amount</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-surface-3 border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                      />
                    </div>
                    <button
                      onClick={() => handleContribute(pool.id)}
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 transition-colors"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setContributingPool(null)}
                      className="px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setContributingPool(pool.id)}
                    className="w-full py-2 rounded-lg bg-surface-3 border border-border text-xs text-text-secondary hover:text-accent hover:border-accent-border transition-colors"
                  >
                    Contribute to Pool
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// === Events Tab ===

function EventsPanel() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [creatorId, setCreatorId] = useState('');
  const [event, setEvent] = useState<'new_video' | 'milestone' | 'live_start' | 'anniversary'>('new_video');
  const [tipAmount, setTipAmount] = useState('0.01');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.rumbleGetCreators().then(({ creators: c }) => setCreators(c as unknown as Creator[])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorId || !tipAmount) return;
    setSubmitting(true);
    setSuccess('');
    try {
      const { trigger } = await api.rumbleRegisterEventTrigger(creatorId, event, Number(tipAmount));
      setSuccess(`Trigger created: tip ${tipAmount} ETH on ${event} (ID: ${String(trigger.id).slice(0, 8)}...)`);
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const eventLabels: Record<string, string> = {
    new_video: 'New Video Published',
    milestone: 'Subscriber Milestone',
    live_start: 'Live Stream Starts',
    anniversary: 'Channel Anniversary',
  };

  const eventDescriptions: Record<string, string> = {
    new_video: 'Auto-tip when the creator publishes a new video on Rumble',
    milestone: 'Bonus tip when the creator hits a subscriber milestone',
    live_start: 'Auto-tip when the creator starts a live stream',
    anniversary: 'Celebrate the creator\'s channel anniversary with a tip',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Set up event-triggered automatic tips.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent-border text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Trigger
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Creator</label>
              <select
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              >
                <option value="">Select creator...</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Event Type</label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value as typeof event)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="new_video">New Video</option>
                <option value="milestone">Milestone</option>
                <option value="live_start">Live Start</option>
                <option value="anniversary">Anniversary</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Tip Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Trigger'}
            </button>
          </div>
        </form>
      )}

      {/* Event type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(eventLabels).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-border bg-surface-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-text-primary">{label}</h3>
            </div>
            <p className="text-xs text-text-muted">{eventDescriptions[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Leaderboard Tab ===

function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'day' | 'week' | 'month'>('all');

  const refresh = useCallback(async () => {
    try {
      const { leaderboard: lb } = await api.rumbleGetLeaderboard(timeframe);
      setLeaderboard(lb as unknown as LeaderboardEntry[]);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => { refresh(); }, [refresh]);

  const rankColors = ['text-amber-400', 'text-gray-300', 'text-orange-400'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Top tipped Rumble creators.</p>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-border">
          {(['all', 'month', 'week', 'day'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-surface-3 text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tf === 'all' ? 'All' : tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-2 p-3 animate-pulse h-16" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No creators on the leaderboard yet. Register creators and start tipping.
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div key={entry.creatorId} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                entry.rank <= 3 ? 'bg-surface-3' : ''
              } ${rankColors[entry.rank - 1] ?? 'text-text-muted'}`}>
                {entry.rank <= 3 ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <span>{entry.rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-text-primary truncate">{entry.creatorName}</h3>
                  <a href={entry.channelUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {entry.categories.length > 0 && (
                  <p className="text-[10px] text-text-muted truncate">{entry.categories.join(' / ')}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-accent">{entry.totalAmount.toFixed(4)}</p>
                <p className="text-[10px] text-text-muted">{entry.totalTips} tips</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === Main Component ===

export function RumbleIntegration() {
  const [activeTab, setActiveTab] = useState<RumbleTab>('creators');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
            <Tv className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Rumble Integration</h2>
            <p className="text-xs text-text-muted">AI-powered creator tipping for Rumble&apos;s ecosystem</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border mb-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'creators' && <CreatorsPanel />}
          {activeTab === 'autotip' && <AutoTipPanel />}
          {activeTab === 'pools' && <PoolsPanel />}
          {activeTab === 'events' && <EventsPanel />}
          {activeTab === 'leaderboard' && <LeaderboardPanel />}
        </div>
      </div>
    </div>
  );
}
