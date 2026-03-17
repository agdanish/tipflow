import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Share2, X, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { TipGoal } from '../types';

export function TipGoals() {
  const [goals, setGoals] = useState<TipGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [token, setToken] = useState('native');
  const [recipient, setRecipient] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchGoals = useCallback(async () => {
    try {
      const { goals: g } = await api.getGoals();
      setGoals(g);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    const id = setInterval(fetchGoals, 15_000);
    return () => clearInterval(id);
  }, [fetchGoals]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetAmount('');
    setToken('native');
    setRecipient('');
    setDeadline('');
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(targetAmount);
    if (!title.trim()) { setError('Title is required'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Target amount must be positive'); return; }

    setSubmitting(true);
    setError('');
    try {
      await api.createGoal({
        title: title.trim(),
        description: description.trim(),
        targetAmount: amt,
        token,
        recipient: recipient.trim() || undefined,
        deadline: deadline || undefined,
      });
      resetForm();
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {
      // ignore
    }
  };

  const handleShare = (goal: TipGoal) => {
    const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    const text = `${goal.title} - ${pct}% funded (${goal.currentAmount}/${goal.targetAmount} ${goal.token})${goal.recipient ? ` | Tip to: ${goal.recipient}` : ''}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const getTimeRemaining = (deadlineStr: string): string => {
    const now = Date.now();
    const end = new Date(deadlineStr).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    if (days > 0) return `${days}d ${hours}h left`;
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return `${hours}h ${mins}m left`;
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          Tip Goals
          {activeGoals.length > 0 && (
            <span className="ml-1 text-xs font-normal text-text-muted">
              {activeGoals.length} active
            </span>
          )}
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent-border hover:bg-accent/20 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 rounded-lg border border-border bg-surface-2 space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Community Fund"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Target Amount *</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Token</label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="native">Native (ETH/TON)</option>
                <option value="usdt">USDT</option>
                <option value="any">Any Token</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Recipient (optional)</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x... or UQ..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Goal'}
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-6 text-text-muted text-sm">Loading goals...</div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Target className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-muted">No goals yet</p>
          <p className="text-xs text-text-muted mt-1">Create a fundraising target to track progress</p>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const pct = Math.min(100, goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0);
            const isExpired = goal.deadline && new Date(goal.deadline).getTime() < Date.now();

            return (
              <div key={goal.id} className="p-3 rounded-lg border border-border bg-surface-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => handleShare(goal)}
                      className="p-1 rounded-md text-text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Copy goal summary"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2.5 rounded-full bg-surface-3 overflow-hidden mb-2">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-cyan-400' : pct >= 50 ? 'bg-blue-400' : 'bg-accent'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">
                    <span className="font-semibold text-text-primary">{goal.currentAmount}</span>
                    <span className="text-text-muted"> / {goal.targetAmount} {goal.token === 'any' ? '' : goal.token === 'usdt' ? 'USDT' : goal.token}</span>
                  </span>
                  <span className={`font-semibold ${pct >= 100 ? 'text-green-400' : 'text-text-secondary'}`}>
                    {pct}%
                  </span>
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                  {goal.recipient && (
                    <span className="font-mono truncate max-w-[120px]" title={goal.recipient}>
                      {goal.recipient.slice(0, 8)}...{goal.recipient.slice(-4)}
                    </span>
                  )}
                  {goal.deadline && (
                    <span className={`flex items-center gap-0.5 ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {getTimeRemaining(goal.deadline)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            Completed ({completedGoals.length})
          </h3>
          <div className="space-y-2">
            {completedGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 p-2 rounded-lg border border-green-500/20 bg-green-500/5">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-text-primary truncate block">{goal.title}</span>
                  <span className="text-[10px] text-text-muted">
                    {goal.currentAmount} / {goal.targetAmount} {goal.token === 'any' ? '' : goal.token === 'usdt' ? 'USDT' : goal.token}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
