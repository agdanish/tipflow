import { useState } from 'react';
import { Send, Loader2, AlertCircle, Coins, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainId, TokenType, TipResult } from '../types';

interface TipFormProps {
  onTipComplete: (result: TipResult) => void;
  disabled: boolean;
}

export function TipForm({ onTipComplete, disabled }: TipFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('native');
  const [chain, setChain] = useState<ChainId | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NLP parsing state
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [nlpParsed, setNlpParsed] = useState(false);
  const [nlpSource, setNlpSource] = useState<'llm' | 'regex' | null>(null);
  const [nlpConfidence, setNlpConfidence] = useState(0);

  const handleNlpParse = async () => {
    if (!nlpInput.trim() || nlpParsing) return;

    setNlpParsing(true);
    setError(null);
    setNlpParsed(false);

    try {
      const { parsed, source } = await api.parseTipInput(nlpInput.trim());

      if (parsed.confidence === 0) {
        setError('Could not parse tip command. Try: "send 0.01 ETH to 0x..."');
        return;
      }

      // Auto-fill form fields from parsed result
      if (parsed.recipient) setRecipient(parsed.recipient);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.token) {
        setToken(parsed.token);
        if (parsed.token === 'usdt') setChain('ethereum-sepolia');
      }
      if (parsed.chain) setChain(parsed.chain as ChainId);
      if (parsed.message) setMessage(parsed.message);

      setNlpParsed(true);
      setNlpSource(source);
      setNlpConfidence(parsed.confidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse input');
    } finally {
      setNlpParsing(false);
    }
  };

  const handleNlpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNlpParse();
    }
  };

  const clearNlpState = () => {
    setNlpParsed(false);
    setNlpSource(null);
    setNlpConfidence(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || sending || disabled) return;

    setSending(true);
    setError(null);

    try {
      const { result } = await api.sendTip(
        recipient,
        amount,
        token,
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

  const presetAmounts = token === 'usdt' ? ['1', '5', '10', '25'] : ['0.001', '0.005', '0.01', '0.05'];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-accent" />
        Send Tip
      </h2>

      {/* NLP Natural Language Input */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <label className="text-xs text-text-secondary">Natural Language Command</label>
          {nlpParsed && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-medium text-purple-400">
              <Sparkles className="w-3 h-3" />
              {nlpSource === 'llm' ? 'AI' : 'Smart'} parsed &middot; {nlpConfidence}% confidence
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => { setNlpInput(e.target.value); clearNlpState(); }}
            onKeyDown={handleNlpKeyDown}
            placeholder='e.g. "send 0.01 ETH to 0x..."'
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
            disabled={sending || disabled || nlpParsing}
          />
          <button
            type="button"
            onClick={handleNlpParse}
            disabled={!nlpInput.trim() || nlpParsing || sending || disabled}
            className="px-3 sm:px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs sm:text-sm font-medium hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            {nlpParsing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Parse</span>
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1 hidden sm:block">
          Try: "send 0.01 ETH to 0x..." &middot; "tip 5 USDT to 0x..." &middot; "transfer 0.1 TON to UQ..."
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />
        <div className="flex justify-center -mt-2 mb-2">
          <span className="px-2 bg-surface-1 text-[10px] text-text-muted uppercase tracking-wider">or fill manually</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Token selector */}
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Token</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setToken('native'); setAmount(''); }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                token === 'native'
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface-2 text-text-secondary hover:border-border-light'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span className="sm:hidden">ETH/TON</span>
              <span className="hidden sm:inline">Native (ETH/TON)</span>
            </button>
            <button
              type="button"
              onClick={() => { setToken('usdt'); setAmount(''); setChain('ethereum-sepolia'); }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                token === 'usdt'
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface-2 text-text-secondary hover:border-border-light'
              }`}
            >
              <span className="text-xs font-bold">$</span>
              USDT
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={token === 'usdt' ? '0x...' : '0x... or UQ...'}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors font-mono"
            disabled={sending || disabled}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Amount {token === 'usdt' ? '(USDT)' : ''}
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={token === 'usdt' ? '10.00' : '0.01'}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            disabled={sending || disabled}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-md bg-surface-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                {token === 'usdt' ? `$${preset}` : preset}
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
            disabled={sending || disabled || token === 'usdt'}
          >
            {token === 'usdt' ? (
              <option value="ethereum-sepolia">Ethereum Sepolia (USDT)</option>
            ) : (
              <>
                <option value="">Auto (AI decides)</option>
                <option value="ethereum-sepolia">Ethereum Sepolia</option>
                <option value="ton-testnet">TON Testnet</option>
              </>
            )}
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
              Send {token === 'usdt' ? 'USDT' : ''} Tip
            </>
          )}
        </button>
      </form>
    </div>
  );
}
