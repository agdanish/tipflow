// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Lock, Unlock, RotateCcw, Clock } from 'lucide-react';
import { api } from '../lib/api';

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

export function EscrowPanel() {
  const [escrows, setEscrows] = useState<EscrowTip[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [e, s] = await Promise.all([api.escrowActive(), api.escrowStats()]);
      setEscrows(e as unknown as EscrowTip[]);
      setStats(s as unknown as EscrowStats);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const release = async (id: string) => {
    try { await api.escrowRelease(id); await load(); } catch { /* ignore */ }
  };

  const refund = async (id: string) => {
    try { await api.escrowRefund(id, 'User requested refund'); await load(); } catch { /* ignore */ }
  };

  if (loading) return <div className="p-4 text-text-secondary text-sm">Loading escrow...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent" />
          Tip Escrow Protocol
        </h3>
        {stats && <span className="text-xs text-text-secondary">{stats.activeCount} active</span>}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-text-primary">{stats.totalEscrowed.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Total Escrowed</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-green-400">{stats.totalReleased.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Released</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 border border-border text-center">
            <div className="text-sm font-bold text-red-400">{stats.totalRefunded.toFixed(4)}</div>
            <div className="text-[10px] text-text-secondary">Refunded</div>
          </div>
        </div>
      )}

      {/* Active Escrows */}
      {escrows.length === 0 ? (
        <p className="text-xs text-text-secondary p-3 text-center">No active escrows. Tips are released directly.</p>
      ) : (
        <div className="space-y-2">
          {escrows.map((escrow) => (
            <div key={escrow.id} className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-text-primary">{escrow.amount} {escrow.token.toUpperCase()}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {escrow.releaseCondition.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[10px] text-text-secondary mb-2">
                &rarr; {escrow.recipient.slice(0, 10)}...{escrow.recipient.slice(-4)}
                {escrow.memo && <span className="ml-2 italic">&ldquo;{escrow.memo}&rdquo;</span>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => release(escrow.id)} className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center gap-1">
                  <Unlock className="w-2.5 h-2.5" /> Release
                </button>
                <button onClick={() => refund(escrow.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" /> Refund
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
