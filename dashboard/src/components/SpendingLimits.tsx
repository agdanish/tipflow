import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Edit3, Save, X } from 'lucide-react';
import { api } from '../lib/api';
import type { SpendingTotals } from '../types';

function ProgressBar({ label, spent, limit, percentage, currency }: {
  label: string;
  spent: number;
  limit: number;
  percentage: number;
  currency: string;
}) {
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 100;
  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-accent';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className={`font-mono ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-text-secondary'}`}>
          {spent.toFixed(4)} / {limit} {currency}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{percentage.toFixed(1)}% used</span>
        <span className={`text-xs font-medium ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`}>
          {(limit - spent).toFixed(4)} {currency} remaining
        </span>
      </div>
      {isWarning && !isDanger && (
        <div className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">Approaching {label.toLowerCase()} limit</span>
        </div>
      )}
      {isDanger && (
        <div className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
          <span className="text-xs text-red-400">{label} limit reached</span>
        </div>
      )}
    </div>
  );
}

export function SpendingLimits() {
  const [spending, setSpending] = useState<SpendingTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDaily, setFormDaily] = useState('');
  const [formWeekly, setFormWeekly] = useState('');
  const [formPerTip, setFormPerTip] = useState('');

  const fetchSpending = useCallback(async () => {
    try {
      const { spending: data } = await api.getLimits();
      setSpending(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpending();
    const id = setInterval(fetchSpending, 10_000);
    return () => clearInterval(id);
  }, [fetchSpending]);

  const startEditing = () => {
    if (!spending) return;
    setFormDaily(String(spending.limits.dailyLimit));
    setFormWeekly(String(spending.limits.weeklyLimit));
    setFormPerTip(String(spending.limits.perTipLimit));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveLimits = async () => {
    try {
      setSaving(true);
      await api.updateLimits({
        dailyLimit: parseFloat(formDaily),
        weeklyLimit: parseFloat(formWeekly),
        perTipLimit: parseFloat(formPerTip),
      });
      setEditing(false);
      await fetchSpending();
    } catch {
      // keep existing
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5 animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-2 bg-surface-2 rounded w-full" />
          <div className="h-2 bg-surface-2 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!spending) return null;

  const { dailySpent, weeklySpent, dailyRemaining, weeklyRemaining, limits, dailyPercentage, weeklyPercentage } = spending;
  const overallHealth = dailyPercentage < 80 && weeklyPercentage < 80;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${overallHealth ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
          <Shield className={`w-4 h-4 ${overallHealth ? 'text-green-400' : 'text-amber-400'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">Spending Limits</h3>
          <p className="text-xs text-text-muted">Safety caps for tipping</p>
        </div>
        {!editing ? (
          <button
            onClick={startEditing}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            title="Edit limits"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={saveLimits}
              disabled={saving}
              className="p-1.5 rounded-md text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Daily Limit ({limits.currency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formDaily}
              onChange={(e) => setFormDaily(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Weekly Limit ({limits.currency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formWeekly}
              onChange={(e) => setFormWeekly(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Per-Tip Limit ({limits.currency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formPerTip}
              onChange={(e) => setFormPerTip(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Bars */}
          <ProgressBar
            label="Daily"
            spent={dailySpent}
            limit={limits.dailyLimit}
            percentage={dailyPercentage}
            currency={limits.currency}
          />
          <ProgressBar
            label="Weekly"
            spent={weeklySpent}
            limit={limits.weeklyLimit}
            percentage={weeklyPercentage}
            currency={limits.currency}
          />

          {/* Per-Tip Limit Info */}
          <div className="flex items-center justify-between px-2 py-2 rounded-md bg-surface-2 border border-border">
            <span className="text-sm text-text-secondary">Per-tip limit</span>
            <span className="text-sm font-mono font-semibold text-text-primary">
              {limits.perTipLimit} {limits.currency}
            </span>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-surface-2/50">
            {overallHealth ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-sm text-text-secondary">
                  Remaining today: <span className="font-semibold text-green-400">{dailyRemaining.toFixed(4)} {limits.currency}</span>
                  {' | '}
                  This week: <span className="font-semibold text-green-400">{weeklyRemaining.toFixed(4)} {limits.currency}</span>
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-400">
                  Approaching spending limits. Consider reducing tip amounts.
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
