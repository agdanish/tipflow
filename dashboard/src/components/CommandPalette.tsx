// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search, Send, BarChart3, History, Settings, Zap,
  Moon, Sun, Volume2, VolumeX, Brain, Tv, Keyboard,
  GitCompareArrows, ArrowRight, Command,
  RefreshCw,
} from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'settings';
  keywords: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter actions based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.includes(q)),
    );
  }, [actions, query]);

  // Group by category
  const grouped = useMemo(() => {
    const nav = filtered.filter((a) => a.category === 'navigation');
    const act = filtered.filter((a) => a.category === 'action');
    const set = filtered.filter((a) => a.category === 'settings');
    const groups: { label: string; items: CommandAction[] }[] = [];
    if (nav.length) groups.push({ label: 'Navigate', items: nav });
    if (act.length) groups.push({ label: 'Actions', items: act });
    if (set.length) groups.push({ label: 'Settings', items: set });
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index when filtered changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (action: CommandAction) => {
      onClose();
      // Slight delay so modal closes first
      requestAnimationFrame(() => action.onSelect());
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            handleSelect(flatItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatItems, selectedIndex, handleSelect, onClose],
  );

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-white/[0.08] bg-surface-1 shadow-2xl overflow-hidden command-palette-enter"
        role="combobox"
        aria-expanded={true}
        aria-haspopup="listbox"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            aria-label="Command palette search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-3 border border-border text-xs font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2"
          role="listbox"
        >
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-6 h-6 text-text-muted/40 mx-auto mb-2" />
              <p className="text-sm text-text-muted">No commands found</p>
              <p className="text-xs text-text-muted/60 mt-1">Try a different search term</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-1.5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {group.label}
                  </p>
                </div>
                {group.items.map((item) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const idx = flatIndex; // capture for onClick
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className={`shrink-0 ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-sm text-text-muted truncate">{item.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface-2/50">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border font-mono">↑↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border font-mono">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border font-mono">esc</kbd>
            <span>close</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-text-muted">
            <Command className="w-3 h-3" />
            <span>TipFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Build the default set of command palette actions.
 */
export function useCommandActions({
  onNavigate,
  onToggleTheme,
  onToggleSound,
  onShowShortcuts,
  onRefreshBalances,
  theme,
  soundOn,
}: {
  onNavigate: (tab: string) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onShowShortcuts: () => void;
  onRefreshBalances: () => void;
  theme: 'dark' | 'light';
  soundOn: boolean;
}): CommandAction[] {
  return useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Main dashboard with wallets and tip form',
        icon: <Zap className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['home', 'main', 'dashboard', 'wallets'],
        onSelect: () => onNavigate('dashboard'),
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        description: 'Stats, charts, and leaderboard',
        icon: <BarChart3 className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['analytics', 'stats', 'charts', 'data'],
        onSelect: () => onNavigate('analytics'),
      },
      {
        id: 'nav-history',
        label: 'Go to History',
        description: 'Transaction history and exports',
        icon: <History className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['history', 'transactions', 'past', 'log'],
        onSelect: () => onNavigate('history'),
      },
      {
        id: 'nav-rumble',
        label: 'Go to Rumble',
        description: 'Rumble live stream tipping',
        icon: <Tv className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['rumble', 'stream', 'live', 'video'],
        onSelect: () => onNavigate('rumble'),
      },
      {
        id: 'nav-ai',
        label: 'Go to AI Agents',
        description: 'AI orchestrator, predictor, escrow & more',
        icon: <Brain className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['ai', 'agent', 'intelligence', 'brain', 'orchestrator'],
        onSelect: () => onNavigate('ai'),
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Wallet backup, security, webhooks',
        icon: <Settings className="w-4 h-4" />,
        category: 'navigation' as const,
        keywords: ['settings', 'config', 'preferences', 'options'],
        onSelect: () => onNavigate('settings'),
      },
      // Actions
      {
        id: 'action-send-tip',
        label: 'Send a Tip',
        description: 'Open the tip form and start sending',
        icon: <Send className="w-4 h-4" />,
        category: 'action' as const,
        keywords: ['send', 'tip', 'transfer', 'pay'],
        onSelect: () => {
          onNavigate('dashboard');
          setTimeout(() => {
            document.getElementById('nlp-input')?.focus();
          }, 100);
        },
      },
      {
        id: 'action-refresh',
        label: 'Refresh Balances',
        description: 'Fetch latest wallet balances',
        icon: <RefreshCw className="w-4 h-4" />,
        category: 'action' as const,
        keywords: ['refresh', 'reload', 'update', 'balance', 'wallet'],
        onSelect: onRefreshBalances,
      },
      {
        id: 'action-compare',
        label: 'Compare Chain Fees',
        description: 'See fee comparison across chains',
        icon: <GitCompareArrows className="w-4 h-4" />,
        category: 'action' as const,
        keywords: ['compare', 'fees', 'gas', 'chains'],
        onSelect: () => {
          onNavigate('analytics');
          setTimeout(() => {
            document.getElementById('chain-comparison-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        },
      },
      // Settings
      {
        id: 'settings-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: `Currently using ${theme} mode`,
        icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        category: 'settings' as const,
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
        onSelect: onToggleTheme,
      },
      {
        id: 'settings-sound',
        label: soundOn ? 'Mute Sounds' : 'Enable Sounds',
        description: `Sounds are currently ${soundOn ? 'on' : 'off'}`,
        icon: soundOn ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
        category: 'settings' as const,
        keywords: ['sound', 'audio', 'mute', 'volume'],
        onSelect: onToggleSound,
      },
      {
        id: 'settings-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        icon: <Keyboard className="w-4 h-4" />,
        category: 'settings' as const,
        keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys'],
        onSelect: onShowShortcuts,
      },
    ],
    [onNavigate, onToggleTheme, onToggleSound, onShowShortcuts, onRefreshBalances, theme, soundOn],
  );
}
