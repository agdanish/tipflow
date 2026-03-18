import { useState, useEffect, useCallback } from 'react';
import { Radio, Play, Pause, Square, Clock, Zap, Plus, History, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';

interface TipStream {
  id: string;
  recipient: string;
  microTipAmount: string;
  intervalMs: number;
  token: string;
  chainId: string;
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
}

interface StreamStats {
  activeStreams: number;
  totalStreamsCreated: number;
  totalAmountStreamed: string;
  totalTransactionsSent: number;
}

const STATUS_COLORS: Record<TipStream['status'], { dot: string; text: string; bg: string; label: string }> = {
  active: { dot: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-500/10', label: 'Active' },
  paused: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Paused' },
  stopped: { dot: 'bg-gray-400', text: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Stopped' },
  error: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
};

const CHAINS = [
  { id: 'ethereum-mainnet', label: 'Ethereum' },
  { id: 'ethereum-sepolia', label: 'Sepolia' },
  { id: 'ton-mainnet', label: 'TON' },
  { id: 'ton-testnet', label: 'TON Testnet' },
];

function truncateAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function StreamingPanel() {
  const [streams, setStreams] = useState<TipStream[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [history, setHistory] = useState<TipStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amountPerTick, setAmountPerTick] = useState('0.01');
  const [intervalSeconds, setIntervalSeconds] = useState('60');
  const [chainId, setChainId] = useState('ethereum-sepolia');
  const [maxBudget, setMaxBudget] = useState('');

  const fetchStreams = useCallback(async () => {
    try {
      const data = await api.getActiveStreams();
      setStreams(data.streams);
      setStats(data.stats);
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.getStreamHistory();
      setHistory(data.streams);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStreams();
    const id = setInterval(fetchStreams, 5000);
    return () => clearInterval(id);
  }, [fetchStreams]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.startStream({
        recipient,
        amountPerTick,
        intervalSeconds: parseInt(intervalSeconds, 10),
        token: 'USDT',
        chainId,
        maxBudget: maxBudget || undefined,
      });
      setRecipient('');
      setAmountPerTick('0.01');
      setIntervalSeconds('60');
      setMaxBudget('');
      setShowForm(false);
      await fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      if (action === 'pause') await api.pauseStream(id);
      else if (action === 'resume') await api.resumeStream(id);
      else await api.stopStream(id);
      await fetchStreams();
    } catch {
      // silent
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) await fetchHistory();
    setShowHistory((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <div className="skeleton h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400" />
          Tip Streaming
        </h2>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Stream
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-text-primary">{stats.activeStreams}</div>
            <div className="text-[10px] text-text-muted">Active</div>
          </div>
          <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-text-primary">{parseFloat(stats.totalAmountStreamed).toFixed(4)}</div>
            <div className="text-[10px] text-text-muted">Streamed</div>
          </div>
          <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-text-primary">{stats.totalTransactionsSent}</div>
            <div className="text-[10px] text-text-muted">Txns</div>
          </div>
        </div>
      )}

      {/* New stream form */}
      {showForm && (
        <form onSubmit={handleStart} className="mb-4 p-3 rounded-lg bg-surface-2 border border-border space-y-3">
          <div>
            <label className="block text-[11px] text-text-muted mb-1">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... or UQ..."
              required
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Amount / Tick</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amountPerTick}
                onChange={(e) => setAmountPerTick(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Interval (sec)</label>
              <input
                type="number"
                min="10"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Chain</label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Budget Cap (opt)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 btn-press"
          >
            {submitting ? 'Starting...' : 'Start Stream'}
          </button>
        </form>
      )}

      {/* Active streams */}
      {streams.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-sm">
          <Radio className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted mb-2">No active streams</p>
          <button onClick={() => setShowForm(true)} className="text-xs text-accent hover:text-accent-light font-medium btn-press">+ Start Your First Stream</button>
        </div>
      ) : (
        <div className="space-y-2">
          {streams.map((stream, i) => {
            const colors = STATUS_COLORS[stream.status];
            return (
              <div key={stream.id} className={`p-3 rounded-lg bg-surface-2 border card-hover animate-list-item-in ${stream.status === 'active' ? 'border-accent/30 stream-active-glow' : 'border-border'}`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${colors.dot} ${stream.status === 'active' ? 'animate-pulse' : ''}`} />
                  <span className="font-mono text-xs text-text-primary">{truncateAddress(stream.recipient)}</span>
                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {colors.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-text-muted mb-2">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {parseFloat(stream.totalStreamed).toFixed(4)} {stream.token}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatElapsed(stream.elapsedSeconds)}
                  </div>
                  <div className="text-right">
                    {stream.totalTransactions} txns
                  </div>
                </div>
                {stream.maxBudget && (
                  <div className="mb-2">
                    <div className="h-1.5 rounded-full bg-surface-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-accent transition-all ${stream.status === 'active' ? 'progress-shimmer' : ''}`}
                        style={{ width: `${Math.min(100, (parseFloat(stream.totalStreamed) / parseFloat(stream.maxBudget)) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5 text-right">
                      {parseFloat(stream.totalStreamed).toFixed(4)} / {stream.maxBudget} budget
                    </div>
                  </div>
                )}
                {(stream.status === 'active' || stream.status === 'paused') && (
                  <div className="flex gap-2">
                    {stream.status === 'active' ? (
                      <button
                        onClick={() => handleAction(stream.id, 'pause')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-colors"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(stream.id, 'resume')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(stream.id, 'stop')}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                    >
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History toggle */}
      <button
        onClick={toggleHistory}
        className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        Stream History
        {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showHistory && (
        <div className="mt-2 space-y-1.5">
          {history.length === 0 ? (
            <p className="text-center text-xs text-text-muted py-3">No stream history yet.</p>
          ) : (
            history.map((s) => {
              const colors = STATUS_COLORS[s.status];
              return (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  <span className="font-mono text-text-primary">{truncateAddress(s.recipient)}</span>
                  <span className="text-text-muted">{parseFloat(s.totalStreamed).toFixed(4)} {s.token}</span>
                  <span className="text-text-muted">{s.totalTransactions} txns</span>
                  <span className={`ml-auto ${colors.text} text-[10px]`}>{colors.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
