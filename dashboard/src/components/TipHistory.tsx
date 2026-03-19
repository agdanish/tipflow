import { History, ExternalLink, CheckCircle2, XCircle, Brain, ChevronDown, Layers, Fuel, Download, Share2, Check, Search, X, BarChart3, TrendingUp, Percent, Coins, Receipt, MessageSquare, Copy } from 'lucide-react';
import type { TipHistoryEntry, TipReceipt } from '../types';
import { shortenAddress, timeAgo, chainColor, formatNumber } from '../lib/utils';
import { api } from '../lib/api';
import { useState, useMemo } from 'react';
import { EmptyState } from './EmptyState';
import { TipHistorySkeleton } from './Skeleton';
import { TipReceiptModal } from './TipReceipt';

interface TipHistoryProps {
  history: TipHistoryEntry[];
  loading: boolean;
}

type ChainFilter = 'all' | 'ethereum' | 'ton';
type StatusFilter = 'all' | 'confirmed' | 'failed';

export function TipHistory({ history, loading }: TipHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [receiptData, setReceiptData] = useState<TipReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<ChainFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const hasActiveFilters = search || chainFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch('');
    setChainFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // Client-side filtering (real-time as user types)
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
      result = result.filter((h) => {
        if (chainFilter === 'ethereum') return h.chainId.startsWith('ethereum');
        return h.chainId.startsWith('ton');
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter((h) => h.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (!isNaN(from)) {
        result = result.filter((h) => new Date(h.createdAt).getTime() >= from);
      }
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      if (!isNaN(to)) {
        result = result.filter((h) => new Date(h.createdAt).getTime() <= to + 86400000);
      }
    }

    return result;
  }, [history, search, chainFilter, statusFilter, dateFrom, dateTo]);

  // Stats computed from full history
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const confirmed = history.filter((h) => h.status === 'confirmed');
    const totalVolume = confirmed.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
    const totalFees = confirmed.reduce((sum, h) => {
      const feeNum = parseFloat(h.fee?.replace(/[^0-9.]/g, '') || '0');
      return sum + (isNaN(feeNum) ? 0 : feeNum);
    }, 0);
    const successRate = history.length > 0
      ? Math.round((confirmed.length / history.length) * 100)
      : 0;
    return {
      totalTips: history.length,
      totalVolume,
      successRate,
      avgFee: confirmed.length > 0 ? totalFees / confirmed.length : 0,
    };
  }, [history]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportHistory('csv');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async (entry: TipHistoryEntry) => {
    const isEth = entry.chainId.startsWith('ethereum');
    const token = entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON';
    const chain = isEth ? 'Ethereum Sepolia' : 'TON Testnet';
    const explorerBase = isEth
      ? 'https://sepolia.etherscan.io/tx/'
      : 'https://testnet.tonviewer.com/transaction/';
    const explorerUrl = `${explorerBase}${entry.txHash}`;
    const lines = [
      `--- TipFlow Transaction Receipt ---`,
      `Amount: ${entry.amount} ${token}`,
      `Chain: ${chain}`,
      `Recipient: ${entry.recipient}`,
      `TX Hash: ${entry.txHash}`,
      `Fee: ${entry.fee}`,
      `Status: ${entry.status === 'confirmed' ? 'Confirmed' : 'Failed'}`,
      entry.memo ? `Memo: ${entry.memo}` : '',
      `Explorer: ${explorerUrl}`,
      ``,
      `Powered by TipFlow + Tether WDK`,
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };

  const handleReceipt = async (entry: TipHistoryEntry) => {
    setLoadingReceipt(entry.id);
    try {
      const { receipt } = await api.getReceipt(entry.id);
      setReceiptData(receipt);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setLoadingReceipt(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          Transaction History
        </h2>
        <TipHistorySkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
        <History className="w-4 h-4 text-accent" />
        Transaction History
        {history.length > 0 && (
          <>
            <span className="text-xs text-text-muted font-normal ml-auto px-2 py-0.5 rounded-full bg-surface-3">
              {history.length} tip{history.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-text-muted hover:text-accent bg-surface-3 hover:bg-surface-3/80 rounded-full transition-colors disabled:opacity-50"
              title="Export tip history as CSV"
            >
              <Download className="w-3 h-3" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </>
        )}
      </h2>

      {/* Stats Summary Bar */}
      {stats && stats.totalTips > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-2 border border-border">
            <BarChart3 className="w-3 h-3 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider leading-none">Tips</p>
              <p className="text-xs font-semibold text-text-primary">{stats.totalTips}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-2 border border-border">
            <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider leading-none">Volume</p>
              <p className="text-xs font-semibold text-text-primary">{formatNumber(stats.totalVolume)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-2 border border-border">
            <Percent className="w-3 h-3 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider leading-none">Success</p>
              <p className="text-xs font-semibold text-text-primary">{stats.successRate}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-2 border border-border">
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider leading-none">Avg Fee</p>
              <p className="text-xs font-semibold text-text-primary">{stats.avgFee.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      {history.length > 0 && (
        <div className="space-y-2 mb-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by address, tx hash, or chain..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Chain filters */}
            {(['all', 'ethereum', 'ton'] as ChainFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setChainFilter(f)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  chainFilter === f
                    ? 'border-accent bg-accent-dim text-accent'
                    : 'border-border bg-surface-2 text-text-muted hover:text-text-secondary hover:border-border-light'
                }`}
              >
                {f === 'all' ? 'All Chains' : f === 'ethereum' ? 'Ethereum' : 'TON'}
              </button>
            ))}

            <span className="w-px h-4 bg-border mx-0.5" />

            {/* Status filters */}
            {(['all', 'confirmed', 'failed'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === f
                    ? f === 'confirmed'
                      ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : f === 'failed'
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-accent bg-accent-dim text-accent'
                    : 'border-border bg-surface-2 text-text-muted hover:text-text-secondary hover:border-border-light'
                }`}
              >
                {f === 'all' ? 'All Status' : f === 'confirmed' ? 'Success' : 'Failed'}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
              placeholder="From"
            />
            <span className="text-xs text-text-muted">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
              placeholder="To"
            />
          </div>

          {/* Result count + clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {filtered.length} of {history.length} tip{history.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <EmptyState variant="no-tips" />
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
          <Search className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-muted">No tips match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-accent hover:text-accent-light transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Transaction history list">
          {filtered.map((entry, idx) => {
            const isExpanded = expandedId === entry.id;
            const explorerBase = entry.chainId.startsWith('ethereum')
              ? 'https://sepolia.etherscan.io/tx/'
              : 'https://testnet.tonviewer.com/transaction/';
            const isEth = entry.chainId.startsWith('ethereum');

            return (
              <div
                key={entry.id}
                role="listitem"
                className={`rounded-lg border overflow-hidden transition-colors card-hover animate-list-item-in ${
                  isExpanded
                    ? 'border-border-light bg-surface-2'
                    : 'border-border bg-surface-2'
                } ${entry.status === 'failed' ? 'border-l-2 border-l-red-500' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  aria-expanded={isExpanded}
                  aria-label={`${entry.status === 'confirmed' ? 'Confirmed' : 'Failed'} tip of ${entry.amount} — click to ${isExpanded ? 'collapse' : 'expand'} details`}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3 hover:bg-surface-3/50 transition-colors text-left"
                >
                  {entry.status === 'confirmed' ? (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                      <XCircle className="w-3.5 h-3.5 text-error" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-base font-semibold text-text-primary">
                        {formatNumber(entry.amount)} {entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON'}
                      </span>
                      <span className="text-sm sm:text-xs text-text-muted">to</span>
                      <span className="text-sm sm:text-xs text-text-secondary font-mono truncate sm:hidden">
                        {shortenAddress(entry.recipient, 4)}
                      </span>
                      <span className="text-xs text-text-secondary font-mono truncate hidden sm:inline">
                        {shortenAddress(entry.recipient)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: chainColor(entry.chainId) }}
                      />
                      <span className="text-xs sm:text-sm text-text-muted">
                        {isEth ? 'Ethereum Sepolia' : 'TON Testnet'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${
                      entry.status === 'confirmed'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      {entry.status === 'confirmed' ? 'Confirmed' : 'Failed'}
                    </span>
                    <span className="text-xs sm:text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
                    {entry.txHash && (
                      <a
                        href={`${explorerBase}${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="View transaction on block explorer"
                        className="text-text-muted hover:text-accent transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="animate-slide-down border-t border-border">
                    <div className="px-4 py-4 space-y-3">
                      {/* AI Reasoning card */}
                      <div className="p-3.5 rounded-lg bg-gradient-to-br from-purple-500/8 via-surface-1 to-surface-1 border border-purple-500/15">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                            AI Decision
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {entry.reasoning}
                        </p>
                      </div>

                      {/* Memo */}
                      {entry.memo && (
                        <div className="p-3 rounded-lg bg-surface-1 border border-border">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageSquare className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs text-text-muted uppercase tracking-wider">Memo</span>
                          </div>
                          <p className="text-xs text-text-secondary italic">{entry.memo}</p>
                        </div>
                      )}

                      {/* Metadata grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-1 border border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Fuel className="w-3 h-3 text-warning" />
                            <span className="text-xs text-text-muted uppercase tracking-wider">Gas Fee</span>
                          </div>
                          <p className="text-xs font-medium text-text-primary">{entry.fee}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-1 border border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Layers className="w-3 h-3 text-info" />
                            <span className="text-xs text-text-muted uppercase tracking-wider">Network</span>
                          </div>
                          <p className="text-xs font-medium text-text-primary">
                            {isEth ? 'Ethereum Sepolia' : 'TON Testnet'}
                          </p>
                        </div>
                      </div>

                      {/* TX Hash + Copy + Share */}
                      {entry.txHash && (
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                          <span className="text-text-muted">TX:</span>
                          <span className="text-text-secondary font-mono truncate flex-1">{entry.txHash}</span>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(entry.txHash);
                                setCopiedTxId(entry.id);
                                setTimeout(() => setCopiedTxId(null), 2000);
                              } catch { /* silent */ }
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-muted hover:text-accent bg-surface-3 hover:bg-surface-3/80 rounded-md transition-colors shrink-0"
                            title="Copy transaction hash"
                          >
                            {copiedTxId === entry.id ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy TX
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReceipt(entry)}
                            disabled={loadingReceipt === entry.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-muted hover:text-accent bg-surface-3 hover:bg-surface-3/80 rounded-md transition-colors shrink-0 disabled:opacity-50"
                            title="View receipt"
                          >
                            <Receipt className={`w-3 h-3 ${loadingReceipt === entry.id ? 'animate-pulse' : ''}`} />
                            Receipt
                          </button>
                          <button
                            onClick={() => handleShare(entry)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-muted hover:text-accent bg-surface-3 hover:bg-surface-3/80 rounded-md transition-colors shrink-0"
                            title="Copy share text to clipboard"
                          >
                            {copiedId === entry.id ? (
                              <>
                                <Check className="w-3 h-3 text-accent" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3" />
                                Share
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <TipReceiptModal
          receipt={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
