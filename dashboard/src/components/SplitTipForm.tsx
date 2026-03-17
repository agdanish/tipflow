import { useState } from 'react';
import { Scissors, Plus, Trash2, Loader2, AlertCircle, Send, Equal, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainId, TokenType, SplitTipResult, SplitRecipient } from '../types';

interface SplitTipFormProps {
  onSplitComplete: (result: SplitTipResult) => void;
  disabled: boolean;
}

interface RecipientRow {
  id: string;
  address: string;
  percentage: string;
  name: string;
}

let nextSplitId = 1;
function createRow(): RecipientRow {
  return { id: String(nextSplitId++), address: '', percentage: '', name: '' };
}

const COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
];

export function SplitTipForm({ onSplitComplete, disabled }: SplitTipFormProps) {
  const [totalAmount, setTotalAmount] = useState('');
  const [token, setToken] = useState<TokenType>('native');
  const [chain, setChain] = useState<ChainId | ''>('');
  const [recipients, setRecipients] = useState<RecipientRow[]>([createRow(), createRow()]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SplitTipResult | null>(null);

  const addRecipient = () => {
    if (recipients.length >= 5) return;
    setRecipients([...recipients, createRow()]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length <= 2) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const updateRecipient = (id: string, field: keyof RecipientRow, value: string) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const evenSplit = () => {
    const pct = (100 / recipients.length).toFixed(2);
    // Give the remainder to the last recipient so they sum to exactly 100
    const lastPct = (100 - parseFloat(pct) * (recipients.length - 1)).toFixed(2);
    setRecipients(
      recipients.map((r, i) => ({
        ...r,
        percentage: i === recipients.length - 1 ? lastPct : pct,
      })),
    );
  };

  const percentages = recipients.map((r) => parseFloat(r.percentage) || 0);
  const totalPct = percentages.reduce((sum, p) => sum + p, 0);
  const pctValid = Math.abs(totalPct - 100) < 0.01;
  const totalAmountNum = parseFloat(totalAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || disabled) return;

    if (!totalAmount || totalAmountNum <= 0) {
      setError('Enter a valid total amount');
      return;
    }

    const validRecipients = recipients.filter((r) => r.address.trim());
    if (validRecipients.length < 2) {
      setError('At least 2 recipients with addresses are required');
      return;
    }

    if (!pctValid) {
      setError(`Percentages must sum to 100% (currently ${totalPct.toFixed(2)}%)`);
      return;
    }

    for (const r of validRecipients) {
      const pct = parseFloat(r.percentage);
      if (isNaN(pct) || pct <= 0) {
        setError(`Each recipient needs a percentage greater than 0`);
        return;
      }
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const splitRecipients: SplitRecipient[] = validRecipients.map((r) => ({
        address: r.address.trim(),
        percentage: parseFloat(r.percentage),
        name: r.name.trim() || undefined,
      }));

      const { result: splitResult } = await api.splitTip(
        splitRecipients,
        totalAmount,
        token,
        chain || undefined,
      );
      setResult(splitResult);
      onSplitComplete(splitResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
        <Scissors className="w-4 h-4 text-accent" />
        Split Tip
        <span className="text-xs text-text-muted font-normal ml-auto">{recipients.length} recipients</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Total Amount + Token + Chain */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Total Amount</label>
            <input
              type="text"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={token === 'usdt' ? '50' : '0.1'}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
              disabled={sending || disabled}
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Token</label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value as TokenType)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
              disabled={sending || disabled}
            >
              <option value="native">Native (ETH/TON)</option>
              <option value="usdt">USDT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Chain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as ChainId | '')}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
              disabled={sending || disabled || token === 'usdt'}
            >
              {token === 'usdt' ? (
                <option value="ethereum-sepolia">Ethereum Sepolia</option>
              ) : (
                <>
                  <option value="">Auto (AI decides)</option>
                  <option value="ethereum-sepolia">Ethereum Sepolia</option>
                  <option value="ton-testnet">TON Testnet</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Percentage distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-secondary">Distribution</label>
            <span className={`text-xs font-mono ${pctValid ? 'text-green-400' : totalPct > 100 ? 'text-red-400' : 'text-amber-400'}`}>
              {totalPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface-3 overflow-hidden flex">
            {recipients.map((r, i) => {
              const pct = parseFloat(r.percentage) || 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={r.id}
                  className={`${COLORS[i % COLORS.length]} transition-all duration-300`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                  title={`${r.name || r.address.slice(0, 8) || `Recipient ${i + 1}`}: ${pct}%`}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {recipients.map((r, i) => {
              const pct = parseFloat(r.percentage) || 0;
              const share = totalAmountNum > 0 ? ((totalAmountNum * pct) / 100).toFixed(6) : '0';
              return (
                <div key={r.id} className="flex items-center gap-1 text-[10px] text-text-muted">
                  <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                  <span>{r.name || `#${i + 1}`}:</span>
                  <span className="font-mono">{share}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Even Split button */}
        <button
          type="button"
          onClick={evenSplit}
          disabled={sending || disabled}
          className="w-full py-1.5 rounded-lg border border-dashed border-accent-border/40 text-xs text-accent hover:bg-accent-dim transition-colors flex items-center justify-center gap-1.5"
        >
          <Equal className="w-3.5 h-3.5" />
          Even Split ({(100 / recipients.length).toFixed(1)}% each)
        </button>

        {/* Recipients list */}
        <div className="space-y-3">
          {recipients.map((r, i) => {
            const pct = parseFloat(r.percentage) || 0;
            const share = totalAmountNum > 0 && pct > 0 ? ((totalAmountNum * pct) / 100).toFixed(6) : '';
            return (
              <div key={r.id} className="p-3 rounded-lg bg-surface-2 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
                    <span className="text-xs text-text-muted font-medium">Recipient {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {share && (
                      <span className="text-[10px] font-mono text-text-muted">
                        = {share} {token === 'usdt' ? 'USDT' : ''}
                      </span>
                    )}
                    {recipients.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.id)}
                        className="text-text-muted hover:text-error transition-colors"
                        disabled={sending || disabled}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={r.address}
                    onChange={(e) => updateRecipient(r.id, 'address', e.target.value)}
                    placeholder="0x... or UQ..."
                    className="sm:col-span-2 px-2.5 py-2 rounded-md bg-surface-3 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors font-mono"
                    disabled={sending || disabled}
                  />
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => updateRecipient(r.id, 'name', e.target.value)}
                    placeholder="Name (optional)"
                    className="px-2.5 py-2 rounded-md bg-surface-3 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
                    disabled={sending || disabled}
                  />
                  <div className="relative">
                    <input
                      type="text"
                      value={r.percentage}
                      onChange={(e) => updateRecipient(r.id, 'percentage', e.target.value)}
                      placeholder="50"
                      className="w-full px-2.5 py-2 pr-6 rounded-md bg-surface-3 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
                      disabled={sending || disabled}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {recipients.length < 5 && (
          <button
            type="button"
            onClick={addRecipient}
            disabled={sending || disabled}
            className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-text-secondary hover:text-text-primary hover:border-border-light transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recipient ({recipients.length}/5)
          </button>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
            <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 rounded-lg bg-accent-dim border border-accent-border space-y-2">
            <p className="text-xs text-accent font-medium">
              Split complete: {result.successCount}/{result.results.length} succeeded
            </p>
            <div className="space-y-1">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {r.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  )}
                  <span className="font-mono text-text-secondary truncate">{r.recipient.slice(0, 10)}...</span>
                  <span className="text-text-muted">{r.amount} ({r.percentage}%)</span>
                  {r.hash && (
                    <span className="font-mono text-text-muted truncate">tx: {r.hash.slice(0, 10)}...</span>
                  )}
                  {r.error && (
                    <span className="text-red-400 truncate">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!totalAmount || !pctValid || recipients.filter((r) => r.address.trim()).length < 2 || sending || disabled}
          className="w-full py-3 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Splitting Tip...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Split {totalAmount || '0'} Among {recipients.filter((r) => r.address.trim()).length} Recipients
            </>
          )}
        </button>
      </form>
    </div>
  );
}
