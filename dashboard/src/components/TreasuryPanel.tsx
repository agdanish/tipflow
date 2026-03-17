// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { useState, useEffect, useCallback } from 'react';
import { Vault, TrendingUp, PieChart, Shield, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Zap } from 'lucide-react';
import { api } from '../lib/api';
import type { TreasuryStatus, YieldOpportunity, YieldStrategy, TreasuryAllocation, TreasuryAnalytics, EconomicReport } from '../types';

// ── SVG Pie Chart ────────────────────────────────────────────────

function AllocationPieChart({ allocation }: { allocation: TreasuryAllocation }) {
  const segments = [
    { label: 'Tipping Reserve', pct: allocation.tippingReservePercent, color: '#3b82f6' },
    { label: 'Yield', pct: allocation.yieldPercent, color: '#10b981' },
    { label: 'Gas Buffer', pct: allocation.gasBufferPercent, color: '#f59e0b' },
  ];

  const radius = 50;
  const cx = 60;
  const cy = 60;
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number): [number, number] {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [cx + x * radius, cy + y * radius];
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
        {segments.map((seg) => {
          if (seg.pct <= 0) return null;
          const start = cumulativePercent;
          cumulativePercent += seg.pct / 100;
          const end = cumulativePercent;

          const [startX, startY] = getCoordinatesForPercent(start);
          const [endX, endY] = getCoordinatesForPercent(end);
          const largeArcFlag = seg.pct > 50 ? 1 : 0;

          const pathData = [
            `M ${cx} ${cy}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z',
          ].join(' ');

          return (
            <path
              key={seg.label}
              d={pathData}
              fill={seg.color}
              opacity={0.85}
              stroke="var(--surface-1)"
              strokeWidth="1"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={20} fill="var(--surface-1)" />
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-text-secondary">{seg.label}</span>
            <span className="font-mono font-medium text-text-primary ml-auto">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk badge ───────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const styles = {
    low: 'bg-green-500/15 border-green-500/20 text-green-400',
    medium: 'bg-amber-500/15 border-amber-500/20 text-amber-400',
    high: 'bg-red-500/15 border-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${styles[risk]}`}>
      {risk}
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────

function MetricCard({ label, value, subtext, icon }: { label: string; value: string; subtext?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-text-muted">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold text-text-primary font-mono">{value}</p>
      {subtext && <p className="text-[10px] text-text-muted">{subtext}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function TreasuryPanel() {
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [yields, setYields] = useState<YieldOpportunity[]>([]);
  const [strategy, setStrategy] = useState<YieldStrategy | null>(null);
  const [allocation, setAllocation] = useState<TreasuryAllocation | null>(null);
  const [report, setReport] = useState<EconomicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [yieldsExpanded, setYieldsExpanded] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Allocation form state
  const [tipPct, setTipPct] = useState(70);
  const [yieldPct, setYieldPct] = useState(20);
  const [gasPct, setGasPct] = useState(10);

  // Strategy form state
  const [stratEnabled, setStratEnabled] = useState(false);
  const [stratProtocol, setStratProtocol] = useState('Aave V3');
  const [stratMaxAlloc, setStratMaxAlloc] = useState(20);
  const [stratMinIdle, setStratMinIdle] = useState(10);
  const [stratAutoRebalance, setStratAutoRebalance] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [statusRes, yieldsRes, stratRes, allocRes, reportRes] = await Promise.all([
        api.getTreasuryStatus(),
        api.getTreasuryYields(),
        api.getTreasuryStrategy(),
        api.getTreasuryAllocation(),
        api.getTreasuryReport(),
      ]);

      setStatus(statusRes.status);
      setYields(yieldsRes.yields);
      setStrategy(stratRes.strategy);
      setAllocation(allocRes.allocation);
      setReport(reportRes.report);

      // Sync form state
      if (allocRes.allocation) {
        setTipPct(allocRes.allocation.tippingReservePercent);
        setYieldPct(allocRes.allocation.yieldPercent);
        setGasPct(allocRes.allocation.gasBufferPercent);
      }
      if (stratRes.strategy) {
        setStratEnabled(stratRes.strategy.enabled);
        setStratProtocol(stratRes.strategy.targetProtocol);
        setStratMaxAlloc(stratRes.strategy.maxAllocationPercent);
        setStratMinIdle(stratRes.strategy.minIdleThreshold);
        setStratAutoRebalance(stratRes.strategy.autoRebalance);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveAllocation = async () => {
    const sum = tipPct + yieldPct + gasPct;
    if (Math.abs(sum - 100) > 0.01) {
      setError(`Allocation must sum to 100%, currently ${sum}%`);
      return;
    }
    setSaving(true);
    try {
      const res = await api.setTreasuryAllocation({
        tippingReservePercent: tipPct,
        yieldPercent: yieldPct,
        gasBufferPercent: gasPct,
      });
      setAllocation(res.allocation);
      setAllocationOpen(false);
      setError(null);
      fetchAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStrategy = async () => {
    setSaving(true);
    try {
      const res = await api.setTreasuryStrategy({
        enabled: stratEnabled,
        minIdleThreshold: stratMinIdle,
        targetProtocol: stratProtocol,
        maxAllocationPercent: stratMaxAlloc,
        autoRebalance: stratAutoRebalance,
        rebalanceIntervalHours: 24,
      });
      setStrategy(res.strategy);
      setStrategyOpen(false);
      setError(null);
      fetchAll();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  // Allocation slider helper: when one slider changes, adjust others proportionally
  const handleAllocChange = (field: 'tip' | 'yield' | 'gas', value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    if (field === 'tip') {
      const remaining = 100 - clamped;
      const oldOther = yieldPct + gasPct;
      if (oldOther > 0) {
        setYieldPct(Math.round((yieldPct / oldOther) * remaining));
        setGasPct(remaining - Math.round((yieldPct / oldOther) * remaining));
      } else {
        setYieldPct(Math.round(remaining * 0.67));
        setGasPct(remaining - Math.round(remaining * 0.67));
      }
      setTipPct(clamped);
    } else if (field === 'yield') {
      const remaining = 100 - clamped;
      const oldOther = tipPct + gasPct;
      if (oldOther > 0) {
        setTipPct(Math.round((tipPct / oldOther) * remaining));
        setGasPct(remaining - Math.round((tipPct / oldOther) * remaining));
      } else {
        setTipPct(Math.round(remaining * 0.875));
        setGasPct(remaining - Math.round(remaining * 0.875));
      }
      setYieldPct(clamped);
    } else {
      const remaining = 100 - clamped;
      const oldOther = tipPct + yieldPct;
      if (oldOther > 0) {
        setTipPct(Math.round((tipPct / oldOther) * remaining));
        setYieldPct(remaining - Math.round((tipPct / oldOther) * remaining));
      } else {
        setTipPct(Math.round(remaining * 0.78));
        setYieldPct(remaining - Math.round(remaining * 0.78));
      }
      setGasPct(clamped);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Vault className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-text-primary">Treasury Management</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-2 rounded w-3/4" />
          <div className="h-4 bg-surface-2 rounded w-1/2" />
          <div className="h-20 bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  const analytics = report?.analytics;
  const sustainability = report?.sustainability;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vault className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-text-primary">Treasury Management</h2>
          {sustainability && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              sustainability.score >= 80 ? 'bg-green-500/15 border-green-500/20 text-green-400'
              : sustainability.score >= 60 ? 'bg-blue-500/15 border-blue-500/20 text-blue-400'
              : sustainability.score >= 40 ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
              : 'bg-red-500/15 border-red-500/20 text-red-400'
            }`}>
              {sustainability.label} ({sustainability.score}/100)
            </span>
          )}
        </div>
        <button
          onClick={() => { setLoading(true); fetchAll(); }}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          title="Refresh treasury data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Treasury Overview + Pie Chart */}
      {status && allocation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              Fund Allocation
            </h3>
            <AllocationPieChart allocation={allocation} />
            <div className="text-[10px] text-text-muted">
              Last rebalanced: {new Date(status.lastRebalance).toLocaleString()}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary">Treasury Balances</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Balance', value: status.totalBalance, color: 'text-text-primary' },
                { label: 'Tipping Reserve', value: status.tippingReserve, color: 'text-blue-400' },
                { label: 'Yield Deployed', value: status.yieldDeployed, color: 'text-green-400' },
                { label: 'Gas Buffer', value: status.gasBuffer, color: 'text-amber-400' },
                { label: 'Idle Funds', value: status.idleFunds, color: 'text-text-muted' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className={`font-mono font-medium ${item.color}`}>
                    {item.value.toFixed(6)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Economic Metrics */}
      {analytics && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Economic Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard
              label="Cost / Tip"
              value={analytics.avgCostPerTip > 0 ? `$${analytics.avgCostPerTip.toFixed(6)}` : '$0'}
              subtext="Average gas cost per tip"
              icon={<TrendingUp className="w-3 h-3" />}
            />
            <MetricCard
              label="Gas Efficiency"
              value={analytics.gasEfficiency > 0 ? `${analytics.gasEfficiency.toFixed(1)}x` : 'N/A'}
              subtext="Value tipped / gas spent"
              icon={<Zap className="w-3 h-3" />}
            />
            <MetricCard
              label="Yield Earned"
              value={`$${analytics.yieldEarned.toFixed(6)}`}
              subtext="From idle fund deployment"
              icon={<TrendingUp className="w-3 h-3" />}
            />
            <MetricCard
              label="Net Cost"
              value={`$${analytics.netCost.toFixed(6)}`}
              subtext="Gas spent - yield earned"
              icon={<Shield className="w-3 h-3" />}
            />
          </div>
        </div>
      )}

      {/* Yield Opportunities */}
      <div>
        <button
          onClick={() => setYieldsExpanded(!yieldsExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            Yield Opportunities
            {yields.length > 0 && (
              <span className="text-[10px] text-text-muted font-normal">
                ({yields.length} pools{yields[0]?.isLive ? ' — live data' : ' — cached'})
              </span>
            )}
          </span>
          {yieldsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {yieldsExpanded && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-muted border-b border-border">
                  <th className="pb-2 pr-3 font-medium">Protocol</th>
                  <th className="pb-2 pr-3 font-medium">Chain</th>
                  <th className="pb-2 pr-3 font-medium text-right">APY</th>
                  <th className="pb-2 pr-3 font-medium text-right">TVL</th>
                  <th className="pb-2 font-medium text-center">Risk</th>
                </tr>
              </thead>
              <tbody>
                {yields.slice(0, 15).map((y, i) => (
                  <tr key={`${y.protocol}-${y.chain}-${i}`} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                    <td className="py-2 pr-3 font-medium text-text-primary">{y.protocol}</td>
                    <td className="py-2 pr-3 text-text-secondary">{y.chain}</td>
                    <td className="py-2 pr-3 text-right font-mono font-medium text-green-400">{y.apy.toFixed(2)}%</td>
                    <td className="py-2 pr-3 text-right font-mono text-text-secondary">
                      ${y.tvl >= 1_000_000_000 ? `${(y.tvl / 1_000_000_000).toFixed(1)}B` : y.tvl >= 1_000_000 ? `${(y.tvl / 1_000_000).toFixed(0)}M` : `${(y.tvl / 1_000).toFixed(0)}K`}
                    </td>
                    <td className="py-2 text-center"><RiskBadge risk={y.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {yields.length === 0 && (
              <p className="text-xs text-text-muted text-center py-4">No yield opportunities available</p>
            )}
          </div>
        )}
      </div>

      {/* Allocation Configuration */}
      <div>
        <button
          onClick={() => setAllocationOpen(!allocationOpen)}
          className="w-full flex items-center justify-between text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-blue-400" />
            Configure Allocation
          </span>
          {allocationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {allocationOpen && (
          <div className="mt-3 space-y-4 p-3 rounded-lg bg-surface-2 border border-border">
            {[
              { label: 'Tipping Reserve', value: tipPct, field: 'tip' as const, color: 'accent-blue-500' },
              { label: 'Yield Allocation', value: yieldPct, field: 'yield' as const, color: 'accent-green-500' },
              { label: 'Gas Buffer', value: gasPct, field: 'gas' as const, color: 'accent-amber-500' },
            ].map((slider) => (
              <div key={slider.field} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{slider.label}</span>
                  <span className="font-mono font-medium text-text-primary">{slider.value}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider.value}
                  onChange={(e) => handleAllocChange(slider.field, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono ${Math.abs(tipPct + yieldPct + gasPct - 100) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                Total: {tipPct + yieldPct + gasPct}%
              </span>
              <button
                onClick={handleSaveAllocation}
                disabled={saving || Math.abs(tipPct + yieldPct + gasPct - 100) > 0.01}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Allocation'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Strategy Configuration */}
      <div>
        <button
          onClick={() => setStrategyOpen(!strategyOpen)}
          className="w-full flex items-center justify-between text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Yield Strategy
            {strategy?.enabled && (
              <span className="inline-flex px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/20 text-[10px] font-medium text-green-400">
                Active
              </span>
            )}
          </span>
          {strategyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {strategyOpen && (
          <div className="mt-3 space-y-3 p-3 rounded-lg bg-surface-2 border border-border">
            <label className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Enable Yield Strategy</span>
              <button
                onClick={() => setStratEnabled(!stratEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stratEnabled ? 'bg-green-500' : 'bg-surface-3'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${stratEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Target Protocol</label>
              <select
                value={stratProtocol}
                onChange={(e) => setStratProtocol(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="Aave V3">Aave V3</option>
                <option value="Compound V3">Compound V3</option>
                <option value="Spark">Spark</option>
                <option value="Morpho">Morpho</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Max Allocation %</label>
                <input
                  type="number"
                  value={stratMaxAlloc}
                  onChange={(e) => setStratMaxAlloc(parseInt(e.target.value, 10))}
                  min={1}
                  max={100}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Min Idle Threshold</label>
                <input
                  type="number"
                  value={stratMinIdle}
                  onChange={(e) => setStratMinIdle(parseInt(e.target.value, 10))}
                  min={0}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-1 border border-border text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <label className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Auto-Rebalance</span>
              <button
                onClick={() => setStratAutoRebalance(!stratAutoRebalance)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stratAutoRebalance ? 'bg-green-500' : 'bg-surface-3'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${stratAutoRebalance ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <div className="flex justify-end">
              <button
                onClick={handleSaveStrategy}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Strategy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            Recommendations
          </h3>
          <div className="space-y-1.5">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-secondary px-2 py-1.5 rounded-md bg-surface-2/50">
                <span className="text-cyan-400 shrink-0 mt-0.5">&#8226;</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projected Yield */}
      {analytics && analytics.projectedMonthlyYield > 0 && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Projected Monthly Yield</span>
            <span className="ml-auto font-mono font-semibold text-green-400">${analytics.projectedMonthlyYield.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
