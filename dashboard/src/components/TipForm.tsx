import { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainId, TipResult } from '../types';

interface TipFormProps {
  onTipComplete: (result: TipResult) => void;
  disabled: boolean;
}

export function TipForm({ onTipComplete, disabled }: TipFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState<ChainId | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || sending || disabled) return;

    setSending(true);
    setError(null);

    try {
      const { result } = await api.sendTip(
        recipient,
        amount,
        chain || undefined,
        message || undefined,
      );
      onTipComplete(result);
      setRecipient('');
      setAmount('');
      setMessage('');
      setChain('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const presetAmounts = ['0.001', '0.005', '0.01', '0.05'];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-accent" />
        Send Tip
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x... or UQ..."
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors font-mono"
            disabled={sending || disabled}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            disabled={sending || disabled}
          />
          <div className="flex gap-2 mt-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2.5 py-1 text-xs rounded-md bg-surface-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Chain Preference <span className="text-text-muted">(optional — agent decides if empty)</span>
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as ChainId | '')}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
            disabled={sending || disabled}
          >
            <option value="">Auto (AI decides)</option>
            <option value="ethereum-sepolia">Ethereum Sepolia</option>
            <option value="ton-testnet">TON Testnet</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Message <span className="text-text-muted">(optional)</span>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Great work on the PR!"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            disabled={sending || disabled}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
            <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!recipient || !amount || sending || disabled}
          className="w-full py-3 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Agent Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Tip
            </>
          )}
        </button>
      </form>
    </div>
  );
}
