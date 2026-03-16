import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { WalletBalance } from '../types';
import { shortenAddress, copyToClipboard, formatNumber, chainColor } from '../lib/utils';

interface WalletCardProps {
  balance: WalletBalance;
}

export function WalletCard({ balance }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const isEth = balance.chainId.startsWith('ethereum');
  const color = chainColor(balance.chainId);

  const handleCopy = async () => {
    const ok = await copyToClipboard(balance.address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerBase = isEth
    ? 'https://sepolia.etherscan.io/address/'
    : 'https://testnet.tonviewer.com/';

  const hasUsdt = balance.usdtBalance !== '0.000000' && balance.usdtBalance !== '0';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {isEth ? 'ETH' : 'TON'}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {isEth ? 'Ethereum Sepolia' : 'TON Testnet'}
            </p>
            <p className="text-xs text-text-muted">Testnet</p>
          </div>
        </div>
        <a
          href={`${explorerBase}${balance.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-text-muted mb-1">Native Balance</p>
          <p className="text-2xl font-semibold text-text-primary">
            {formatNumber(balance.nativeBalance)}{' '}
            <span className="text-sm text-text-secondary">{balance.nativeCurrency}</span>
          </p>
        </div>

        <div>
          <p className="text-xs text-text-muted mb-1">USDT Balance</p>
          <p className={`text-lg font-medium ${hasUsdt ? 'text-accent' : 'text-text-muted'}`}>
            {hasUsdt ? formatNumber(balance.usdtBalance, 2) : '0.00'}{' '}
            <span className="text-sm">USDT</span>
          </p>
        </div>

        <div className="pt-2 border-t border-border">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors group w-full"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Copy className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
            )}
            <span className="font-mono truncate">{shortenAddress(balance.address, 8)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
