import { type RefObject } from 'react';
import { Send, Users, Scissors, Sparkles } from 'lucide-react';
import type { TipResult, SplitTipResult, TipTemplate, TipLink } from '../../types';
import { TipForm } from '../../components/TipForm';
import { BatchTipForm } from '../../components/BatchTipForm';
import { SplitTipForm } from '../../components/SplitTipForm';

interface TipComposerProps {
  tipMode: 'single' | 'batch' | 'split';
  setTipMode: (mode: 'single' | 'batch' | 'split') => void;
  tipTabsRef: RefObject<HTMLDivElement | null>;
  isAgentBusy: boolean;
  pendingTemplate: TipTemplate | null;
  tipLinkPrefill: TipLink | null;
  onTipComplete: (result: TipResult) => void;
  onTipScheduled: () => void;
  onBatchComplete: (results: TipResult[]) => void;
  onSplitComplete: (result: SplitTipResult) => void;
  onTemplatePrefilled: () => void;
  onTipLinkPrefilled: () => void;
}

export function TipComposer({
  tipMode, setTipMode, tipTabsRef, isAgentBusy,
  pendingTemplate, tipLinkPrefill,
  onTipComplete, onTipScheduled, onBatchComplete, onSplitComplete,
  onTemplatePrefilled, onTipLinkPrefilled,
}: TipComposerProps) {
  const modes = [
    { id: 'single' as const, label: 'Single Tip', icon: Send, desc: 'Send to one recipient' },
    { id: 'batch' as const, label: 'Batch', icon: Users, desc: 'Multiple recipients' },
    { id: 'split' as const, label: 'Split', icon: Scissors, desc: 'Split among recipients' },
  ];

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Compose Tip
        </h2>
        <span className="text-xs text-zinc-500 ml-auto">AI-powered routing</span>
      </div>

      {/* Mode selector — cards not tabs */}
      <div ref={tipTabsRef} className="grid grid-cols-3 gap-3 mb-5" data-onboarding="tip-form">
        {modes.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setTipMode(id)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${
              tipMode === id
                ? 'bg-emerald-600/10 border-emerald-600/40 text-white'
                : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <span className="text-[11px] opacity-60">{desc}</span>
          </button>
        ))}
      </div>

      {/* Tip link banner */}
      {tipLinkPrefill && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-sm">
          <span className="text-cyan-400 font-medium">Pre-filled:</span>
          <span className="text-zinc-300 ml-2">{tipLinkPrefill.amount} → {tipLinkPrefill.recipient?.slice(0, 12)}...</span>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5">
        {tipMode === 'single' && (
          <TipForm
            onTipComplete={onTipComplete}
            onTipScheduled={onTipScheduled}
            disabled={isAgentBusy}
            prefillTemplate={pendingTemplate}
            onTemplatePrefilled={onTemplatePrefilled}
            prefillTipLink={tipLinkPrefill}
            onTipLinkPrefilled={onTipLinkPrefilled}
          />
        )}
        {tipMode === 'batch' && <BatchTipForm onBatchComplete={onBatchComplete} disabled={isAgentBusy} />}
        {tipMode === 'split' && <SplitTipForm onSplitComplete={onSplitComplete} disabled={isAgentBusy} />}
      </div>
    </div>
  );
}
