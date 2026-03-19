import type { WalletBalance } from '../../types';
import { formatNumber, chainColor, shortenAddress, copyToClipboard } from '../../lib/utils';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedNumber';
import { Skeleton } from '../../components/Skeleton';

interface WalletStripProps {
  balances: WalletBalance[];
  loading: boolean;
}

function WalletPill({ balance }: { balance: WalletBalance }) {
  const [copied, setCopied] = useState(false);
  const isEth = balance.chainId.includes('ethereum');
  const isTron = balance.chainId.includes('tron');
  const isTon = balance.chainId.includes('ton');
  const color = chainColor(balance.chainId);
  const animatedNative = useAnimatedValue(parseFloat(balance.nativeBalance) || 0, 800);
  const animatedUsdt = useAnimatedValue(parseFloat(balance.usdtBalance) || 0, 800);
  const hasUsdt = parseFloat(balance.usdtBalance) > 0;

  const explorerBase = isEth ? 'https://sepolia.etherscan.io/address/' : isTron ? 'https://nile.tronscan.org/#/address/' : 'https://testnet.tonviewer.com/';
  const chainLabel = isEth ? 'ETH' : isTron ? 'TRX' : isTon ? 'TON' : balance.chainId.includes('bitcoin') ? 'BTC' : 'SOL';

  const handleCopy = async () => {
    const ok = await copyToClipboard(balance.address);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  return (
    <div className="flex-shrink-0 w-56 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
          {chainLabel}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200">{isEth ? 'Ethereum' : isTron ? 'Tron' : isTon ? 'TON' : chainLabel}</p>
        </div>
        <a href={`${explorerBase}${balance.address}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-white tabular-nums">{formatNumber(animatedNative)} <span className="text-xs text-zinc-500">{balance.nativeCurrency}</span></p>
        {hasUsdt && <p className="text-sm font-medium text-emerald-400 tabular-nums">{formatNumber(animatedUsdt, 2)} <span className="text-xs">USDT</span></p>}
      </div>
      <button onClick={handleCopy} className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        <span className="font-mono">{shortenAddress(balance.address, 4)}</span>
      </button>
    </div>
  );
}

export function WalletStrip({ balances, loading }: WalletStripProps) {
  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Wallets</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-56 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6" data-onboarding="wallets">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Wallets</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {balances.map(b => <WalletPill key={b.chainId} balance={b} />)}
      </div>
    </div>
  );
}
