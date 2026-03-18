// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Repeat, Play, Pause, XCircle, Plus, TrendingUp, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface DcaPlan {
  id: string;
  recipient: string;
  totalAmount: number;
  executedAmount: number;
  remainingAmount: number;
  installments: number;
  completedInstallments: number;
  amountPerInstallment: number;
  intervalLabel: string;
  token: string;
  chainId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  nextExecutionAt: string;
  createdAt: string;
}

interface DcaStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalDistributed: number;
}

export function DcaPanel() {
  const [plans, setPlans] = useState<DcaPlan[]>([]);
  const [stats, setStats] = useState<DcaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ recipient: '', totalAmount: '0.01', installments: '5', intervalHours: '24', token: 'usdt', chainId: 'ethereum-sepolia' });

  const load = async () => {
    try {
      const [a, s] = await Promise.all([api.dcaAll(), api.dcaStats()]);
      setPlans(a as unknown as DcaPlan[]);
      setStats(s as unknown as DcaStats);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.dcaCreate({
        recipient: form.recipient,
        totalAmount: parseFloat(form.totalAmount),
        installments: parseInt(form.installments),
        intervalHours: parseInt(form.intervalHours),
        token: form.token,
        chainId: form.chainId,
      });
      setShowCreate(false);
      setForm({ recipient: '', totalAmount: '0.01', installments: '5', intervalHours: '24', token: 'usdt', chainId: 'ethereum-sepolia' });
      await load();
    } catch { /* ignore */ }
  };

  const pause = async (id: string) => { try { await api.dcaPause(id); await load(); } catch { /* */ } };
  const resume = async (id: string) => { try { await api.dcaResume(id); await load(); } catch { /* */ } };
  const cancel = async (id: string) => { try { await api.dcaCancel(id); await load(); } catch { /* */ } };

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text-line" width="120px" height="16px" />
        <Skeleton variant="circle" width="28px" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <Skeleton key={i} variant="card" height="48px" />)}
      </div>
      <Skeleton variant="card" height="90px" />
      <Skeleton variant="card" height="90px" />
    </div>
  );

  const statusColor = (s: string) =>
    s === 'active' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
    s === 'paused' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    s === 'completed' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
    'text-red-400 bg-red-500/10 border-red-500/20';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Repeat className="w-4 h-4 text-purple-400" />
          DCA Tipping
        </h3>
        <button onClick={() => setShowCreate(!showCreate)} className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors btn-press" aria-label="Create DCA plan">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Plans', value: stats.totalPlans },
            { label: 'Active', value: stats.activePlans },
            { label: 'Completed', value: stats.completedPlans },
            { label: 'Distributed', value: `$${stats.totalDistributed.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-surface-2">
              <div className="text-xs font-bold text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2">
          <input
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            placeholder="Recipient address"
            className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-primary text-xs focus:border-purple-500 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-text-muted">Total</label>
              <input value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs" />
            </div>
            <div>
              <label className="text-xs text-text-muted">Installments</label>
              <input value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs" />
            </div>
            <div>
              <label className="text-xs text-text-muted">Interval (hrs)</label>
              <input value={form.intervalHours} onChange={(e) => setForm({ ...form, intervalHours: e.target.value })} className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="flex-1 px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs">
              <option value="usdt">USDT</option>
              <option value="native">Native</option>
              <option value="usat">USAT</option>
              <option value="xaut">XAU₮</option>
            </select>
            <select value={form.chainId} onChange={(e) => setForm({ ...form, chainId: e.target.value })} className="flex-1 px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs">
              <option value="ethereum-sepolia">Ethereum</option>
              <option value="ton-testnet">TON</option>
              <option value="tron-nile">TRON</option>
            </select>
          </div>
          {/* Payout schedule preview */}
          {parseFloat(form.totalAmount) > 0 && parseInt(form.installments) > 0 && (
            <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15 space-y-1.5">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Payout Schedule Preview</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-muted">Per installment:</span>
                  <span className="ml-1 font-bold text-text-primary tabular-nums">
                    {(parseFloat(form.totalAmount) / parseInt(form.installments)).toFixed(6)} {form.token.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Duration:</span>
                  <span className="ml-1 font-bold text-text-primary tabular-nums">
                    {(parseInt(form.installments) * parseInt(form.intervalHours))} hours
                    {parseInt(form.installments) * parseInt(form.intervalHours) >= 24 && (
                      <span className="text-text-muted"> ({(parseInt(form.installments) * parseInt(form.intervalHours) / 24).toFixed(1)} days)</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Mini timeline */}
              <div className="flex items-center gap-0.5 overflow-hidden">
                {Array.from({ length: Math.min(parseInt(form.installments) || 0, 12) }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full bg-purple-400/30"
                    title={`Installment ${i + 1}: +${parseInt(form.intervalHours) * (i + 1)}h`}
                  />
                ))}
                {parseInt(form.installments) > 12 && (
                  <span className="text-xs text-text-muted ml-1">+{parseInt(form.installments) - 12} more</span>
                )}
              </div>
            </div>
          )}
          <button onClick={create} disabled={!form.recipient} className="w-full py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors btn-press">
            Create DCA Plan
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-2">
        {plans.length === 0 && (
          <div className="text-center py-6 animate-fade-in">
            <Repeat className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
            <p className="text-xs text-text-muted mb-2">No DCA plans yet</p>
            <button onClick={() => setShowCreate(true)} className="text-xs text-purple-400 hover:text-purple-300 font-medium btn-press">+ Create Your First Plan</button>
          </div>
        )}
        {plans.map((p, index) => {
          const progress = p.installments > 0 ? (p.completedInstallments / p.installments) * 100 : 0;
          return (
            <div key={p.id} className="p-3 rounded-lg border border-border bg-surface-2 space-y-2 card-hover animate-list-item-in" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                  <span className="text-xs font-mono text-text-secondary">{p.recipient.slice(0, 8)}...{p.recipient.slice(-4)}</span>
                </div>
                <div className="flex gap-1">
                  {p.status === 'active' && (
                    <button onClick={() => pause(p.id)} className="p-1 rounded text-amber-400 hover:bg-amber-500/10" title="Pause">
                      <Pause className="w-3 h-3" />
                    </button>
                  )}
                  {p.status === 'paused' && (
                    <button onClick={() => resume(p.id)} className="p-1 rounded text-green-400 hover:bg-green-500/10" title="Resume">
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {(p.status === 'active' || p.status === 'paused') && (
                    <button onClick={() => cancel(p.id)} className="p-1 rounded text-red-400 hover:bg-red-500/10" title="Cancel">
                      <XCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-text-primary">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  {p.executedAmount.toFixed(4)} / {p.totalAmount.toFixed(4)} {p.token.toUpperCase()}
                </span>
                <span className="text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {p.intervalLabel}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all ${p.status === 'active' ? 'progress-shimmer' : ''}`} style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-text-muted flex justify-between">
                <span>{p.completedInstallments}/{p.installments} installments</span>
                {p.status === 'active' && p.nextExecutionAt && (
                  <span>Next: {new Date(p.nextExecutionAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
