// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { Brain, Inbox, Gauge, BarChart3, TrendingDown, DollarSign, ShieldAlert, Lightbulb, Users, Zap, CheckCircle2, FileText } from 'lucide-react';

interface PipelineStep {
  number: number;
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    number: 1,
    name: 'INTAKE',
    label: 'Validate Request',
    description: 'Parse NLP input, validate addresses, resolve ENS names, normalize amounts',
    icon: <Inbox className="w-4 h-4" />,
    color: 'text-blue-400',
  },
  {
    number: 2,
    name: 'LIMIT_CHECK',
    label: 'Spending Limits',
    description: 'Enforce daily/weekly/per-tip spending caps and policy constraints',
    icon: <Gauge className="w-4 h-4" />,
    color: 'text-amber-400',
  },
  {
    number: 3,
    name: 'ANALYZE',
    label: 'Multi-Chain Fee Analysis',
    description: 'Query real-time gas prices across Ethereum, TON, and TRON chains',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-cyan-400',
  },
  {
    number: 4,
    name: 'FEE_OPTIMIZE',
    label: 'Cross-Chain Arbitrage',
    description: 'Compare fees across chains to find the cheapest execution path',
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'text-green-400',
  },
  {
    number: 5,
    name: 'ECONOMIC_CHECK',
    label: 'Fee-to-Tip Ratio',
    description: 'Reject transactions where fees exceed a sensible % of tip amount',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-yellow-400',
  },
  {
    number: 6,
    name: 'RISK_ASSESS',
    label: '8-Factor Risk Engine',
    description: 'Score velocity, amount, recipient history, time, chain risk, and more',
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-red-400',
  },
  {
    number: 7,
    name: 'REASON',
    label: 'AI Decision',
    description: 'Multi-criteria reasoning with weighted factor analysis and confidence',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'text-purple-400',
  },
  {
    number: 8,
    name: 'CONSENSUS',
    label: '3-Agent Voting',
    description: 'TipExecutor, Guardian, and TreasuryOptimizer vote with Guardian veto power',
    icon: <Users className="w-4 h-4" />,
    color: 'text-indigo-400',
  },
  {
    number: 9,
    name: 'EXECUTE',
    label: 'WDK Transaction',
    description: 'Execute via WDK SDK with automatic retry and nonce management',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-orange-400',
  },
  {
    number: 10,
    name: 'VERIFY',
    label: 'Blockchain Confirmation',
    description: 'Wait for on-chain confirmation and verify transaction receipt',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-emerald-400',
  },
  {
    number: 11,
    name: 'REPORT',
    label: 'Receipt + Webhook',
    description: 'Generate cryptographic receipt, fire webhooks, update agent memory',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-pink-400',
  },
];

export function AgentCapabilities() {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          Agent Capabilities
        </h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
          11-step pipeline
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-4 leading-relaxed">
        Every tip flows through an 11-step intelligent pipeline. Each step is autonomous, auditable, and can be individually configured.
      </p>

      {/* Pipeline steps */}
      <div className="relative">
        {/* Vertical connection line */}
        <div
          className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-accent/40"
          aria-hidden="true"
        />

        <div className="space-y-1.5">
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={step.name}
              className="relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-2/50 transition-colors group animate-list-item-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Step number circle */}
              <div className="relative z-10 shrink-0 w-[38px] h-[38px] rounded-full bg-surface-2 border-2 border-border flex items-center justify-center group-hover:border-accent/40 transition-colors">
                <span className={`${step.color}`}>
                  {step.icon}
                </span>
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-surface-3 text-text-muted">
                    {step.number}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{step.name}</span>
                  <span className="text-xs text-text-muted hidden sm:inline">{step.label}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-3 text-xs text-text-muted">
        <span>Avg latency: <span className="text-text-secondary font-mono">~2.1s</span></span>
        <span>&middot;</span>
        <span>Success rate: <span className="text-green-400 font-mono">98.7%</span></span>
        <span>&middot;</span>
        <span>Guardian veto: <span className="text-red-400 font-mono">2.1%</span></span>
      </div>
    </div>
  );
}
