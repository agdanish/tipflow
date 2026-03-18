// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Target,
  ShieldCheck,
  ScrollText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  User,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TipProfile, AutonomyPolicy, AutonomousDecision } from '../types';

type Section = 'profile' | 'recommendations' | 'policies' | 'decisions';

export function AutonomyPanel() {
  const [expandedSection, setExpandedSection] = useState<Section | null>('recommendations');
  const [profile, setProfile] = useState<TipProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AutonomousDecision[]>([]);
  const [policies, setPolicies] = useState<AutonomyPolicy[]>([]);
  const [decisions, setDecisions] = useState<AutonomousDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Policy form state
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState<'budget' | 'recipient_limit' | 'recurring' | 'custom'>('budget');
  const [maxPerTip, setMaxPerTip] = useState('0.1');
  const [maxDaily, setMaxDaily] = useState('0.5');

  const fetchProfile = useCallback(async () => {
    try {
      const { profile: p } = await api.getAutonomyProfile();
      setProfile(p);
    } catch {
      // Profile may be empty if no tips yet
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const { recommendations: recs, profile: p } = await api.getAutonomyRecommendations();
      setRecommendations(recs);
      setProfile(p);
    } catch {
      // May be empty
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const { policies: pols } = await api.getAutonomyPolicies();
      setPolicies(pols);
    } catch {
      // Ignore
    }
  }, []);

  const fetchDecisions = useCallback(async () => {
    try {
      const { decisions: decs } = await api.getAutonomyDecisions();
      setDecisions(decs);
    } catch {
      // Ignore
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchProfile(), fetchRecommendations(), fetchPolicies(), fetchDecisions()]);
    setLoading(false);
  }, [fetchProfile, fetchRecommendations, fetchPolicies, fetchDecisions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const { proposals } = await api.evaluateAutonomy();
      setRecommendations(proposals);
      await fetchDecisions();
    } catch (err) {
      setError(String(err));
    } finally {
      setEvaluating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveAutonomyDecision(id);
      await fetchDecisions();
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Ignore
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectAutonomyDecision(id);
      await fetchDecisions();
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Ignore
    }
  };

  const handleCreatePolicy = async () => {
    if (!policyName.trim()) return;
    try {
      await api.createAutonomyPolicy({
        name: policyName,
        type: policyType,
        enabled: true,
        rules: {
          maxPerTip: parseFloat(maxPerTip) || 0.1,
          maxDailyTotal: parseFloat(maxDaily) || 0.5,
        },
      });
      setPolicyName('');
      setShowPolicyForm(false);
      await fetchPolicies();
    } catch {
      // Ignore
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await api.deleteAutonomyPolicy(id);
      await fetchPolicies();
    } catch {
      // Ignore
    }
  };

  const toggleSection = (section: Section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const confidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-amber-400';
    return 'text-red-400';
  };

  const confidenceBg = (score: number) => {
    if (score >= 0.7) return 'bg-green-500/15 border-green-500/20';
    if (score >= 0.4) return 'bg-amber-500/15 border-amber-500/20';
    return 'bg-red-500/15 border-red-500/20';
  };

  const statusBadge = (status: AutonomousDecision['status']) => {
    switch (status) {
      case 'proposed':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400">Proposed</span>;
      case 'approved':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-500/15 border border-green-500/20 text-green-400">Approved</span>;
      case 'executed':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">Executed</span>;
      case 'rejected':
        return <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500/15 border border-red-500/20 text-red-400">Rejected</span>;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Autonomous Intelligence
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/15 border border-purple-500/20 text-purple-400 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
          >
            {evaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {evaluating ? 'Evaluating...' : 'Run Evaluation'}
          </button>
          <button
            onClick={loadAll}
            disabled={loading}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tip Profile Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('profile')}
          className="w-full flex items-center justify-between p-3 bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <User className="w-4 h-4 text-cyan-400" />
            Tip Profile
            {profile && (
              <span className="text-xs text-text-muted font-normal">
                {profile.frequentRecipients.length} recipients, {profile.activeDays} active days
              </span>
            )}
          </span>
          {expandedSection === 'profile' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {expandedSection === 'profile' && profile && (
          <div className="p-3 space-y-3">
            {/* Profile summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                <div className="text-xs text-text-muted uppercase tracking-wider">Total Tipped</div>
                <div className="text-sm font-semibold text-text-primary mt-0.5">{profile.totalTipped.toFixed(4)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                <div className="text-xs text-text-muted uppercase tracking-wider">Avg Tip</div>
                <div className="text-sm font-semibold text-text-primary mt-0.5">{profile.avgTipAmount.toFixed(4)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                <div className="text-xs text-text-muted uppercase tracking-wider">Active Days</div>
                <div className="text-sm font-semibold text-text-primary mt-0.5">{profile.activeDays}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                <div className="text-xs text-text-muted uppercase tracking-wider">Preferred Chain</div>
                <div className="text-sm font-semibold text-text-primary mt-0.5 truncate">{profile.preferredChain}</div>
              </div>
            </div>

            {/* Frequent recipients */}
            {profile.frequentRecipients.length > 0 && (
              <div>
                <div className="text-xs text-text-secondary font-medium mb-2">Frequent Recipients</div>
                <div className="space-y-1.5">
                  {profile.frequentRecipients.slice(0, 5).map((r) => (
                    <div key={r.address} className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-accent" />
                        </div>
                        <span className="font-mono text-sm text-text-secondary truncate">{r.address.slice(0, 8)}...{r.address.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <span className="text-text-muted">{r.count} tips</span>
                        <span className="text-text-primary font-medium">avg {r.avgAmount.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timing patterns */}
            {profile.tipPatterns.length > 0 && (
              <div>
                <div className="text-xs text-text-secondary font-medium mb-2">Tip Patterns (Day/Time)</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.tipPatterns.slice(0, 10).map((p, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      {dayNames[p.dayOfWeek]} {p.hour}:00 ({p.frequency}x)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.frequentRecipients.length === 0 && (
              <div className="text-xs text-text-muted text-center py-4">
                No tip history yet. Send some tips to build your profile.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Recommendations Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between p-3 bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Target className="w-4 h-4 text-amber-400" />
            Smart Recommendations
            {recommendations.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400">
                {recommendations.length}
              </span>
            )}
          </span>
          {expandedSection === 'recommendations' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {expandedSection === 'recommendations' && (
          <div className="p-3 space-y-2">
            {recommendations.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-4">
                No recommendations yet. Click "Run Evaluation" to analyze your tipping patterns.
              </div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className={`p-3 rounded-lg border ${confidenceBg(rec.reasoning.confidenceScore)}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary">{rec.amount.toFixed(4)}</span>
                        <span className="text-text-muted text-xs">to</span>
                        <span className="font-mono text-sm text-text-secondary">{rec.recipient.slice(0, 8)}...{rec.recipient.slice(-6)}</span>
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">{rec.chain}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-medium ${confidenceColor(rec.reasoning.confidenceScore)}`}>
                        {Math.round(rec.reasoning.confidenceScore * 100)}%
                      </span>
                      {rec.status === 'proposed' && (
                        <>
                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="p-1 rounded-md text-green-400 hover:bg-green-500/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(rec.id)}
                            className="p-1 rounded-md text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reasoning chain */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{rec.reasoning.trigger}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <User className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{rec.reasoning.recipientReason}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <TrendingUp className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{rec.reasoning.amountReason}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Clock className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{rec.reasoning.timingReason}</span>
                    </div>
                  </div>

                  {/* Policy compliance badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${rec.policyCompliance.withinDailyLimit ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {rec.policyCompliance.withinDailyLimit ? 'Within daily limit' : 'Exceeds daily limit'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${rec.policyCompliance.withinPerTipLimit ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {rec.policyCompliance.withinPerTipLimit ? 'Within per-tip limit' : 'Exceeds per-tip limit'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${rec.policyCompliance.knownRecipient ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      {rec.policyCompliance.knownRecipient ? 'Known recipient' : 'New recipient'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Policy Configuration Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('policies')}
          className="w-full flex items-center justify-between p-3 bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Autonomy Policies
            {policies.length > 0 && (
              <span className="text-xs text-text-muted font-normal">
                {policies.filter((p) => p.enabled).length} active
              </span>
            )}
          </span>
          {expandedSection === 'policies' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {expandedSection === 'policies' && (
          <div className="p-3 space-y-3">
            {/* Existing policies */}
            {policies.length > 0 ? (
              <div className="space-y-2">
                {policies.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{p.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${p.enabled ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                          {p.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-surface-3 border border-border text-text-muted">
                          {p.type}
                        </span>
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">
                        {p.rules.maxPerTip !== undefined && `Max per tip: ${p.rules.maxPerTip}`}
                        {p.rules.maxPerTip !== undefined && p.rules.maxDailyTotal !== undefined && ' | '}
                        {p.rules.maxDailyTotal !== undefined && `Daily max: ${p.rules.maxDailyTotal}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePolicy(p.id)}
                      className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-text-muted text-center py-2">
                No policies configured. Add one to define spending guardrails.
              </div>
            )}

            {/* Add policy form */}
            {showPolicyForm ? (
              <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border">
                <input
                  type="text"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="Policy name (e.g. 'Daily budget')"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-3 border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={policyType}
                    onChange={(e) => setPolicyType(e.target.value as typeof policyType)}
                    className="px-2 py-2 text-xs rounded-lg bg-surface-3 border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="budget">Budget</option>
                    <option value="recipient_limit">Recipient Limit</option>
                    <option value="recurring">Recurring</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={maxPerTip}
                    onChange={(e) => setMaxPerTip(e.target.value)}
                    placeholder="Max per tip"
                    className="px-2 py-2 text-xs rounded-lg bg-surface-3 border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    title="Max per tip"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={maxDaily}
                    onChange={(e) => setMaxDaily(e.target.value)}
                    placeholder="Max daily"
                    className="px-2 py-2 text-xs rounded-lg bg-surface-3 border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    title="Max daily total"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreatePolicy}
                    disabled={!policyName.trim()}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-accent/15 border border-accent-border text-accent hover:bg-accent/25 transition-colors disabled:opacity-50"
                  >
                    Create Policy
                  </button>
                  <button
                    onClick={() => setShowPolicyForm(false)}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-surface-3 border border-border text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPolicyForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border border-dashed border-border text-text-muted hover:text-text-primary hover:border-accent-border transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Policy
              </button>
            )}
          </div>
        )}
      </div>

      {/* Decision Log Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('decisions')}
          className="w-full flex items-center justify-between p-3 bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <ScrollText className="w-4 h-4 text-indigo-400" />
            Decision Log
            {decisions.length > 0 && (
              <span className="text-xs text-text-muted font-normal">
                {decisions.length} decisions
              </span>
            )}
          </span>
          {expandedSection === 'decisions' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {expandedSection === 'decisions' && (
          <div className="p-3">
            {decisions.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-4">
                No decisions logged yet. Run an evaluation to generate proposals.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {decisions.slice(0, 20).map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-surface-2 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">{d.amount.toFixed(4)}</span>
                        <span className="text-text-muted text-sm">to</span>
                        <span className="font-mono text-xs text-text-secondary">{d.recipient.slice(0, 8)}...{d.recipient.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${confidenceColor(d.reasoning.confidenceScore)}`}>
                          {Math.round(d.reasoning.confidenceScore * 100)}%
                        </span>
                        {statusBadge(d.status)}
                      </div>
                    </div>
                    <div className="text-xs text-text-muted">{d.reasoning.trigger}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {new Date(d.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
