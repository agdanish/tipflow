// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, Clock, Plus, X, AlertTriangle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface EscrowTip {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  token: string;
  chainId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  releaseCondition: string;
  memo?: string;
}

interface EscrowStats {
  totalEscrowed: number;
  totalReleased: number;
  totalRefunded: number;
  activeCount: number;
  avgHoldTime: number;
  disputeRate: number;
}

const RELEASE_CONDITIONS = [
  { value: 'manual', label: 'Manual Release', desc: 'Sender manually releases the tip' },
  { value: 'auto_after_24h', label: 'Auto (24h)', desc: 'Automatically released after 24 hours' },
  { value: 'creator_confirm', label: 'Creator Confirm', desc: 'Recipient must acknowledge the tip' },
  { value: 'watch_time', label: 'Watch Time', desc: 'Released after viewer reaches watch time threshold' },
];

export function EscrowPanel() {
  const [escrows, setEscrows] = useState<EscrowTip[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createRecipient, setCreateRecipient] = useState('');
  const [createAmount, setCreateAmount] = useState('');
  const [createToken, setCreateToken] = useState('usdt');
  const [createChain] = useState('ethereum-sepolia');
  const [createCondition, setCreateCondition] = useState('manual');
  const [createMemo, setCreateMemo] = useState('');
  const [creating, setCreating] = useState(false);

  // Dispute state
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputing, setDisputing] = useState(false);

  const load = async () => {
    try {
      const [e, s] = await Promise.all([api.escrowActive(), api.escrowStats()]);
      setEscrows(e as unknown as EscrowTip[]);
      setStats(s as unknown as EscrowStats);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!createRecipient.trim() || !createAmount.trim()) return;
    setCreating(true);
    try {
      await api.escrowCreate({
        recipient: createRecipient.trim(),
        amount: createAmount.trim(),
        token: createToken,
        chainId: createChain,
        releaseCondition: createCondition,
        memo: createMemo.trim() || undefined,
      });
      setShowCreate(false);
      setCreateRecipient('');
      setCreateAmount('');
      setCreateMemo('');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const release = async (id: string) => {
    try { await api.escrowRelease(id); await load(); } catch { /* ignore */ }
  };

  const refund = async (id: string) => {
    try { await api.escrowRefund(id, 'User requested refund'); await load(); } catch { /* ignore */ }
  };

  const handleDispute = async (id: string) => {
    if (!disputeReason.trim()) return;
    setDisputing(true);
    try {
      await api.escrowDispute(id, disputeReason.trim());
      setDisputeId(null);
      setDisputeReason('');
      await load();
    } catch { /* ignore */ }
    setDisputing(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text-line" width="140px" height="16px" />
        <Skeleton variant="text-line" width="50px" height="14px" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <Skeleton key={i} variant="card" height="56px" />)}
      </div>
      <Skeleton variant="card" height="90px" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent" />
          Tip Escrow Protocol
        </h3>
        <div className="flex items-center gap-2">
          {stats && <span className="text-xs text-text-secondary">{stats.activeCount} active</span>}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1 btn-press"
          >
            {showCreate ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showCreate ? 'Cancel' : 'New Escrow'}
          </button>
        </div>
      </div>

      {/* ── CREATE ESCROW FORM ── */}
      {showCreate && (
        <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-3 animate-slide-down">
          <h4 className="text-xs font-semibold text-accent flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Create Escrowed Tip
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={createRecipient}
              onChange={e => setCreateRecipient(e.target.value)}
              placeholder="Recipient address..."
              className="col-span-2 px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors font-mono"
            />
            <input
              type="text"
              value={createAmount}
              onChange={e => setCreateAmount(e.target.value)}
              placeholder="Amount"
              className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
            />
            <select
              value={createToken}
              onChange={e => setCreateToken(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
            >
              <option value="usdt">USDT</option>
              <option value="native">Native (ETH/TON)</option>
            </select>
          </div>

          {/* Release condition selector */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Release Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              {RELEASE_CONDITIONS.map(rc => (
                <button
                  key={rc.value}
                  type="button"
                  onClick={() => setCreateCondition(rc.value)}
                  className={`text-left p-2 rounded-lg border text-[11px] transition-all ${
                    createCondition === rc.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-border-light'
                  }`}
                >
                  <div className="font-medium">{rc.label}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">{rc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={createMemo}
            onChange={e => setCreateMemo(e.target.value)}
            placeholder="Memo (optional)"
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
          />

          <button
            onClick={handleCreate}
            disabled={creating || !createRecipient.trim() || !createAmount.trim()}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-light disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 btn-press"
          >
            <Send className="w-3.5 h-3.5" />
            {creating ? 'Creating...' : 'Create Escrow'}
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-text-primary tabular-nums">{stats.totalEscrowed.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Total Escrowed</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-green-400 tabular-nums">{stats.totalReleased.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Released</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-red-400 tabular-nums">{stats.totalRefunded.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Refunded</div>
          </div>
        </div>
      )}

      {/* Active Escrows */}
      {escrows.length === 0 ? (
        <div className="text-center py-6 animate-fade-in">
          <Lock className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No active escrows</p>
          <p className="text-[10px] text-text-muted/60 mt-1">Create one to hold tips with release conditions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {escrows.map((escrow, i) => (
            <div key={escrow.id} className="p-3 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-text-primary tabular-nums">{escrow.amount} {escrow.token.toUpperCase()}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {escrow.releaseCondition.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[10px] text-text-secondary mb-2">
                &rarr; {escrow.recipient.slice(0, 10)}...{escrow.recipient.slice(-4)}
                {escrow.memo && <span className="ml-2 italic">&ldquo;{escrow.memo}&rdquo;</span>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => release(escrow.id)} className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center gap-1 btn-press">
                  <Unlock className="w-2.5 h-2.5" /> Release
                </button>
                <button onClick={() => refund(escrow.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 btn-press">
                  <RotateCcw className="w-2.5 h-2.5" /> Refund
                </button>
                <button
                  onClick={() => setDisputeId(disputeId === escrow.id ? null : escrow.id)}
                  className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1 btn-press ml-auto"
                >
                  <AlertTriangle className="w-2.5 h-2.5" /> Dispute
                </button>
              </div>

              {/* Dispute form */}
              {disputeId === escrow.id && (
                <div className="mt-2 flex gap-1.5 animate-slide-down">
                  <input
                    type="text"
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    placeholder="Dispute reason..."
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-surface-3 border border-amber-500/30 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleDispute(escrow.id)}
                    disabled={disputing || !disputeReason.trim()}
                    className="px-2.5 py-1.5 rounded-md bg-amber-500 text-white text-xs font-medium hover:bg-amber-400 disabled:opacity-40 transition-colors btn-press"
                  >
                    {disputing ? '...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
