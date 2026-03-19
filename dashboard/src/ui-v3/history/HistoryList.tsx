import { useState, useMemo } from 'react';
import { Search, X, Download, ChevronDown, ExternalLink, Copy, Check, Receipt, Brain, Loader2 } from 'lucide-react';
import type { TipHistoryEntry, TipReceipt } from '../../types';
import { shortenAddress, timeAgo, chainColor, formatNumber } from '../../lib/utils';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/EmptyState';
import { TipReceiptModal } from '../../components/TipReceipt';

interface HistoryListProps {
  history: TipHistoryEntry[];
  loading: boolean;
}

export function HistoryList({ history, loading }: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [receiptData, setReceiptData] = useState<TipReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<'all' | 'ethereum' | 'ton'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'failed'>('all');

  const filtered = useMemo(() => {
    let result = history;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((h) =>
        h.recipient.toLowerCase().includes(q) ||
        h.txHash.toLowerCase().includes(q) ||
        (h.chainId.startsWith('ethereum') ? 'ethereum' : 'ton').includes(q),
      );
    }
    if (chainFilter !== 'all') {
      result = result.filter((h) => chainFilter === 'ethereum' ? h.chainId.startsWith('ethereum') : h.chainId.startsWith('ton'));
    }
    if (statusFilter !== 'all') {
      result = result.filter((h) => h.status === statusFilter);
    }
    return result;
  }, [history, search, chainFilter, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = history.filter((h) => h.status === 'confirmed');
    const totalVolume = confirmed.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
    return { total: history.length, confirmed: confirmed.length, failed: history.length - confirmed.length, volume: totalVolume };
  }, [history]);

  const handleExport = async () => {
    setExporting(true);
    try { await api.exportHistory('csv'); } catch { /* silent */ }
    finally { setExporting(false); }
  };

  const handleCopyTx = async (txHash: string, id: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    } catch { /* silent */ }
  };

  const handleReceipt = async (entry: TipHistoryEntry) => {
    setLoadingReceipt(entry.id);
    try {
      const { receipt } = await api.getReceipt(entry.id);
      setReceiptData(receipt);
    } catch { /* silent */ }
    finally { setLoadingReceipt(null); }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-xl bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header + Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Transactions
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{stats.total} total · {stats.confirmed} confirmed · {stats.failed} failed</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || history.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm text-zinc-200 font-medium transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, tx hash..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={chainFilter}
          onChange={(e) => setChainFilter(e.target.value as 'all' | 'ethereum' | 'ton')}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="ton">TON</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'confirmed' | 'failed')}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All status</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="py-12">
          <EmptyState variant="no-tips" />
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isFailed = entry.status === 'failed';
            const isEth = entry.chainId.startsWith('ethereum');
            const isTron = entry.chainId.startsWith('tron');
            const token = entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : isTron ? 'TRX' : 'TON';
            const chainName = isEth ? 'Ethereum' : isTron ? 'Tron' : 'TON';
            const color = chainColor(entry.chainId);
            const explorerBase = isEth ? 'https://sepolia.etherscan.io/tx/' : isTron ? 'https://nile.tronscan.org/#/transaction/' : 'https://testnet.tonviewer.com/transaction/';

            return (
              <div key={entry.id} className={`rounded-xl transition-colors ${isFailed ? 'border-l-2 border-l-red-500 bg-red-500/3' : 'hover:bg-zinc-800/30'}`}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isFailed ? 'bg-red-500' : 'bg-emerald-500'}`} />

                  {/* Amount — primary visual weight */}
                  <span className="text-base font-bold text-white tabular-nums w-28 shrink-0">
                    {formatNumber(parseFloat(entry.amount), entry.token === 'usdt' ? 2 : 4)} <span className="text-xs font-medium text-zinc-400">{token}</span>
                  </span>

                  {/* Arrow + Recipient */}
                  <span className="text-zinc-600 shrink-0">→</span>
                  <span className="font-mono text-sm text-zinc-400 truncate min-w-0 flex-1">
                    {shortenAddress(entry.recipient, 6)}
                  </span>

                  {/* Chain */}
                  <span className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-zinc-500">{chainName}</span>
                  </span>

                  {/* Status / Time */}
                  <span className={`text-xs shrink-0 ${isFailed ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                    {isFailed ? 'Failed' : timeAgo(entry.createdAt)}
                  </span>

                  {/* Chevron */}
                  <ChevronDown className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail — FLAT, no nested cards */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-zinc-800/50 animate-slide-down">
                    {/* AI Reasoning */}
                    {entry.reasoning && (
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-zinc-300">{entry.reasoning}</p>
                      </div>
                    )}

                    {/* Memo */}
                    {entry.memo && (
                      <p className="text-sm text-zinc-400 italic pl-6">"{entry.memo}"</p>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 pl-6">
                      {entry.fee && <span>Fee: {entry.fee}</span>}
                      {entry.txHash && <span>Confirmed</span>}
                      <span>{chainName} {isEth ? 'Sepolia' : isTron ? 'Nile' : 'Testnet'}</span>
                    </div>

                    {/* TX hash + actions */}
                    <div className="flex items-center gap-2 pl-6 flex-wrap">
                      <span className="font-mono text-xs text-zinc-500 truncate max-w-[200px]">
                        {entry.txHash}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyTx(entry.txHash, entry.id); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        {copiedTxId === entry.id ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReceipt(entry); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        {loadingReceipt === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
                        Receipt
                      </button>
                      <a
                        href={`${explorerBase}${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" /> Explorer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {filtered.length > 0 && filtered.length !== history.length && (
        <p className="text-xs text-zinc-500 mt-3 text-center">
          Showing {filtered.length} of {history.length} transactions
        </p>
      )}

      {/* Receipt modal */}
      {receiptData && <TipReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />}
    </div>
  );
}
