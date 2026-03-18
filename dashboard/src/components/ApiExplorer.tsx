// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    name: 'Core Tipping',
    endpoints: [
      { method: 'POST', path: '/api/tip', description: 'Send a single tip with AI agent orchestration' },
      { method: 'POST', path: '/api/tip/batch', description: 'Send batch tips to multiple recipients' },
      { method: 'POST', path: '/api/tip/split', description: 'Split a tip evenly among recipients' },
      { method: 'GET', path: '/api/tip/history', description: 'Retrieve tip transaction history' },
      { method: 'GET', path: '/api/tip/stats', description: 'Get aggregate tipping statistics' },
      { method: 'POST', path: '/api/tip/schedule', description: 'Schedule a tip for future execution' },
      { method: 'GET', path: '/api/tip/scheduled', description: 'List all scheduled tips' },
      { method: 'DELETE', path: '/api/tip/scheduled/:id', description: 'Cancel a scheduled tip' },
      { method: 'POST', path: '/api/tip/link', description: 'Create a shareable tip link' },
      { method: 'GET', path: '/api/tip/link/:id', description: 'Retrieve a tip link by ID' },
      { method: 'GET', path: '/api/tip/templates', description: 'List tip templates' },
      { method: 'POST', path: '/api/tip/templates', description: 'Create a new tip template' },
      { method: 'POST', path: '/api/tip/stream/start', description: 'Start a tip stream (continuous micro-tips)' },
      { method: 'POST', path: '/api/tip/stream/stop', description: 'Stop an active tip stream' },
      { method: 'GET', path: '/api/tip/streams', description: 'List active tip streams' },
    ],
  },
  {
    name: 'Engagement',
    endpoints: [
      { method: 'GET', path: '/api/rumble/engagement/:userId/:creatorId', description: 'Get engagement score between user and creator' },
      { method: 'POST', path: '/api/rumble/engagement/track', description: 'Track a new engagement event' },
      { method: 'GET', path: '/api/rumble/engagement/leaderboard', description: 'Top engaged users leaderboard' },
    ],
  },
  {
    name: 'Policies',
    endpoints: [
      { method: 'GET', path: '/api/policies', description: 'List all autonomy policies' },
      { method: 'POST', path: '/api/policies', description: 'Create a new autonomy policy' },
      { method: 'PUT', path: '/api/policies/:id', description: 'Update an existing policy' },
      { method: 'DELETE', path: '/api/policies/:id', description: 'Delete a policy' },
      { method: 'GET', path: '/api/policies/:id/logs', description: 'Get policy execution logs' },
    ],
  },
  {
    name: 'x402 Commerce',
    endpoints: [
      { method: 'GET', path: '/api/x402/resources', description: 'List x402-gated resources' },
      { method: 'POST', path: '/api/x402/resources', description: 'Create a new paywall resource' },
      { method: 'GET', path: '/api/x402/resources/:id', description: 'Access a gated resource (payment required)' },
      { method: 'POST', path: '/api/x402/purchase', description: 'Purchase access to a resource' },
      { method: 'GET', path: '/api/x402/purchases', description: 'List purchase history' },
    ],
  },
  {
    name: 'Discovery',
    endpoints: [
      { method: 'GET', path: '/api/discovery/creators', description: 'Discover creators based on engagement' },
      { method: 'GET', path: '/api/discovery/trending', description: 'Get trending creators' },
      { method: 'POST', path: '/api/discovery/recommend', description: 'AI-powered creator recommendation' },
      { method: 'GET', path: '/api/discovery/categories', description: 'List creator categories' },
      { method: 'GET', path: '/api/discovery/stats', description: 'Discovery service statistics' },
    ],
  },
  {
    name: 'Propagation',
    endpoints: [
      { method: 'GET', path: '/api/propagation/campaigns', description: 'List tip propagation campaigns' },
      { method: 'POST', path: '/api/propagation/campaigns', description: 'Create a viral tip campaign' },
      { method: 'GET', path: '/api/propagation/campaigns/:id', description: 'Get campaign details and tree' },
      { method: 'GET', path: '/api/propagation/stats', description: 'Propagation network statistics' },
      { method: 'POST', path: '/api/propagation/trigger', description: 'Trigger a propagation event' },
    ],
  },
  {
    name: 'Proof-of-Engagement',
    endpoints: [
      { method: 'GET', path: '/api/poe/proofs', description: 'List proof-of-engagement records' },
      { method: 'POST', path: '/api/poe/proofs', description: 'Submit a new engagement proof' },
      { method: 'GET', path: '/api/poe/proofs/:id', description: 'Retrieve a specific proof' },
      { method: 'POST', path: '/api/poe/verify', description: 'Verify an engagement proof' },
      { method: 'GET', path: '/api/poe/stats', description: 'Proof-of-engagement statistics' },
    ],
  },
  {
    name: 'Queue',
    endpoints: [
      { method: 'GET', path: '/api/queue/status', description: 'Queue processing status' },
      { method: 'GET', path: '/api/queue/jobs', description: 'List queued jobs' },
      { method: 'POST', path: '/api/queue/jobs', description: 'Enqueue a new job' },
      { method: 'GET', path: '/api/queue/stats', description: 'Queue throughput statistics' },
      { method: 'POST', path: '/api/queue/retry/:id', description: 'Retry a failed job' },
    ],
  },
  {
    name: 'Risk',
    endpoints: [
      { method: 'POST', path: '/api/risk/assess', description: 'Run 8-factor risk assessment on a transaction' },
    ],
  },
  {
    name: 'Wallets',
    endpoints: [
      { method: 'GET', path: '/api/wallet/balances', description: 'Get all chain balances' },
      { method: 'GET', path: '/api/wallet/addresses', description: 'Get wallet addresses per chain' },
      { method: 'GET', path: '/api/wallet/gas', description: 'Real-time gas estimates' },
      { method: 'POST', path: '/api/wallet/switch/:chain/:index', description: 'Switch active wallet' },
      { method: 'GET', path: '/api/wallet/list/:chain', description: 'List HD-derived wallets' },
    ],
  },
  {
    name: 'Agent',
    endpoints: [
      { method: 'GET', path: '/api/agent/state', description: 'Current agent processing state' },
      { method: 'GET', path: '/api/agent/memory', description: 'Agent memory records' },
      { method: 'POST', path: '/api/agent/chat', description: 'Send a message to the agent' },
      { method: 'GET', path: '/api/agent/decisions', description: 'Decision audit trail' },
      { method: 'POST', path: '/api/orchestrator/propose', description: 'Propose an action for multi-agent vote' },
      { method: 'GET', path: '/api/orchestrator/history', description: 'Orchestration vote history' },
      { method: 'GET', path: '/api/orchestrator/stats', description: 'Multi-agent performance stats' },
    ],
  },
  {
    name: 'DeFi & Treasury',
    endpoints: [
      { method: 'GET', path: '/api/treasury/status', description: 'Treasury allocation status' },
      { method: 'POST', path: '/api/bridge/quote', description: 'Get cross-chain bridge quote' },
      { method: 'POST', path: '/api/bridge/execute', description: 'Execute a cross-chain bridge' },
      { method: 'GET', path: '/api/lending/positions', description: 'Active lending positions' },
      { method: 'POST', path: '/api/lending/supply', description: 'Supply assets to lending pool' },
      { method: 'POST', path: '/api/lending/withdraw', description: 'Withdraw from lending pool' },
      { method: 'GET', path: '/api/dca/plans', description: 'List DCA plans' },
      { method: 'POST', path: '/api/dca/plans', description: 'Create a DCA plan' },
      { method: 'GET', path: '/api/escrow/list', description: 'List escrow transactions' },
      { method: 'POST', path: '/api/escrow/create', description: 'Create an escrow' },
      { method: 'POST', path: '/api/escrow/:id/release', description: 'Release escrow funds' },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-400 border-green-500/25',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/25',
};

const totalEndpoints = ENDPOINT_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

export function ApiExplorer() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredGroups = search.trim()
    ? ENDPOINT_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(
          e =>
            e.path.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase()) ||
            e.method.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  const filteredTotal = filteredGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Code className="w-4 h-4 text-accent" />
          API Explorer
        </h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
          {totalEndpoints}+ endpoints
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search endpoints..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
        {search && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {filteredTotal} results
          </span>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
        {filteredGroups.map((group, gi) => {
          const isExpanded = expandedGroups.has(group.name) || search.trim().length > 0;
          return (
            <div
              key={group.name}
              className="rounded-lg border border-border bg-surface-2/30 overflow-hidden animate-list-item-in"
              style={{ animationDelay: `${gi * 40}ms` }}
            >
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">{group.name}</span>
                  <span className="text-xs text-text-muted font-mono">({group.endpoints.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border animate-slide-down">
                  {group.endpoints.map((ep, ei) => (
                    <div
                      key={`${ep.method}-${ep.path}`}
                      className="px-3 py-2 flex items-start gap-2 border-b border-border/50 last:border-b-0 hover:bg-white/[0.02] transition-colors animate-list-item-in"
                      style={{ animationDelay: `${ei * 30}ms` }}
                    >
                      <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-text-primary truncate">{ep.path}</p>
                        <p className="text-xs text-text-muted mt-0.5">{ep.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>{ENDPOINT_GROUPS.length} groups &middot; {totalEndpoints} endpoints</span>
        <span className="font-mono">REST + SSE</span>
      </div>
    </div>
  );
}
