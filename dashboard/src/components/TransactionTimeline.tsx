import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink, GitCommitHorizontal } from 'lucide-react';
import type { TipHistoryEntry } from '../types';
import { shortenAddress, timeAgo, chainColor } from '../lib/utils';

interface TransactionTimelineProps {
  history: TipHistoryEntry[];
  loading: boolean;
}

const PAGE_SIZE = 20;

export function TransactionTimeline({ history, loading }: TransactionTimelineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = history.slice(0, visibleCount);
  const hasMore = visibleCount < history.length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <GitCommitHorizontal className="w-4 h-4 text-accent" />
          Transaction Timeline
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-surface-3" />
                <div className="w-0.5 flex-1 bg-surface-3 mt-1" />
              </div>
              <div className="flex-1 pb-4">
                <div className="h-3 w-24 bg-surface-3 rounded mb-2" />
                <div className="h-3 w-40 bg-surface-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 text-left"
      >
        <GitCommitHorizontal className="w-4 h-4 text-accent" />
        <h2 className="text-base font-semibold text-text-primary flex-1">
          Transaction Timeline
        </h2>
        {history.length > 0 && (
          <span className="text-xs text-text-muted font-normal px-2 py-0.5 rounded-full bg-surface-3">
            {history.length} tx{history.length !== 1 ? 's' : ''}
          </span>
        )}
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {!collapsed && (
        <div className="mt-4">
          {history.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-muted">No transactions yet</p>
              <p className="text-xs text-text-muted mt-1">Send your first tip to see the timeline</p>
            </div>
          ) : (
            <>
              <div className="relative">
                {visible.map((entry, index) => {
                  const isEth = entry.chainId.startsWith('ethereum');
                  const token = entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON';
                  const chain = isEth ? 'Ethereum Sepolia' : 'TON Testnet';
                  const explorerBase = isEth
                    ? 'https://sepolia.etherscan.io/tx/'
                    : 'https://testnet.tonviewer.com/transaction/';
                  const isLast = index === visible.length - 1;
                  const delay = Math.min(index * 60, 600);

                  return (
                    <div
                      key={entry.id}
                      className="flex gap-3 animate-fade-in-up"
                      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
                    >
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center shrink-0 w-5">
                        {/* Status dot */}
                        <div
                          className={`w-3 h-3 rounded-full border-2 shrink-0 mt-1 ${
                            entry.status === 'confirmed'
                              ? 'bg-green-500 border-green-400 shadow-[0_0_6px_rgba(34,197,94,0.4)]'
                              : 'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                          }`}
                        />
                        {/* Connecting line */}
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-border my-1 min-h-[24px]" />
                        )}
                      </div>

                      {/* Content card */}
                      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                        <div className="rounded-lg border border-border bg-surface-2 p-3 hover:border-border-light transition-colors">
                          {/* Top row: amount + status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary">
                              {entry.amount} {token}
                            </span>
                            {entry.status === 'confirmed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            )}
                            {/* Chain badge */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border border-border bg-surface-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: chainColor(entry.chainId) }}
                              />
                              {chain}
                            </span>
                            {/* Time */}
                            <span
                              className="ml-auto text-xs text-text-muted cursor-default"
                              title={new Date(entry.createdAt).toLocaleString()}
                            >
                              {timeAgo(entry.createdAt)}
                            </span>
                          </div>

                          {/* Recipient + explorer link */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm text-text-muted">to</span>
                            <span className="text-sm font-mono text-text-secondary">
                              {shortenAddress(entry.recipient)}
                            </span>
                            {entry.txHash && (
                              <a
                                href={`${explorerBase}${entry.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-muted hover:text-accent transition-colors ml-auto"
                                title="View on explorer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Fee */}
                          <div className="text-xs text-text-muted mt-1">
                            Fee: {entry.fee}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="w-full mt-2 py-2 text-xs font-medium text-accent hover:text-accent-light bg-surface-2 border border-border rounded-lg hover:border-accent-border transition-colors"
                >
                  Load more ({history.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
