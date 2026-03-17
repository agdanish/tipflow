import { History, ExternalLink, CheckCircle2, XCircle, Brain, ChevronDown, Layers, Fuel } from 'lucide-react';
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
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          Transaction History
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-accent" />
        Transaction History
        {history.length > 0 && (
          <span className="text-[10px] text-text-muted font-normal ml-auto px-2 py-0.5 rounded-full bg-surface-3">
            {history.length} tip{history.length !== 1 ? 's' : ''}
          </span>
        )}
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-3">
            <History className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">No tips sent yet</p>
          <p className="text-xs text-text-muted mt-1">Transactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const explorerBase = entry.chainId.startsWith('ethereum')
              ? 'https://sepolia.etherscan.io/tx/'
              : 'https://testnet.tonviewer.com/transaction/';
            const isEth = entry.chainId.startsWith('ethereum');

            return (
              <div
                key={entry.id}
                className={`rounded-lg border overflow-hidden transition-colors ${
                  isExpanded
                    ? 'border-border-light bg-surface-2'
                    : 'border-border bg-surface-2'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
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
                      <span className="text-xs sm:text-sm font-semibold text-text-primary">
                        {formatNumber(entry.amount)} {entry.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON'}
                      </span>
                      <span className="text-[11px] sm:text-xs text-text-muted">to</span>
                      <span className="text-[11px] sm:text-xs text-text-secondary font-mono truncate sm:hidden">
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
                      <span className="text-[10px] sm:text-[11px] text-text-muted">
                        {isEth ? 'Ethereum Sepolia' : 'TON Testnet'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[10px] sm:text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
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
                          <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                            AI Decision
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {entry.reasoning}
                        </p>
                      </div>

                      {/* Metadata grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-surface-1 border border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Fuel className="w-3 h-3 text-warning" />
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">Gas Fee</span>
                          </div>
                          <p className="text-xs font-medium text-text-primary">{entry.fee}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-1 border border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Layers className="w-3 h-3 text-info" />
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">Network</span>
                          </div>
                          <p className="text-xs font-medium text-text-primary">
                            {isEth ? 'Ethereum Sepolia' : 'TON Testnet'}
                          </p>
                        </div>
                      </div>

                      {/* TX Hash */}
                      {entry.txHash && (
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[11px]">
                          <span className="text-text-muted">TX:</span>
                          <span className="text-text-secondary font-mono truncate">{entry.txHash}</span>
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
    </div>
  );
}
