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
  const isTron = balance.chainId.startsWith('tron');
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
    : isTron
      ? 'https://nile.tronscan.org/#/address/'
      : 'https://testnet.tonviewer.com/';

  const hasUsdt = balance.usdtBalance !== '0.000000' && balance.usdtBalance !== '0';

  return (
    <div className={`rounded-xl border border-border bg-surface-1 p-4 sm:p-5 card-hover ${isEth ? 'chain-gradient-eth' : isTron ? 'chain-gradient-tron' : 'chain-gradient-ton'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg"
            style={{
              backgroundColor: color,
              boxShadow: `0 4px 12px ${color}33`,
            }}
          >
            {isEth ? 'ETH' : isTron ? 'TRX' : 'TON'}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {isEth ? 'Ethereum Sepolia' : isTron ? 'Tron Nile' : 'TON Testnet'}
            </p>
            <p className="text-[11px] text-text-muted">Testnet</p>
          </div>
        </div>
        <a
          href={`${explorerBase}${balance.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-text-muted mb-1 uppercase tracking-wider">Native Balance</p>
          <p className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight tabular-nums">
            {formatNumber(balance.nativeBalance)}{' '}
            <span className="text-sm font-medium text-text-secondary">{balance.nativeCurrency}</span>
          </p>
        </div>

        <div>
          <p className="text-[11px] text-text-muted mb-1 uppercase tracking-wider">USDT Balance</p>
          <p className={`text-lg font-semibold tabular-nums ${hasUsdt ? 'text-accent value-glow-accent' : 'text-text-muted'}`}>
            {hasUsdt ? formatNumber(balance.usdtBalance, 2) : '0.00'}{' '}
            <span className="text-sm font-medium">USDT</span>
          </p>
        </div>

        <div className="pt-3 border-t border-border">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs w-full py-1.5 px-2 rounded-md transition-all ${
              copied
                ? 'bg-accent/10 text-accent animate-copy-flash'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" />
                <span className="font-medium text-accent">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-mono truncate sm:hidden">{shortenAddress(balance.address, 4)}</span>
                <span className="font-mono truncate hidden sm:inline">{shortenAddress(balance.address, 8)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
