import { useState, useRef, useEffect } from 'react';
import { Zap, Send, RefreshCw, GitCompareArrows, FileText, Download, Plus, X, Settings2 } from 'lucide-react';
import { api } from '../lib/api';

interface QuickAction {
  id: string;
  label: string;
  icon: 'send' | 'refresh' | 'compare' | 'template' | 'download';
  visible: boolean;
}

const STORAGE_KEY = 'tipflow-quick-actions';

const defaultActions: QuickAction[] = [
  { id: 'tip-0.01', label: 'Tip 0.01 ETH', icon: 'send', visible: true },
  { id: 'refresh-balances', label: 'Check Balances', icon: 'refresh', visible: true },
  { id: 'compare-fees', label: 'Compare Fees', icon: 'compare', visible: true },
  { id: 'new-template', label: 'New Template', icon: 'template', visible: true },
  { id: 'export-history', label: 'Export History', icon: 'download', visible: true },
];

function loadActions(): QuickAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultActions;
    return JSON.parse(raw) as QuickAction[];
  } catch {
    return defaultActions;
  }
}

function saveActions(actions: QuickAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
}

const iconMap = {
  send: Send,
  refresh: RefreshCw,
  compare: GitCompareArrows,
  template: FileText,
  download: Download,
};

interface QuickActionsProps {
  onRefreshBalances: () => void;
  onScrollToCompare?: () => void;
  onScrollToTemplates?: () => void;
  onQuickTip?: (amount: string) => void;
}

export function QuickActions({ onRefreshBalances, onScrollToCompare, onScrollToTemplates, onQuickTip }: QuickActionsProps) {
  const [actions, setActions] = useState<QuickAction[]>(loadActions);
  const [customizing, setCustomizing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist changes
  useEffect(() => {
    saveActions(actions);
  }, [actions]);

  const toggleAction = (id: string) => {
    setActions(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, visible: !a.visible } : a);
      return updated;
    });
  };

  const handleAction = async (id: string) => {
    switch (id) {
      case 'tip-0.01':
        onQuickTip?.('0.01');
        break;
      case 'refresh-balances':
        onRefreshBalances();
        break;
      case 'compare-fees':
        onScrollToCompare?.();
        break;
      case 'new-template':
        onScrollToTemplates?.();
        break;
      case 'export-history':
        if (exporting) return;
        setExporting(true);
        try {
          await api.exportHistory('csv');
        } catch {
          // silent fail
        } finally {
          setExporting(false);
        }
        break;
    }
  };

  const visibleActions = actions.filter(a => a.visible);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-accent" />
          Quick Actions
        </h2>
        <button
          onClick={() => setCustomizing(!customizing)}
          className={`p-1.5 rounded-md transition-colors ${
            customizing
              ? 'text-accent bg-accent/10'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
          }`}
          title="Customize actions"
        >
          {customizing ? <X className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {customizing ? (
        <div className="space-y-1.5">
          {actions.map(action => {
            const Icon = iconMap[action.icon];
            return (
              <label
                key={action.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-2 border border-border cursor-pointer hover:border-border-light transition-colors"
              >
                <input
                  type="checkbox"
                  checked={action.visible}
                  onChange={() => toggleAction(action.id)}
                  className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30"
                />
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-primary">{action.label}</span>
              </label>
            );
          })}
          <p className="text-xs text-text-muted mt-2">Toggle actions to show/hide them from the bar.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleActions.map(action => {
            const Icon = iconMap[action.icon];
            const isLoading = action.id === 'export-history' && exporting;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent-border hover:bg-accent/5 transition-all disabled:opacity-40"
              >
                <Icon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {action.label}
              </button>
            );
          })}
          {visibleActions.length === 0 && (
            <p className="text-sm text-text-muted py-1">No actions visible. Click <Plus className="w-3 h-3 inline" /> to customize.</p>
          )}
        </div>
      )}
    </div>
  );
}
