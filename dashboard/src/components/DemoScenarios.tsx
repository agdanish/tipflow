import { useState, useEffect } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Zap, MessageSquare, Users, Scissors, Wallet, BarChart3, Film } from 'lucide-react';
import { api } from '../lib/api';
import type { WalletBalance, TipResult } from '../types';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  feature: string;
  icon: React.ReactNode;
  action: 'self-tip' | 'nlp-prefill' | 'batch-prefill' | 'split-prefill' | 'check-balances' | 'compare-fees';
}

const scenarios: DemoScenario[] = [
  {
    id: 'quick-tip',
    name: 'Quick Tip',
    description: 'Send a 0.0001 ETH self-tip to demonstrate a real transaction',
    feature: 'Single Tip + Agent Reasoning',
    icon: <Zap className="w-4 h-4" />,
    action: 'self-tip',
  },
  {
    id: 'nlp-tip',
    name: 'NLP Tip',
    description: 'Pre-fills the NLP input with a natural language tip command',
    feature: 'Natural Language Processing',
    icon: <MessageSquare className="w-4 h-4" />,
    action: 'nlp-prefill',
  },
  {
    id: 'batch-demo',
    name: 'Batch Demo',
    description: 'Pre-fills batch form with 2 small self-tips',
    feature: 'Batch Tipping',
    icon: <Users className="w-4 h-4" />,
    action: 'batch-prefill',
  },
  {
    id: 'split-demo',
    name: 'Split Demo',
    description: 'Pre-fills split form with 2 recipients (own address)',
    feature: 'Tip Splitting',
    icon: <Scissors className="w-4 h-4" />,
    action: 'split-prefill',
  },
  {
    id: 'check-balances',
    name: 'Check Balances',
    description: 'Shows all wallet balances across chains',
    feature: 'Multi-Chain Wallets',
    icon: <Wallet className="w-4 h-4" />,
    action: 'check-balances',
  },
  {
    id: 'compare-fees',
    name: 'Compare Fees',
    description: 'Shows cross-chain fee comparison for a demo tip',
    feature: 'Fee Optimization',
    icon: <BarChart3 className="w-4 h-4" />,
    action: 'compare-fees',
  },
];

interface DemoScenariosProps {
  onSetTipMode: (mode: 'single' | 'batch' | 'split') => void;
  onTipComplete: (result: TipResult) => void;
}

interface ScenarioResult {
  scenarioId: string;
  status: 'success' | 'error';
  message: string;
  data?: unknown;
}

export function DemoScenarios({ onSetTipMode, onTipComplete }: DemoScenariosProps) {
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [showBalances, setShowBalances] = useState(false);
  const [feeData, setFeeData] = useState<Array<{ chainId: string; fee: string }> | null>(null);

  useEffect(() => {
    api.getBalances()
      .then(({ balances: b }) => {
        setBalances(b);
        const evm = b.find((w) => w.chainId === 'ethereum-sepolia');
        if (evm) setAddress(evm.address);
      })
      .catch(() => {});
  }, []);

  const addResult = (scenarioId: string, status: 'success' | 'error', message: string, data?: unknown) => {
    setResults((prev) => [{ scenarioId, status, message, data }, ...prev.slice(0, 9)]);
  };

  const runScenario = async (scenario: DemoScenario) => {
    if (running || !address) return;
    setRunning(scenario.id);

    try {
      switch (scenario.action) {
        case 'self-tip': {
          const { result } = await api.sendTip(address, '0.0001', 'native', 'ethereum-sepolia', 'Demo self-tip');
          onTipComplete(result);
          addResult(scenario.id, result.status === 'confirmed' ? 'success' : 'error',
            result.status === 'confirmed'
              ? `Sent 0.0001 ETH to self. TX: ${result.txHash.slice(0, 16)}...`
              : result.error ?? 'Transaction failed',
            result
          );
          break;
        }
        case 'nlp-prefill': {
          onSetTipMode('single');
          // Small delay so the tip form mounts
          await new Promise((r) => setTimeout(r, 200));
          const nlpInput = document.getElementById('nlp-input') as HTMLInputElement | null;
          if (nlpInput) {
            const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeSet?.call(nlpInput, `send 0.0001 ETH to ${address}`);
            nlpInput.dispatchEvent(new Event('input', { bubbles: true }));
            nlpInput.focus();
            nlpInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          addResult(scenario.id, 'success', 'NLP input pre-filled. Click the parse button to process it.');
          break;
        }
        case 'batch-prefill': {
          onSetTipMode('batch');
          await new Promise((r) => setTimeout(r, 300));
          // Try to find the batch form textarea
          const batchArea = document.querySelector<HTMLTextAreaElement>('[aria-label="Batch recipients"]') ??
            document.querySelector<HTMLTextAreaElement>('textarea');
          if (batchArea) {
            const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            nativeSet?.call(batchArea, `${address},0.0001\n${address},0.0001`);
            batchArea.dispatchEvent(new Event('input', { bubbles: true }));
            batchArea.focus();
            batchArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          addResult(scenario.id, 'success', 'Batch form pre-filled with 2 self-tip entries.');
          break;
        }
        case 'split-prefill': {
          onSetTipMode('split');
          await new Promise((r) => setTimeout(r, 300));
          // Scroll to the split form
          const splitForm = document.querySelector('[data-testid="split-form"]') ??
            document.querySelector('form');
          if (splitForm) {
            splitForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          addResult(scenario.id, 'success', `Split form ready. Use address: ${address.slice(0, 10)}... with 50%/50% split.`);
          break;
        }
        case 'check-balances': {
          const { balances: freshBalances } = await api.getBalances();
          setBalances(freshBalances);
          setShowBalances(true);
          setFeeData(null);
          addResult(scenario.id, 'success', `Fetched balances for ${freshBalances.length} chains.`);
          break;
        }
        case 'compare-fees': {
          const { estimates } = await api.estimateFees(address, '0.001');
          setFeeData(estimates);
          setShowBalances(false);
          addResult(scenario.id, 'success', `Fee estimates retrieved for ${estimates.length} chains.`);
          break;
        }
      }
    } catch (err) {
      addResult(scenario.id, 'error', String(err));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-5 h-5 text-amber-400" />
        <h2 className="text-base font-semibold text-text-primary">Demo Scenarios</h2>
        <span className="ml-auto text-[10px] text-text-muted font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
          One-Click Demos
        </span>
      </div>

      <p className="text-xs text-text-secondary mb-4">
        Click "Run" to execute pre-built demo scenarios that showcase TipFlow features with real testnet transactions.
      </p>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {scenarios.map((s) => {
          const lastResult = results.find((r) => r.scenarioId === s.id);
          const isRunning = running === s.id;

          return (
            <div
              key={s.id}
              className={`relative rounded-lg border p-3 transition-all ${
                isRunning
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : lastResult?.status === 'success'
                  ? 'border-green-500/30 bg-green-500/5'
                  : lastResult?.status === 'error'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-border hover:border-accent-border bg-surface-2'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                  isRunning ? 'bg-amber-500/20 text-amber-400' : 'bg-surface-3 text-text-secondary'
                }`}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary">{s.name}</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">{s.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-text-muted bg-surface-3 px-2 py-0.5 rounded-full">
                  {s.feature}
                </span>
                <button
                  onClick={() => runScenario(s)}
                  disabled={isRunning || running !== null || !address}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isRunning
                      ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                      : 'bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Run
                    </>
                  )}
                </button>
              </div>

              {/* Result indicator */}
              {lastResult && !isRunning && (
                <div className={`mt-2 pt-2 border-t text-[11px] flex items-start gap-1.5 ${
                  lastResult.status === 'success'
                    ? 'border-green-500/20 text-green-400'
                    : 'border-red-500/20 text-red-400'
                }`}>
                  {lastResult.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  )}
                  <span className="text-text-secondary">{lastResult.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline results: balances or fee comparison */}
      {showBalances && balances.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            Wallet Balances
          </h3>
          <div className="space-y-1.5">
            {balances.map((b) => (
              <div key={b.chainId} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{b.chainId}</span>
                <div className="text-right">
                  <span className="font-mono text-text-primary">
                    {parseFloat(b.nativeBalance).toFixed(4)} {b.nativeCurrency}
                  </span>
                  {parseFloat(b.usdtBalance) > 0 && (
                    <span className="ml-2 text-text-muted">
                      + {parseFloat(b.usdtBalance).toFixed(2)} USDT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feeData && feeData.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <h3 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-accent" />
            Fee Comparison (0.001 ETH tip)
          </h3>
          <div className="space-y-1.5">
            {feeData.map((est, i) => (
              <div key={est.chainId} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  {i === 0 && <span className="text-green-400 text-[10px] font-bold">BEST</span>}
                  {est.chainId}
                </span>
                <span className="font-mono text-text-primary">{est.fee}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
