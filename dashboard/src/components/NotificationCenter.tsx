import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Send,
  XCircle,
  Zap,
  Clock,
  AlertTriangle,
  Check,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';

export type NotificationType = 'tip_sent' | 'tip_failed' | 'condition_triggered' | 'scheduled_executed' | 'low_balance';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  detail?: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'tipflow-notifications';
const MAX_NOTIFICATIONS = 50;

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Send; color: string; bg: string; label: string }> = {
  tip_sent: { icon: Send, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Tip Sent' },
  tip_failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Tip Failed' },
  condition_triggered: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Condition Triggered' },
  scheduled_executed: { icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Scheduled Tip' },
  low_balance: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Low Balance' },
};

function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppNotification[];
  } catch {
    // Ignore corrupt data
  }
  return [];
}

function saveNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClearAll }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Update relative times
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-accent text-xs font-bold text-white animate-bounce-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-surface-1 shadow-2xl z-[100] animate-slide-down overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-surface-3 transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    onClearAll();
                    setOpen(false);
                  }}
                  className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <Bell className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {[...notifications].reverse().map((notification) => {
                  const config = TYPE_CONFIG[notification.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-all hover:bg-surface-2/50 ${
                        !notification.read ? 'bg-accent/[0.03]' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center mt-0.5`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          {!notification.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.detail && (
                          <p className="text-sm text-text-muted mt-0.5 truncate">
                            {notification.detail}
                          </p>
                        )}
                        <span className="text-xs text-text-muted mt-1 block">
                          {relativeTime(notification.timestamp)}
                        </span>
                      </div>

                      {/* Mark as read */}
                      {!notification.read && (
                        <button
                          onClick={() => onMarkRead(notification.id)}
                          className="shrink-0 p-1 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-all mt-1"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook to manage notification state with localStorage persistence */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [latestId, setLatestId] = useState<string | null>(null);

  // Persist on change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const pushNotification = useCallback((type: NotificationType, message: string, detail?: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => {
      const next = [...prev, { id, type, message, detail, timestamp: new Date().toISOString(), read: false }];
      return next.slice(-MAX_NOTIFICATIONS);
    });
    setLatestId(id);
    return id;
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, pushNotification, markRead, markAllRead, clearAll, latestId };
}
