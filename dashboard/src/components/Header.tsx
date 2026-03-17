import { Activity, Zap, Github, Sun, Moon, Volume2, VolumeX, Keyboard } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { ThemeCustomizer } from './ThemeCustomizer';
import type { AppNotification } from './NotificationCenter';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  onShowShortcuts: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export function Header({ health, theme, onToggleTheme, soundOn, onToggleSound, onShowShortcuts, notifications, onMarkRead, onMarkAllRead, onClearAll }: HeaderProps) {
  return (
    <header role="banner" aria-label="TipFlow main navigation" className="border-b border-border header-gradient backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/20 flex items-center justify-center glow-accent">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text-primary leading-none tracking-tight">TipFlow</h1>
            <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 hidden xs:block">AI-Powered Multi-Chain Tipping</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {health && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
                <span className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                  health.ai === 'llm'
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    : 'bg-surface-3 border-border text-text-secondary'
                }`}>
                  {health.ai === 'llm' ? 'LLM Active' : 'Rule-based'}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-accent-dim border border-accent-border">
                <span className="relative w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent status-dot-ping" />
                <span className="text-[10px] sm:text-[11px] text-accent font-semibold">Online</span>
              </div>
            </>
          )}
          {!health && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-error/10 border border-error/20">
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-error" />
              <span className="text-[10px] sm:text-[11px] text-error font-semibold">Offline</span>
            </div>
          )}
          <NotificationCenter
            notifications={notifications}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
            onClearAll={onClearAll}
          />
          <button
            onClick={onShowShortcuts}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
            title="Keyboard shortcuts (?)"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
            title={soundOn ? 'Mute sounds' : 'Enable sounds'}
            aria-label={soundOn ? 'Mute sounds' : 'Enable sounds'}
            aria-pressed={soundOn}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="hidden sm:block">
            <ThemeCustomizer />
          </div>
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href="https://github.com/agdanish/tipflow"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
            aria-label="View TipFlow on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
