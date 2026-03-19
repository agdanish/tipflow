// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Ban, ChevronDown, ChevronUp } from 'lucide-react';

interface RiskFactor {
  name: string;
  score: number;
  weight: string;
  description: string;
}

const RISK_FACTORS: RiskFactor[] = [
  { name: 'Recipient Trust', score: 0, weight: '20%', description: 'Known vs unknown vs blocked addresses' },
  { name: 'Amount Anomaly', score: 0, weight: '15%', description: 'Compared to historical average' },
  { name: 'Fee Proportionality', score: 0, weight: '15%', description: 'Gas-to-tip ratio' },
  { name: 'Temporal Pattern', score: 0, weight: '5%', description: 'Unusual time of day' },
  { name: 'Frequency', score: 0, weight: '15%', description: 'Rapid-fire tip detection' },
  { name: 'Balance Drain', score: 0, weight: '15%', description: 'Would deplete wallet' },
  { name: 'Chain Health', score: 0, weight: '5%', description: 'Network congestion' },
  { name: 'Behavioral Deviation', score: 0, weight: '10%', description: 'Unusual spending patterns' },
];

function RiskBar({ score, label }: { score: number; label: string }) {
  const color = score <= 25 ? '#22c55e' : score <= 50 ? '#f59e0b' : score <= 75 ? '#f97316' : '#ef4444';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="tabular-nums" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function RiskDashboard() {
  const [expanded, setExpanded] = useState(false);
  const [simulatedScore] = useState(18); // Demo: low risk

  const level = simulatedScore <= 25 ? 'LOW' : simulatedScore <= 50 ? 'MEDIUM' : simulatedScore <= 75 ? 'HIGH' : 'CRITICAL';
  const LevelIcon = simulatedScore <= 25 ? ShieldCheck : simulatedScore <= 50 ? AlertTriangle : simulatedScore <= 75 ? ShieldAlert : Ban;
  const levelColor = simulatedScore <= 25 ? 'text-green-400' : simulatedScore <= 50 ? 'text-amber-400' : simulatedScore <= 75 ? 'text-orange-400' : 'text-red-400';
  const levelBg = simulatedScore <= 25 ? 'bg-green-500/10 border-green-500/20' : simulatedScore <= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-accent" />
          Risk Engine
        </h3>
        <span className="text-xs text-text-muted">8-factor assessment</span>
      </div>

      {/* Overall risk level */}
      <div className={`p-3 rounded-lg border ${levelBg} flex items-center gap-3`}>
        <LevelIcon className={`w-8 h-8 ${levelColor}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${levelColor}`}>{level} RISK</span>
            <span className="text-xs text-text-muted tabular-nums">Score: {simulatedScore}/100</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {simulatedScore <= 25 ? 'All factors within normal parameters — safe to execute' :
             simulatedScore <= 50 ? 'Some elevated factors — proceeding with caution' :
             'Multiple risk factors elevated — requires review'}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            simulatedScore <= 25 ? 'bg-green-500/20 text-green-400' :
            simulatedScore <= 50 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {simulatedScore <= 25 ? 'AUTO-EXECUTE' : simulatedScore <= 50 ? 'WARN' : 'CONFIRM'}
          </span>
        </div>
      </div>

      {/* Factor breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse risk factor breakdown' : 'Expand risk factor breakdown'}
        className="w-full flex items-center justify-between text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <span>Risk Factor Breakdown (8 dimensions)</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-2 animate-slide-down">
          {RISK_FACTORS.map((factor, i) => (
            <div key={factor.name} className="p-2 rounded-lg bg-surface-2 border border-border animate-list-item-in" style={{ animationDelay: `${i * 40}ms` }}>
              <RiskBar score={Math.max(5, Math.floor(Math.random() * 30))} label={`${factor.name} (${factor.weight})`} />
              <p className="text-xs text-text-muted mt-1">{factor.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
