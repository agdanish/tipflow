// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw, Clock, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { BridgeRoute, BridgeQuote, BridgeHistoryEntry } from '../types';

export function BridgePanel() {
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BridgeHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(true);

  // Form state
  const [fromChain, setFromChain] = useState('');
  const [toChain, setToChain] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getBridgeRoutes();
      setRoutes(res.routes);
      setAvailable(res.available);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.getBridgeHistory();
      setHistory(res.history);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    fetchHistory();
  }, [fetchRoutes, fetchHistory]);

  // Get unique chains from routes
  const fromChains = [...new Set(routes.map((r) => r.fromChain))];
  const toChains = fromChain
    ? [...new Set(routes.filter((r) => r.fromChain === fromChain).map((r) => r.toChain))]
    : [];

  const handleGetQuote = async () => {
    if (!fromChain || !toChain || !amount) return;
    setError('');
    setQuote(null);
    setQuoteLoading(true);
    try {
      const res = await api.getBridgeQuote(fromChain, toChain, amount);
      setQuote(res.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!fromChain || !toChain || !amount) return;
    setError('');
    setSuccess('');
    setExecuting(true);
    try {
      const res = await api.executeBridge(fromChain, toChain, amount);
      setSuccess(`Bridge intent logged (${res.bridge.id}). ${res.note}`);
      setQuote(null);
      setAmount('');
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute bridge');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          Cross-Chain Bridge (USDT0)
          {!available && (
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400">
              Testnet
            </span>
          )}
        </h2>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading bridge routes...
            </div>
          ) : (
            <>
              {/* Available Routes */}
              <div>
                <h3 className="text-xs font-medium text-text-secondary mb-2">Available Routes ({routes.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {routes.slice(0, 8).map((route, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-border text-xs cursor-pointer hover:border-cyan-500/30 transition-colors"
                      onClick={() => {
                        setFromChain(route.fromChain);
                        setToChain(route.toChain);
                      }}
                    >
                      <span className="font-medium text-text-primary">{route.fromChain}</span>
                      <ArrowRightLeft className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-medium text-text-primary">{route.toChain}</span>
                      <span className="ml-auto text-text-muted">{route.estimatedFee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bridge Form */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">Bridge USDT0</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">From Chain</label>
                    <select
                      value={fromChain}
                      onChange={(e) => {
                        setFromChain(e.target.value);
                        setToChain('');
                        setQuote(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="">Select chain</option>
                      {fromChains.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">To Chain</label>
                    <select
                      value={toChain}
                      onChange={(e) => {
                        setToChain(e.target.value);
                        setQuote(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-cyan-500/50"
                      disabled={!fromChain}
                    >
                      <option value="">Select chain</option>
                      {toChains.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Amount (USDT0)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setQuote(null);
                      }}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleGetQuote}
                    disabled={!fromChain || !toChain || !amount || quoteLoading}
                    className="px-4 py-2 rounded-lg bg-surface-2 border border-border text-sm font-medium text-text-primary hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {quoteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Get Quote
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={!fromChain || !toChain || !amount || executing}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    Bridge
                  </button>
                </div>
              </div>

              {/* Quote Result */}
              {quote && (
                <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3">
                  <h4 className="text-xs font-medium text-cyan-400 mb-2">Bridge Quote</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">Route:</span>
                      <span className="ml-1 text-text-primary">{quote.fromChain} &rarr; {quote.toChain}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Amount:</span>
                      <span className="ml-1 text-text-primary">{quote.amount} USDT0</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Fee:</span>
                      <span className="ml-1 text-text-primary">{quote.fee} USDT</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Est. Time:</span>
                      <span className="ml-1 text-text-primary">{quote.estimatedTime}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Rate:</span>
                      <span className="ml-1 text-text-primary">{quote.exchangeRate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error / Success Messages */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  {success}
                </div>
              )}

              {/* Bridge History */}
              {history.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-medium text-text-secondary mb-2">Bridge History</h3>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-surface-2 border border-border text-xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="text-text-primary font-medium">{entry.fromChain} &rarr; {entry.toChain}</span>
                        <span className="text-text-secondary">{entry.amount} USDT0</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          entry.status === 'completed'
                            ? 'bg-green-500/15 text-green-400'
                            : entry.status === 'failed'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
