import { useState, useEffect, useCallback } from 'react';
import { Link2, Copy, Check, Trash2, ExternalLink, Loader2, QrCode, Share2, X } from 'lucide-react';
import { api } from '../lib/api';
import type { TipLink, TokenType, ChainId } from '../types';

export function TipLinkCreator() {
  const [collapsed, setCollapsed] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('native');
  const [message, setMessage] = useState('');
  const [chainId, setChainId] = useState<ChainId | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipLinks, setTipLinks] = useState<TipLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const { tipLinks: links } = await api.getTipLinks();
      setTipLinks(links);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    if (!collapsed) fetchLinks();
  }, [collapsed, fetchLinks]);

  const getFullUrl = (link: TipLink) => {
    return `${window.location.origin}${window.location.pathname}${link.url}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount.trim() || creating) return;

    setCreating(true);
    setError(null);

    try {
      const { tipLink } = await api.createTipLink(
        recipient.trim(),
        amount.trim(),
        token,
        message.trim() || undefined,
        chainId || undefined,
      );
      setTipLinks((prev) => [tipLink, ...prev]);
      setRecipient('');
      setAmount('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tip link');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTipLink(id);
      setTipLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleCopy = async (link: TipLink) => {
    const url = getFullUrl(link);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShareTwitter = (link: TipLink) => {
    const url = getFullUrl(link);
    const tokenLabel = link.token === 'usdt' ? 'USDT' : 'crypto';
    const text = `Send me a tip of ${link.amount} ${tokenLabel} via TipFlow! Powered by Tether WDK.`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = (link: TipLink) => {
    const url = getFullUrl(link);
    const tokenLabel = link.token === 'usdt' ? 'USDT' : 'crypto';
    const text = `Send me a tip of ${link.amount} ${tokenLabel} via TipFlow! ${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const getQRUrl = (link: TipLink) => {
    const url = getFullUrl(link);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-surface-2/50 transition-colors"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          Tip Links
          {tipLinks.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-xs font-medium text-cyan-400">
              {tipLinks.length}
            </span>
          )}
        </h2>
        <span className={`text-text-muted text-xs transition-transform ${collapsed ? '' : 'rotate-180'}`}>
          &#9660;
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
          {/* Create form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x... or UQ..."
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={token === 'usdt' ? '10.00' : '0.01'}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Token</label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value as TokenType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="native">Native (ETH/TON)</option>
                  <option value="usdt">USDT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Chain <span className="text-text-muted">(optional)</span>
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value as ChainId | '')}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="">Auto</option>
                <option value="ethereum-sepolia">Ethereum Sepolia</option>
                <option value="ton-testnet">TON Testnet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Message <span className="text-text-muted">(optional)</span>
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Thanks for your help!"
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>

            {error && (
              <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!recipient.trim() || !amount.trim() || creating}
              className="w-full py-2.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Create Tip Link
                </>
              )}
            </button>
          </form>

          {/* Created tip links list */}
          {tipLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-secondary">Created Links</h3>
              {tipLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3 rounded-lg bg-surface-2 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-text-primary">
                          {link.amount} {link.token === 'usdt' ? 'USDT' : 'Native'}
                        </span>
                        <span className="text-text-muted">to</span>
                        <span className="font-mono text-xs text-text-secondary truncate">
                          {link.recipient.slice(0, 8)}...{link.recipient.slice(-4)}
                        </span>
                      </div>
                      {link.message && (
                        <p className="text-sm text-text-muted mt-0.5 truncate">
                          &ldquo;{link.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Link URL */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm font-mono text-text-secondary truncate">
                      {getFullUrl(link)}
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className={`p-1.5 rounded-md transition-colors shrink-0 ${
                        copiedId === link.id
                          ? 'text-green-400 bg-green-500/10'
                          : 'text-text-muted hover:text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                      title="Copy link"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Share buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleCopy(link)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-3 border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleShareTwitter(link)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-3 border border-border text-xs font-medium text-text-secondary hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      X / Twitter
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(link)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-3 border border-border text-xs font-medium text-text-secondary hover:text-green-400 hover:border-green-500/30 transition-colors"
                    >
                      <Share2 className="w-3 h-3" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setShowQR(showQR === link.id ? null : link.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-3 border border-border text-xs font-medium text-text-secondary hover:text-purple-400 hover:border-purple-500/30 transition-colors"
                    >
                      <QrCode className="w-3 h-3" />
                      QR
                    </button>
                  </div>

                  {/* QR Code */}
                  {showQR === link.id && (
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white">
                      <img
                        src={getQRUrl(link)}
                        alt={`QR code for tip link ${link.id}`}
                        className="w-40 h-40"
                        loading="lazy"
                      />
                      <button
                        onClick={() => setShowQR(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Close
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-text-muted">
                    Created {new Date(link.createdAt).toLocaleString()}
                    {link.chainId && ` on ${link.chainId}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
