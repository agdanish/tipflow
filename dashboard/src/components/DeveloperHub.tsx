// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { Code2, Bot, Webhook, FileJson, ArrowRight, Terminal, Blocks, Cpu } from 'lucide-react';

interface IntegrationPath {
  icon: React.ReactNode;
  title: string;
  description: string;
  snippet: string;
  language: string;
  color: string;
  borderColor: string;
}

const PATHS: IntegrationPath[] = [
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'SDK',
    description: 'Import the TipFlow client into any Node.js or browser app. Send tips, manage wallets, and subscribe to events in 3 lines of code.',
    language: 'typescript',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    snippet: `import { TipFlowClient } from 'tipflow-sdk';

const client = new TipFlowClient({ apiKey: 'tf_...' });

await client.tip({
  to: '0xCreator...',
  amount: '5.00',
  chain: 'ethereum-sepolia',
  token: 'usdt',
});`,
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'MCP (Model Context Protocol)',
    description: 'Any AI agent — Claude, GPT, Gemini — gets 35 wallet tools instantly. Drop this config into your agent and it can tip, bridge, lend, and stream.',
    language: 'json',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    snippet: `{
  "mcpServers": {
    "tipflow": {
      "command": "npx",
      "args": ["tipflow-mcp-server"],
      "tools": 35,
      "capabilities": [
        "tip", "batch_tip", "escrow",
        "bridge", "stream", "dca", "lend"
      ]
    }
  }
}`,
  },
  {
    icon: <Webhook className="w-5 h-5" />,
    title: 'Webhooks',
    description: 'Subscribe to real-time tip events. Get notified on every send, receive, escrow release, and stream tick across all chains.',
    language: 'bash',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    snippet: `curl -X POST https://api.tipflow.dev/webhooks \\
  -H "Authorization: Bearer tf_..." \\
  -d '{
    "url": "https://your-app.com/hooks/tips",
    "events": [
      "tip.sent", "tip.received",
      "escrow.released", "stream.tick"
    ]
  }'`,
  },
  {
    icon: <FileJson className="w-5 h-5" />,
    title: 'TipPolicy (Declarative Rules)',
    description: 'Programmable money as JSON. Define rules for automated tipping — amount limits, schedules, conditions, and multi-chain routing.',
    language: 'json',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    snippet: `{
  "policy": "auto-tip-top-creators",
  "trigger": "engagement.score > 85",
  "action": {
    "tip": { "amount": "2.00", "token": "usdt" },
    "chain": "lowest-fee",
    "escrow": { "release": "watch-time > 5m" },
    "limit": { "daily": "50.00", "per_creator": "10.00" }
  }
}`,
  },
];

const STATS = [
  { label: 'Services', value: '42' },
  { label: 'Endpoints', value: '230+' },
  { label: 'WDK Packages', value: '10' },
];

export function DeveloperHub() {
  return (
    <div className="animated-border shadow-depth">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">
              <span className="gradient-text-animated">Build on TipFlow</span>
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-mono">v1.0.0</span>
          </div>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          TipFlow is infrastructure. Four integration paths to embed programmable payments into any app, agent, or workflow.
        </p>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-5 p-2.5 rounded-lg bg-surface-2/60 border border-border">
          <Cpu className="w-4 h-4 text-accent shrink-0" />
          {STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3 animate-list-item-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-center">
                <div className="text-sm font-bold text-text-primary">{s.value}</div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
              {i < STATS.length - 1 && <div className="w-px h-6 bg-border" />}
            </div>
          ))}
        </div>

        {/* Integration paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PATHS.map((path, i) => (
            <div
              key={path.title}
              className={`glass-card glow-hover p-4 rounded-xl border-l-2 ${path.borderColor} animate-list-item-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Path header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={path.color}>{path.icon}</span>
                <h3 className="text-sm font-semibold text-text-primary">{path.title}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                {path.description}
              </p>

              {/* Code block */}
              <div className="rounded-lg bg-[#0d0e14] border border-[#1e1f2e] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e1f2e]">
                  <span className="text-xs text-text-muted font-mono uppercase tracking-wider">{path.language}</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/40" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                    <div className="w-2 h-2 rounded-full bg-green-500/40" />
                  </div>
                </div>
                <pre className="p-3 text-sm leading-relaxed overflow-x-auto font-mono text-text-secondary">
                  <code>{path.snippet}</code>
                </pre>
              </div>

              {/* CTA */}
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-all btn-press group">
                Get Started
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
