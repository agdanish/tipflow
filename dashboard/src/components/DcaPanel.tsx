// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Repeat, Play, Pause, XCircle, Plus, TrendingUp, Clock } from 'lucide-react';
import { api } from '../lib/api';

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

  if (loading) return <div className="p-4 text-text-secondary text-sm">Loading DCA...</div>;

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
        <button onClick={() => setShowCreate(!showCreate)} className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors">
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
              <div className="text-[10px] text-text-muted">{s.label}</div>
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
              <label className="text-[10px] text-text-muted">Total</label>
              <input value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-text-muted">Installments</label>
              <input value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-text-primary text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-text-muted">Interval (hrs)</label>
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
          <button onClick={create} disabled={!form.recipient} className="w-full py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors">
            Create DCA Plan
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-2">
        {plans.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">No DCA plans yet. Create one to spread tips over time.</p>
        )}
        {plans.map((p) => {
          const progress = p.installments > 0 ? (p.completedInstallments / p.installments) * 100 : 0;
          return (
            <div key={p.id} className="p-3 rounded-lg border border-border bg-surface-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${statusColor(p.status)}`}>
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
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[10px] text-text-muted flex justify-between">
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
