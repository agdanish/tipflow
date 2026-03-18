import { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Wallet, Film } from 'lucide-react';
import { api } from '../lib/api';
import type { WalletBalance } from '../types';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBalances()
      .then(({ balances: b }) => setBalances(b))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (dismissed) return null;

  const evmWallet = balances.find((b) => b.chainId === 'ethereum-sepolia');
  const address = evmWallet?.address ?? '';
  const balance = evmWallet?.nativeBalance ?? '0';

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative mb-4 sm:mb-6 rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-4 sm:p-5 overflow-hidden">
      {/* Gradient border glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/5 via-yellow-400/10 to-amber-400/5 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              Demo Mode
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-400 uppercase tracking-wide">
                Testnet
              </span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              All transactions use Sepolia/TON testnet. Funds are free.
            </p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 sm:static p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Details row */}
      <div className="relative mt-3 flex flex-col sm:flex-row gap-3 text-xs">
        {/* Wallet address */}
        {address && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1/50 border border-border/50">
            <Wallet className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-mono text-text-secondary truncate max-w-[200px]">
              {address.slice(0, 8)}...{address.slice(-6)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors"
              title="Copy address"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            {!loading && (
              <span className="text-text-muted">
                {parseFloat(balance).toFixed(4)} ETH
              </span>
            )}
          </div>
        )}

        {/* Faucet link */}
        <a
          href="https://faucets.chain.link/sepolia"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Get free Sepolia ETH
        </a>

        <a
          href="https://testnet.toncenter.com/faucet"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Get free TON
        </a>
      </div>
    </div>
  );
}
