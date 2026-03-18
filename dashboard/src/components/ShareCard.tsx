import { useState } from 'react';
import { ExternalLink, Copy, Check, X, Zap, Share2 } from 'lucide-react';
import type { TipResult } from '../types';

interface ShareCardProps {
  result: TipResult;
  onClose: () => void;
}

export function ShareCard({ result, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const chainLabel =
    result.chainId === 'ethereum-sepolia'
      ? 'Ethereum Sepolia'
      : result.chainId === 'ton-testnet'
      ? 'TON Testnet'
      : result.chainId;

  const tokenLabel = result.token === 'usdt' ? 'USDT' : result.chainId.includes('ton') ? 'TON' : 'ETH';

  const shareText = `I just sent ${result.amount} ${tokenLabel} on ${chainLabel} via TipFlow! Powered by Tether WDK.`;

  const handleShareTwitter = () => {
    const url = result.explorerUrl;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    const text = `${shareText}\n\nTx: ${result.explorerUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-200">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold tracking-tight">TipFlow</span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-white/70 text-xs uppercase tracking-wider">Tip Sent</p>
              <p className="text-3xl font-bold">
                {result.amount} {tokenLabel}
              </p>
              <p className="text-white/80 text-sm">
                on {chainLabel}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-surface-1 p-5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">To</span>
              <span className="font-mono text-text-secondary">
                {result.to.slice(0, 10)}...{result.to.slice(-6)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Fee</span>
              <span className="text-text-secondary">{result.fee}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Tx Hash</span>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-accent hover:underline flex items-center gap-1"
              >
                {result.txHash.slice(0, 10)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 border-t border-border text-center">
              <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-accent" />
                Powered by TipFlow + Tether WDK
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface-2 p-4 flex gap-2">
            <button
              onClick={handleShareTwitter}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1DA1F2] text-white text-xs font-medium hover:bg-[#1a8cd8] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share on X
            </button>
            <button
              onClick={handleCopyText}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-surface-3 border-border text-text-secondary hover:text-text-primary hover:border-border-light'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
