import { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, X, Loader2, Trash2, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { TipCondition, ConditionType } from '../types';

const CONDITION_LABELS: Record<string, string> = {
  gas_below: 'Gas Below',
  balance_above: 'Balance Above',
  time_of_day: 'Time Window',
};

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  gas_below: 'Tip when gas price drops below threshold (gwei)',
  balance_above: 'Tip when wallet balance exceeds threshold',
  time_of_day: 'Tip when current time is within window',
};

export function ConditionalTips() {
  const [conditions, setConditions] = useState<TipCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [condType, setCondType] = useState<ConditionType>('gas_below');
  const [threshold, setThreshold] = useState('');
  const [currency, setCurrency] = useState('ETH');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'native' | 'usdt'>('native');

  const fetchConditions = useCallback(async () => {
    try {
      const { conditions: c } = await api.getConditions();
      setConditions(c);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConditions();
    const id = setInterval(fetchConditions, 10_000);
    return () => clearInterval(id);
  }, [fetchConditions]);

  const resetForm = () => {
    setCondType('gas_below');
    setThreshold('');
    setCurrency('ETH');
    setTimeStart('');
    setTimeEnd('');
    setRecipient('');
    setAmount('');
    setToken('native');
    setCreating(false);
  };

  const handleCreate = async () => {
    if (!recipient.trim() || !amount.trim()) return;

    setSaving(true);
    try {
      const params: TipCondition['params'] = {};
      if (condType === 'gas_below' || condType === 'balance_above') {
        params.threshold = threshold;
      }
      if (condType === 'balance_above') {
        params.currency = currency;
      }
      if (condType === 'time_of_day') {
        params.timeStart = timeStart;
        params.timeEnd = timeEnd;
      }

      await api.createCondition(condType, params, {
        recipient: recipient.trim(),
        amount: amount.trim(),
        token,
      });

      resetForm();
      fetchConditions();
    } catch {
      // error handled by toast or silently
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.cancelCondition(id);
      fetchConditions();
    } catch {
      // keep existing
    }
  };

  const statusIcon = (status: TipCondition['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-green-400" />
            </span>
          </span>
        );
      case 'triggered':
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-gray-400 opacity-50" />;
    }
  };

  const statusColor = (status: TipCondition['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/5 border-green-500/20';
      case 'triggered':
        return 'bg-blue-500/5 border-blue-500/20';
      case 'cancelled':
        return 'bg-gray-500/5 border-gray-500/20';
    }
  };

  const conditionSummary = (c: TipCondition) => {
    switch (c.type) {
      case 'gas_below':
        return `Gas < ${c.params.threshold ?? '?'} gwei`;
      case 'balance_above':
        return `${c.params.currency ?? 'ETH'} > ${c.params.threshold ?? '?'}`;
      case 'time_of_day':
        return `${c.params.timeStart ?? '?'} - ${c.params.timeEnd ?? '?'}`;
      default:
        return c.type;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Smart Conditions
          {conditions.filter(c => c.status === 'active').length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {conditions.filter(c => c.status === 'active').length} active
            </span>
          )}
        </h2>
        <button
          onClick={() => setCreating((p) => !p)}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {creating ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-4 p-3 rounded-lg bg-surface-2 border border-border space-y-3">
          <div className="text-sm text-text-muted mb-1">
            Create a condition that automatically triggers a tip when met.
          </div>

          {/* Condition type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Condition Type
            </label>
            <select
              value={condType}
              onChange={(e) => setCondType(e.target.value as ConditionType)}
              className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {(Object.keys(CONDITION_LABELS) as ConditionType[]).map((t) => (
                <option key={t} value={t}>
                  {CONDITION_LABELS[t]}
                </option>
              ))}
            </select>
            <div className="text-xs text-text-muted mt-0.5">
              {CONDITION_DESCRIPTIONS[condType]}
            </div>
          </div>

          {/* Threshold (for gas_below and balance_above) */}
          {(condType === 'gas_below' || condType === 'balance_above') && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Threshold
                </label>
                <input
                  type="number"
                  step="any"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={condType === 'gas_below' ? 'e.g. 20' : 'e.g. 0.5'}
                  className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              {condType === 'balance_above' && (
                <div className="w-24">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="ETH">ETH</option>
                    <option value="TON">TON</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Time window (for time_of_day) */}
          {condType === 'time_of_day' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Tip details */}
          <div className="border-t border-border pt-3 mt-2">
            <div className="text-sm font-medium text-text-secondary mb-2">
              Tip to execute when condition is met
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient address (0x... or UQ...)"
                className="w-full px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent font-mono text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value as 'native' | 'usdt')}
                  className="w-24 px-2.5 py-1.5 rounded-md bg-surface-3 border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="native">Native</option>
                  <option value="usdt">USDT</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={saving || !recipient.trim() || !amount.trim()}
            className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Create Condition
              </>
            )}
          </button>
        </div>
      )}

      {/* Conditions list */}
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-12 rounded-lg" />
          <div className="skeleton h-12 rounded-lg" />
        </div>
      ) : conditions.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-sm">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No conditions yet</p>
          <p className="text-xs mt-1">
            Create smart conditions to auto-trigger tips
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${statusColor(c.status)}`}
            >
              <div className="shrink-0">{statusIcon(c.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-xs font-medium text-yellow-400">
                    <Zap className="w-2.5 h-2.5" />
                    {CONDITION_LABELS[c.type]}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {conditionSummary(c)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-medium text-text-primary">
                    {c.tip.amount} {c.tip.token === 'usdt' ? 'USDT' : 'native'}
                  </span>
                  <span className="text-text-muted">to</span>
                  <span className="font-mono text-sm text-text-secondary truncate">
                    {c.tip.recipient.slice(0, 8)}...{c.tip.recipient.slice(-6)}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {c.status === 'triggered' && c.triggeredAt
                    ? `Triggered ${new Date(c.triggeredAt).toLocaleString()}`
                    : `Created ${new Date(c.createdAt).toLocaleString()}`}
                </div>
              </div>
              {c.status === 'active' && (
                <button
                  onClick={() => handleCancel(c.id)}
                  className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Cancel condition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
