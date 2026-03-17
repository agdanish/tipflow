// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, ChevronDown, ChevronUp, Loader2, AlertTriangle, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import type { LendingRate, LendingPosition } from '../types';

export function LendingPanel() {
  const [rates, setRates] = useState<LendingRate[]>([]);
  const [position, setPosition] = useState<LendingPosition | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  // Form state
  const [actionType, setActionType] = useState<'supply' | 'withdraw'>('supply');
  const [chain, setChain] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDT');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLendingRates();
      setRates(res.rates);
      setAvailable(res.available);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosition = useCallback(async () => {
    try {
      const res = await api.getLendingPosition();
      setPosition(res.position);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchPosition();
  }, [fetchRates, fetchPosition]);

  // Get unique chains and assets from rates
  const chains = [...new Set(rates.map((r) => r.chain))];
  const assets = [...new Set(rates.map((r) => r.asset))];

  // Filter rates by selected asset
  const filteredRates = asset
    ? rates.filter((r) => r.asset === asset)
    : rates;

  const handleExecute = async () => {
    if (!chain || !amount) return;
    setError('');
    setSuccess('');
    setExecuting(true);
    try {
      if (actionType === 'supply') {
        const res = await api.lendingSupply(chain, amount, asset);
        setSuccess(`Supply intent logged (${res.action.id}). ${res.note}`);
      } else {
        const res = await api.lendingWithdraw(chain, amount, asset);
        setSuccess(`Withdraw intent logged (${res.action.id}). ${res.note}`);
      }
      setAmount('');
      fetchPosition();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${actionType}`);
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
          <TrendingUp className="w-4 h-4 text-green-400" />
          DeFi Lending (Aave V3)
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
              Loading Aave V3 rates...
            </div>
          ) : (
            <>
              {/* Current Position */}
              {position && (
                <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                  <h3 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Active Position
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">Supplied:</span>
                      <span className="ml-1 text-text-primary font-medium">{position.supplied} {position.asset}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Chain:</span>
                      <span className="ml-1 text-text-primary">{position.chain}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">APY:</span>
                      <span className="ml-1 text-green-400 font-medium">{position.apy.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Earned:</span>
                      <span className="ml-1 text-green-400">{position.earned} {position.asset}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset filter tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border">
                {assets.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAsset(a)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      asset === a
                        ? 'bg-surface-3 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Yield Rates Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-text-secondary">
                    Aave V3 Rates ({filteredRates.length})
                  </h3>
                  <button
                    onClick={fetchRates}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary transition-colors"
                    title="Refresh rates"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-text-muted border-b border-border">
                        <th className="text-left py-2 pr-3 font-medium">Chain</th>
                        <th className="text-right py-2 px-3 font-medium">Supply APY</th>
                        <th className="text-right py-2 px-3 font-medium">Borrow APY</th>
                        <th className="text-right py-2 px-3 font-medium hidden sm:table-cell">TVL</th>
                        <th className="text-right py-2 pl-3 font-medium hidden sm:table-cell">Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRates.map((rate, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/50 hover:bg-surface-2/50 cursor-pointer transition-colors"
                          onClick={() => setChain(rate.chain)}
                        >
                          <td className="py-2 pr-3 text-text-primary font-medium">{rate.chain}</td>
                          <td className="py-2 px-3 text-right text-green-400 font-medium">{rate.supplyApy.toFixed(2)}%</td>
                          <td className="py-2 px-3 text-right text-amber-400">{rate.borrowApy.toFixed(2)}%</td>
                          <td className="py-2 px-3 text-right text-text-secondary hidden sm:table-cell">{rate.totalSupply}</td>
                          <td className="py-2 pl-3 text-right hidden sm:table-cell">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-12 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    rate.utilizationRate > 80 ? 'bg-red-400' : rate.utilizationRate > 60 ? 'bg-amber-400' : 'bg-green-400'
                                  }`}
                                  style={{ width: `${Math.min(100, rate.utilizationRate)}%` }}
                                />
                              </div>
                              <span className="text-text-muted">{rate.utilizationRate.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supply / Withdraw Form */}
              <div className="border-t border-border pt-4">
                <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border mb-3">
                  <button
                    onClick={() => setActionType('supply')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      actionType === 'supply'
                        ? 'bg-green-500/15 text-green-400 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Supply
                  </button>
                  <button
                    onClick={() => setActionType('withdraw')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      actionType === 'withdraw'
                        ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Chain</label>
                    <select
                      value={chain}
                      onChange={(e) => setChain(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-green-500/50"
                    >
                      <option value="">Select chain</option>
                      {chains.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Asset</label>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-green-500/50"
                    >
                      {assets.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={!chain || !amount || executing}
                  className={`mt-3 w-full sm:w-auto px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 ${
                    actionType === 'supply'
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {executing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : actionType === 'supply' ? (
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                  )}
                  {actionType === 'supply' ? 'Supply to Aave V3' : 'Withdraw from Aave V3'}
                </button>
              </div>

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

              {/* Yield Analytics Summary */}
              {filteredRates.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-medium text-text-secondary mb-2">Yield Summary</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-surface-2 border border-border p-3 text-center">
                      <p className="text-[10px] text-text-muted mb-1">Best APY</p>
                      <p className="text-lg font-bold text-green-400">
                        {Math.max(...filteredRates.map((r) => r.supplyApy)).toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-2 border border-border p-3 text-center">
                      <p className="text-[10px] text-text-muted mb-1">Avg APY</p>
                      <p className="text-lg font-bold text-text-primary">
                        {(filteredRates.reduce((s, r) => s + r.supplyApy, 0) / filteredRates.length).toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-2 border border-border p-3 text-center">
                      <p className="text-[10px] text-text-muted mb-1">Markets</p>
                      <p className="text-lg font-bold text-text-primary">{filteredRates.length}</p>
                    </div>
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
