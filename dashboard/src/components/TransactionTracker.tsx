// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Loader2, ExternalLink, Zap } from 'lucide-react';
import type { TipResult } from '../types';

interface TransactionTrackerProps {
  result: TipResult | null;
  onDismiss: () => void;
}

type Stage = 'submitted' | 'propagating' | 'confirming' | 'confirmed';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'propagating', label: 'Propagating' },
  { id: 'confirming', label: 'Confirming' },
  { id: 'confirmed', label: 'Confirmed' },
];

export function TransactionTracker({ result, onDismiss }: TransactionTrackerProps) {
  const [stage, setStage] = useState<Stage>('submitted');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!result) return;

    setStage('submitted');
    setElapsed(0);

    // Simulate progression for demo (real app would poll tx status)
    const timers = [
      setTimeout(() => setStage('propagating'), 800),
      setTimeout(() => setStage('confirming'), 2000),
      setTimeout(() => setStage('confirmed'), 3500),
    ];

    const counter = setInterval(() => setElapsed((p) => p + 100), 100);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(counter);
    };
  }, [result]);

  if (!result) return null;

  const isEth = result.chainId.startsWith('ethereum');
  const explorerBase = isEth
    ? 'https://sepolia.etherscan.io/tx/'
    : 'https://testnet.tonviewer.com/transaction/';
  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const isComplete = stage === 'confirmed';
  const token = result.token === 'usdt' ? 'USDT' : isEth ? 'ETH' : 'TON';

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-500 ${
      isComplete
        ? 'border-green-500/30 bg-green-500/5'
        : 'border-accent-border bg-surface-1 animated-border'
    }`}>
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Transaction Tracker
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted font-mono tabular-nums">
              {(elapsed / 1000).toFixed(1)}s
            </span>
            {isComplete && (
              <button
                onClick={onDismiss}
                className="text-[10px] text-accent hover:text-accent-light transition-colors btn-press"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Progress pipeline */}
        <div className="flex items-center gap-1 mb-4">
          {STAGES.map((s, i) => {
            const isActive = i === stageIndex;
            const isDone = i < stageIndex;

            return (
              <div key={s.id} className="flex items-center flex-1 gap-1">
                {/* Node */}
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-green-500/20 text-green-400'
                    : isActive
                      ? 'bg-accent/20 text-accent animate-step-pulse'
                      : 'bg-surface-3 text-text-muted'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </div>
                {/* Connector */}
                {i < STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                    isDone ? 'bg-green-400' : 'bg-surface-3'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Stage labels */}
        <div className="flex justify-between mb-4 px-1">
          {STAGES.map((s, i) => (
            <span
              key={s.id}
              className={`text-[9px] font-medium transition-colors ${
                i <= stageIndex ? 'text-text-secondary' : 'text-text-muted/50'
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* Transaction details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Amount</p>
            <p className="font-semibold text-text-primary tabular-nums">{result.amount} {token}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Chain</p>
            <p className="font-semibold text-text-primary">{isEth ? 'Ethereum Sepolia' : 'TON Testnet'}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Fee</p>
            <p className="font-semibold text-text-primary tabular-nums">{result.fee}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Explorer</p>
            <a
              href={`${explorerBase}${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-light flex items-center gap-1 transition-colors"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
