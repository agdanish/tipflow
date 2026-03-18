import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, Hash } from 'lucide-react';
import { api } from '../lib/api';
import type { DerivedWallet, ChainId } from '../types';

interface WalletSwitcherProps {
  chain?: ChainId;
  onActiveChanged?: (index: number) => void;
}

export function WalletSwitcher({ chain = 'ethereum-sepolia', onActiveChanged }: WalletSwitcherProps) {
  const [wallets, setWallets] = useState<DerivedWallet[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [count, setCount] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { wallets: w, activeIndex: idx } = await api.listWallets(chain, count);
      setWallets(w);
      setActiveIndex(idx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [chain, count]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSetActive = async (index: number) => {
    if (index === activeIndex) return;
    setSetting(index);
    try {
      const { activeIndex: newIdx } = await api.setActiveWallet(index);
      setActiveIndex(newIdx);
      setWallets((prev) => prev.map((w) => ({ ...w, isActive: w.index === newIdx })));
      onActiveChanged?.(newIdx);
    } catch {
      // revert on error
    } finally {
      setSetting(null);
    }
  };

  const handleShowMore = () => {
    setCount((prev) => prev + 5);
  };

  const truncateAddr = (addr: string) =>
    addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-accent" />
          <span className="text-text-secondary font-medium">HD Wallets</span>
          <span className="text-xs text-text-muted">
            (active: #{activeIndex})
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(false)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-text-primary">HD Wallets</span>
          <span className="text-xs text-text-muted">BIP-44 derivation</span>
        </div>
        <ChevronUp className="w-4 h-4 text-text-muted" />
      </button>

      {/* Content */}
      <div className="px-4 pb-4">
        {loading && wallets.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-text-muted text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Deriving wallets...
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="space-y-1.5">
              {wallets.map((w) => {
                const isActive = w.index === activeIndex;
                const isSetting = setting === w.index;
                return (
                  <button
                    key={w.index}
                    onClick={() => handleSetActive(w.index)}
                    disabled={isSetting}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-accent/10 border border-accent/30'
                        : 'border border-transparent hover:bg-surface-2 hover:border-border'
                    }`}
                  >
                    {/* Index badge */}
                    <span
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'bg-surface-3 text-text-secondary'
                      }`}
                    >
                      {w.index}
                    </span>

                    {/* Address */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-text-primary truncate">
                        {truncateAddr(w.address)}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        m/44'/60'/0'/0/{w.index}
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="shrink-0">
                      {isSetting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      ) : isActive ? (
                        <Check className="w-4 h-4 text-accent" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show more button */}
            <button
              onClick={handleShowMore}
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-text-secondary hover:text-accent hover:bg-surface-2 border border-border transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>Show more wallets</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
