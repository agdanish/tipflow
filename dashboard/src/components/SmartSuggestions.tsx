// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, X, Lightbulb, TrendingDown, Users, Clock, Zap } from 'lucide-react';
import { api } from '../lib/api';

interface Suggestion {
  id: string;
  type: 'fee_optimization' | 'frequent_recipient' | 'schedule' | 'gasless' | 'trending';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon: React.ReactNode;
  color: string;
}

interface SmartSuggestionsProps {
  onNavigate: (tab: string) => void;
  tipCount: number;
}

export function SmartSuggestions({ onNavigate, tipCount }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tipflow-dismissed-suggestions');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(true);

  const buildSuggestions = useCallback(async () => {
    const items: Suggestion[] = [];

    // Fee optimization suggestion
    try {
      const fees = await api.feesCurrent() as { chains?: Array<{ chainId: string; fee: string }> };
      if (fees.chains && fees.chains.length > 1) {
        const sorted = [...fees.chains].sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
        const cheapest = sorted[0];
        const expensive = sorted[sorted.length - 1];
        if (cheapest && expensive && parseFloat(expensive.fee) > parseFloat(cheapest.fee) * 2) {
          items.push({
            id: 'fee-opt',
            type: 'fee_optimization',
            title: 'Save on fees',
            description: `${cheapest.chainId.includes('ton') ? 'TON' : 'Ethereum'} has ${((1 - parseFloat(cheapest.fee) / parseFloat(expensive.fee)) * 100).toFixed(0)}% lower fees right now`,
            icon: <TrendingDown className="w-4 h-4" />,
            color: 'text-green-400',
            action: {
              label: 'Compare',
              onClick: () => {
                onNavigate('analytics');
                setTimeout(() => document.getElementById('chain-comparison-section')?.scrollIntoView({ behavior: 'smooth' }), 200);
              },
            },
          });
        }
      }
    } catch { /* silent */ }

    // Gasless suggestion for new users
    if (tipCount < 3) {
      items.push({
        id: 'gasless-intro',
        type: 'gasless',
        title: 'Try gasless tipping',
        description: 'Send tips with zero gas fees using ERC-4337 Account Abstraction',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-purple-400',
        action: {
          label: 'Learn more',
          onClick: () => onNavigate('dashboard'),
        },
      });
    }

    // Scheduling suggestion
    if (tipCount > 2) {
      items.push({
        id: 'schedule-tip',
        type: 'schedule',
        title: 'Schedule recurring tips',
        description: 'Set up daily, weekly, or monthly automated tips to your favorite creators',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-amber-400',
        action: {
          label: 'Schedule',
          onClick: () => onNavigate('dashboard'),
        },
      });
    }

    // AI agents suggestion
    items.push({
      id: 'ai-agents',
      type: 'trending',
      title: 'Explore AI agents',
      description: 'Orchestrator, Predictor, Fee Arbitrage — let AI optimize your tipping',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-cyan-400',
      action: {
        label: 'Explore',
        onClick: () => onNavigate('ai'),
      },
    });

    // Batch tipping suggestion
    if (tipCount > 5) {
      items.push({
        id: 'batch-tip',
        type: 'frequent_recipient',
        title: 'Batch tip multiple creators',
        description: 'Send tips to multiple recipients in a single transaction to save time',
        icon: <Users className="w-4 h-4" />,
        color: 'text-blue-400',
        action: {
          label: 'Try batch',
          onClick: () => onNavigate('dashboard'),
        },
      });
    }

    setSuggestions(items);
    setLoading(false);
  }, [tipCount, onNavigate]);

  useEffect(() => {
    buildSuggestions();
  }, [buildSuggestions]);

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem('tipflow-dismissed-suggestions', JSON.stringify([...next]));
  };

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (loading || visible.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Smart Suggestions
        </h2>
        <span className="text-xs text-text-muted">AI-powered</span>
      </div>

      <div className="space-y-2">
        {visible.slice(0, 3).map((suggestion, i) => (
          <div
            key={suggestion.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 border border-border card-hover animate-list-item-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`shrink-0 mt-0.5 ${suggestion.color}`}>
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary">{suggestion.title}</p>
              <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{suggestion.description}</p>
              {suggestion.action && (
                <button
                  onClick={suggestion.action.onClick}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light transition-colors btn-press"
                >
                  {suggestion.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => handleDismiss(suggestion.id)}
              className="shrink-0 p-1 rounded text-text-muted hover:text-text-primary transition-colors"
              title="Dismiss suggestion"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
