import { type RefObject } from 'react';
import { Send, Users, Scissors } from 'lucide-react';
import type { TipResult, SplitTipResult, TipTemplate, TipLink, TipHistoryEntry } from '../../types';
import { TipForm } from '../../components/TipForm';
import { BatchTipForm } from '../../components/BatchTipForm';
import { SplitTipForm } from '../../components/SplitTipForm';
import { FavoriteRecipients } from '../../components/FavoriteRecipients';

interface TipComposerProps {
  tipMode: 'single' | 'batch' | 'split';
  setTipMode: (mode: 'single' | 'batch' | 'split') => void;
  tipTabsRef: RefObject<HTMLDivElement | null>;
  history: TipHistoryEntry[];
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
  tipMode, setTipMode, tipTabsRef, history, isAgentBusy,
  pendingTemplate, tipLinkPrefill,
  onTipComplete, onTipScheduled, onBatchComplete, onSplitComplete,
  onTemplatePrefilled, onTipLinkPrefilled,
}: TipComposerProps) {
  const modes = [
    { id: 'single' as const, label: 'Single', icon: Send },
    { id: 'batch' as const, label: 'Batch', icon: Users },
    { id: 'split' as const, label: 'Split', icon: Scissors },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Mode tabs — integrated into card header */}
      <div ref={tipTabsRef} className="flex border-b border-zinc-800" data-onboarding="tip-form">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTipMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              tipMode === id
                ? 'text-white bg-zinc-800/50 border-b-2 border-emerald-500'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tip link banner */}
      {tipLinkPrefill && (
        <div className="px-5 py-3 bg-cyan-500/5 border-b border-cyan-500/20">
          <p className="text-xs font-medium text-cyan-400">
            Pre-filled: {tipLinkPrefill.amount} {tipLinkPrefill.token} → {tipLinkPrefill.recipient.slice(0, 10)}...
          </p>
        </div>
      )}

      {/* Favorites — compact inside composer */}
      <div className="px-5 pt-4">
        <FavoriteRecipients
          history={history}
          onQuickTip={(address) => {
            setTipMode('single');
            setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('[aria-label="Recipient wallet address or ENS name"]');
              if (input) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                setter?.call(input, address);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
              }
            }, 100);
          }}
        />
      </div>

      {/* Form body */}
      <div className="p-5">
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
