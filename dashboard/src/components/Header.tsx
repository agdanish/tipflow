import { Zap, Sun, Moon, Volume2, VolumeX, Keyboard } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
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
  const isOnline = !!health;
  const aiMode = health?.ai;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">TipFlow</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {aiMode === 'llm' ? 'AI' : 'Rule-based'}
            </span>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-zinc-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="w-px h-5 bg-zinc-800 mx-1 hidden sm:block" />

            {/* Notification center */}
            <NotificationCenter
              notifications={notifications}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              onClearAll={onClearAll}
            />

            {/* Theme toggle */}
            <button onClick={onToggleTheme} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sound toggle */}
            <button onClick={onToggleSound} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors" aria-label="Toggle sound">
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Keyboard shortcuts */}
            <button onClick={onShowShortcuts} className="hidden sm:flex p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors" aria-label="Keyboard shortcuts">
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
