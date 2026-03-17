import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import type { TelegramBotStatus } from '../types';

export function TelegramStatus() {
  const [status, setStatus] = useState<TelegramBotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getTelegramStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const connected = status?.connected ?? false;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          Telegram Bot
        </h3>
        <button
          onClick={refresh}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-zinc-500'
          }`}
        />
        <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-text-muted'}`}>
          {connected ? 'Connected' : 'Not Configured'}
        </span>
      </div>

      {connected && status ? (
        <div className="space-y-2">
          {/* Bot username */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Bot</span>
            <a
              href={`https://t.me/${status.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              @{status.username}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Message count */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Messages</span>
            <span className="text-text-secondary font-mono">{status.messageCount}</span>
          </div>

          {/* Uptime */}
          {status.startedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Since</span>
              <span className="text-text-secondary">
                {new Date(status.startedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-text-muted space-y-1.5">
          <p>Set <code className="px-1 py-0.5 rounded bg-surface-2 text-text-secondary font-mono text-[10px]">TELEGRAM_BOT_TOKEN</code> to enable.</p>
          <p className="text-[11px]">
            Create a bot via{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              @BotFather
            </a>
            {' '}on Telegram.
          </p>
        </div>
      )}
    </div>
  );
}
