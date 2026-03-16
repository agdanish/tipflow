import { History, ExternalLink, CheckCircle2, XCircle, Brain } from 'lucide-react';
import type { TipHistoryEntry } from '../types';
import { shortenAddress, timeAgo, chainColor, formatNumber } from '../lib/utils';
import { useState } from 'react';

interface TipHistoryProps {
  history: TipHistoryEntry[];
  loading: boolean;
}

export function TipHistory({ history, loading }: TipHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          Transaction History
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-accent" />
        Transaction History
        {history.length > 0 && (
          <span className="text-xs text-text-muted font-normal ml-auto">{history.length} tips</span>
        )}
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">No tips sent yet</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const explorerBase = entry.chainId.startsWith('ethereum')
              ? 'https://sepolia.etherscan.io/tx/'
              : 'https://testnet.tonviewer.com/transaction/';

            return (
              <div key={entry.id} className="rounded-lg border border-border bg-surface-2 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-surface-3/50 transition-colors text-left"
                >
                  {entry.status === 'confirmed' ? (
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error shrink-0" />
                  )}

                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: chainColor(entry.chainId) }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {formatNumber(entry.amount)} {entry.chainId.startsWith('ethereum') ? 'ETH' : 'TON'}
                      </span>
                      <span className="text-xs text-text-muted">→</span>
                      <span className="text-xs text-text-secondary font-mono truncate">
                        {shortenAddress(entry.recipient)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
                    {entry.txHash && (
                      <a
                        href={`${explorerBase}${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-text-muted hover:text-accent transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border">
                    <div className="pt-3 space-y-2">
                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-surface-1">
                        <Brain className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-text-secondary leading-relaxed">{entry.reasoning}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-text-muted">Fee:</span>{' '}
                          <span className="text-text-secondary">{entry.fee}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Chain:</span>{' '}
                          <span className="text-text-secondary">
                            {entry.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
