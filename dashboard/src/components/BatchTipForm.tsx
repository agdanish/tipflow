import { useState } from 'react';
import { Users, Plus, Trash2, Loader2, AlertCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainId, TokenType, TipResult, BatchTipResult } from '../types';

interface BatchTipFormProps {
  onBatchComplete: (results: TipResult[]) => void;
  disabled: boolean;
}

interface Recipient {
  id: string;
  address: string;
  amount: string;
  message: string;
}

let nextId = 1;
function createRecipient(): Recipient {
  return { id: String(nextId++), address: '', amount: '', message: '' };
}

export function BatchTipForm({ onBatchComplete, disabled }: BatchTipFormProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([createRecipient(), createRecipient()]);
  const [token, setToken] = useState<TokenType>('native');
  const [chain, setChain] = useState<ChainId | ''>('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchTipResult | null>(null);

  const addRecipient = () => {
    if (recipients.length >= 10) return;
    setRecipients([...recipients, createRecipient()]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length <= 2) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRecipients = recipients.filter((r) => r.address && r.amount);
    if (validRecipients.length === 0 || sending || disabled) return;

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const { result: batchResult } = await api.sendBatchTip(
        validRecipients.map((r) => ({
          address: r.address,
          amount: r.amount,
          message: r.message || undefined,
        })),
        token,
        chain || undefined,
      );
      setResult(batchResult);
      onBatchComplete(batchResult.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const validCount = recipients.filter((r) => r.address && r.amount).length;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" />
        Batch Tip
        <span className="text-xs text-text-muted font-normal ml-auto">{recipients.length} recipients</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Token + Chain */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Recipients list */}
        <div className="space-y-3">
          {recipients.map((r, i) => (
            <div key={r.id} className="p-3 rounded-lg bg-surface-2 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Recipient {i + 1}</span>
                {recipients.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.id)}
                    className="text-text-muted hover:text-error transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                  value={r.amount}
                  onChange={(e) => updateRecipient(r.id, 'amount', e.target.value)}
                  placeholder={token === 'usdt' ? '$10' : '0.01'}
                  className="px-2.5 py-2 rounded-md bg-surface-3 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
                  disabled={sending || disabled}
                />
              </div>
            </div>
          ))}
        </div>

        {recipients.length < 10 && (
          <button
            type="button"
            onClick={addRecipient}
            className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-text-secondary hover:text-text-primary hover:border-border-light transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recipient
          </button>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
            <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 rounded-lg bg-accent-dim border border-accent-border">
            <p className="text-xs text-accent font-medium">
              Batch complete: {result.succeeded}/{result.total} succeeded
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Total: {result.totalAmount} | Fees: {result.totalFees}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={validCount === 0 || sending || disabled}
          className="w-full py-3 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Batch...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send {validCount} Tips
            </>
          )}
        </button>
      </form>
    </div>
  );
}
