// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { Database, Search, RefreshCw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface IndexerHealth {
  available: boolean;
  latency?: number;
}

interface ChainInfo {
  blockchain: string;
  tokens: string[];
}

export function IndexerPanel() {
  const [health, setHealth] = useState<IndexerHealth | null>(null);
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Query state
  const [queryChain, setQueryChain] = useState('');
  const [queryToken, setQueryToken] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryResult, setQueryResult] = useState<{ balance: string } | null>(null);
  const [querying, setQuerying] = useState(false);

  // Transfers state
  const [transfers, setTransfers] = useState<Array<{ from: string; to: string; amount: string; timestamp: string }>>([]);

  const fetchData = useCallback(async () => {
    try {
      const [h, c] = await Promise.allSettled([
        api.getIndexerHealth(),
        api.getIndexerChains(),
      ]);
      if (h.status === 'fulfilled') {
        const hData = h.value as unknown as Record<string, unknown>;
        setHealth({ available: !!hData.available || !!hData.isAvailable, latency: (hData.latency as number) ?? 0 });
      }
      if (c.status === 'fulfilled') {
        const cData = c.value as { chains?: ChainInfo[] };
        setChains(cData.chains ?? []);
        if (cData.chains?.length) setQueryChain(cData.chains[0].blockchain);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleQuery = async () => {
    if (!queryChain || !queryToken || !queryAddress.trim()) return;
    setQuerying(true);
    setQueryResult(null);
    try {
      const result = await api.getIndexerBalance(queryChain, queryToken, queryAddress.trim());
      setQueryResult(result as unknown as { balance: string });

      // Also fetch transfers
      const txResult = await api.getIndexerTransfers(queryChain, queryToken, queryAddress.trim());
      const txData = txResult as unknown as { transfers?: Array<{ from: string; to: string; amount: string; timestamp: string }> };
      setTransfers((txData.transfers ?? []).slice(0, 5));
    } catch {
      setQueryResult({ balance: 'Error querying indexer' });
    }
    setQuerying(false);
  };

  const selectedChain = chains.find(c => c.blockchain === queryChain);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <Skeleton variant="card" height="120px" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          WDK Indexer
        </h2>
        <div className="flex items-center gap-2">
          {health && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${health.available ? 'text-green-400' : 'text-red-400'}`}>
              {health.available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {health.available ? 'Connected' : 'Unavailable'}
              {health.latency ? ` (${health.latency}ms)` : ''}
            </span>
          )}
          <button onClick={fetchData} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Supported chains */}
      {chains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {chains.map(c => (
            <span key={c.blockchain} className="px-2 py-0.5 rounded-full bg-surface-3 border border-border text-[10px] text-text-secondary">
              {c.blockchain}
            </span>
          ))}
        </div>
      )}

      {/* Query Form */}
      <div className="space-y-2 mb-4">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Query Balance</p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={queryChain}
            onChange={e => { setQueryChain(e.target.value); setQueryToken(''); }}
            className="px-2.5 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
          >
            {chains.map(c => <option key={c.blockchain} value={c.blockchain}>{c.blockchain}</option>)}
          </select>
          <select
            value={queryToken}
            onChange={e => setQueryToken(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
          >
            <option value="">Select token</option>
            {selectedChain?.tokens.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={queryAddress}
            onChange={e => setQueryAddress(e.target.value)}
            placeholder="Wallet address..."
            className="flex-1 px-2.5 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors font-mono"
          />
          <button
            onClick={handleQuery}
            disabled={querying || !queryChain || !queryToken || !queryAddress.trim()}
            className="px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 flex items-center gap-1 btn-press"
          >
            {querying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Query
          </button>
        </div>
      </div>

      {/* Query Result */}
      {queryResult && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/15 mb-4 animate-fade-in">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Balance</p>
          <p className="text-sm font-bold text-text-primary tabular-nums neon-glow">{queryResult.balance}</p>
          <p className="text-[10px] text-text-muted mt-1">{queryChain} / {queryToken}</p>
        </div>
      )}

      {/* Recent Transfers */}
      {transfers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recent Transfers</p>
          {transfers.map((tx, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2/50 text-[10px] animate-list-item-in" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="text-text-muted font-mono truncate max-w-[60px]">{tx.from.slice(0, 8)}...</span>
              <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
              <span className="text-text-muted font-mono truncate max-w-[60px]">{tx.to.slice(0, 8)}...</span>
              <span className="ml-auto text-text-primary font-semibold tabular-nums">{tx.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
