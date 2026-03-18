import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookMarked, Play, Trash2, Plus, X, Loader2, Star } from 'lucide-react';
import { api } from '../lib/api';
import type { TipTemplate } from '../types';

interface TipTemplatesProps {
  onUseTemplate: (template: TipTemplate) => void;
}

export function TipTemplates({ onUseTemplate }: TipTemplatesProps) {
  const [templates, setTemplates] = useState<TipTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // New template form fields
  const [name, setName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'native' | 'usdt'>('native');
  const [chainId, setChainId] = useState<string>('');

  const fetchTemplates = useCallback(async () => {
    try {
      const { templates: t } = await api.getTemplates();
      setTemplates(t);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!name.trim() || !recipient.trim() || !amount.trim()) return;
    setSaving(true);
    try {
      const { template } = await api.createTemplate({
        name: name.trim(),
        recipient: recipient.trim(),
        amount: amount.trim(),
        token,
        chainId: chainId || undefined,
      });
      setTemplates((prev) => [template, ...prev]);
      setCreating(false);
      setName('');
      setRecipient('');
      setAmount('');
      setToken('native');
      setChainId('');
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch {
      // silently fail
    }
  };

  const truncateAddr = (addr: string) => {
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Find the most-used template
  const mostUsedId = useMemo(() => {
    if (templates.length === 0) return null;
    let best: TipTemplate | null = null;
    for (const t of templates) {
      if ((t.useCount ?? 0) > 0 && (!best || (t.useCount ?? 0) > (best.useCount ?? 0))) {
        best = t;
      }
    }
    return best?.id ?? null;
  }, [templates]);

  const tokenLabel = (t: TipTemplate) => {
    if (t.token === 'usdt') return 'USDT';
    if (t.chainId === 'ton-testnet') return 'TON';
    return 'ETH';
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-blue-400" />
          Tip Templates
        </h2>
        <button
          type="button"
          onClick={() => setCreating(!creating)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
        >
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {creating ? 'Cancel' : 'New'}
        </button>
      </div>

      {/* Create template form */}
      {creating && (
        <div className="mb-3 p-3 rounded-lg bg-surface-2 border border-blue-500/20 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (e.g. Weekly team tip)"
            className="w-full px-2.5 py-2 rounded-md bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient address (0x... or UQ...)"
            className="w-full px-2.5 py-2 rounded-md bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 px-2.5 py-2 rounded-md bg-surface-1 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <select
              value={token}
              onChange={(e) => {
                setToken(e.target.value as 'native' | 'usdt');
                if (e.target.value === 'usdt') setChainId('ethereum-sepolia');
              }}
              className="px-2.5 py-2 rounded-md bg-surface-1 border border-border text-sm text-text-primary focus:outline-none transition-colors"
            >
              <option value="native">Native</option>
              <option value="usdt">USDT</option>
            </select>
          </div>
          {token !== 'usdt' && (
            <select
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-full px-2.5 py-2 rounded-md bg-surface-1 border border-border text-sm text-text-primary focus:outline-none transition-colors"
            >
              <option value="">Auto (AI decides)</option>
              <option value="ethereum-sepolia">Ethereum Sepolia</option>
              <option value="ton-testnet">TON Testnet</option>
            </select>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || !recipient.trim() || !amount.trim() || saving}
            className="w-full py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5" />}
            Save Template
          </button>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted mx-auto" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-6">
          <BookMarked className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
          <p className="text-xs text-text-muted">No templates yet</p>
          <p className="text-[10px] text-text-muted mt-0.5">Save frequently-used tip configurations for quick reuse</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {templates.map((t) => {
            const isPopular = mostUsedId === t.id;
            return (
            <div
              key={t.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-surface-2 border transition-colors group ${isPopular ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-border hover:border-border-light'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{t.name}</span>
                  {isPopular && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-semibold text-amber-400 discovery-star">
                      <Star className="w-2.5 h-2.5" />
                      Popular
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    t.token === 'usdt'
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}>
                    {tokenLabel(t)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-secondary font-medium">{t.amount}</span>
                  <span className="text-[10px] text-text-muted">to</span>
                  <span className="text-[10px] text-text-muted font-mono">{truncateAddr(t.recipient)}</span>
                  {(t.useCount ?? 0) > 0 && (
                    <span className="text-[10px] text-text-muted tabular-nums ml-auto">Used {t.useCount}x</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUseTemplate(t)}
                  className="px-2.5 py-1.5 rounded-md bg-accent/15 text-accent border border-accent/20 text-[10px] font-medium hover:bg-accent/25 transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Use
                </button>
                {deleteConfirm === t.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="px-2 py-1.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-medium hover:bg-red-500/25 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="px-1.5 py-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(t.id)}
                    className="p-1.5 rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
