import { useState, useEffect, useRef } from 'react';
import {
  Send,
  XCircle,
  Clock,
  GitBranch,
  Zap,
  Brain,
  UserPlus,
  Users,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ActivityEvent, ActivityEventType, ChainId } from '../types';

const EVENT_ICONS: Record<ActivityEventType, typeof Send> = {
  tip_sent: Send,
  tip_failed: XCircle,
  tip_scheduled: Clock,
  chain_selected: GitBranch,
  fee_optimized: Zap,
  nlp_parsed: Brain,
  contact_saved: UserPlus,
  batch_started: Users,
  condition_triggered: Zap,
  condition_created: Zap,
  tip_retrying: Clock,
  system: Info,
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  tip_sent: 'text-green-400',
  tip_failed: 'text-red-400',
  tip_scheduled: 'text-amber-400',
  chain_selected: 'text-blue-400',
  fee_optimized: 'text-emerald-400',
  nlp_parsed: 'text-purple-400',
  contact_saved: 'text-cyan-400',
  batch_started: 'text-indigo-400',
  condition_triggered: 'text-yellow-400',
  condition_created: 'text-yellow-400',
  tip_retrying: 'text-orange-400',
  system: 'text-text-muted',
};

const EVENT_BG: Record<ActivityEventType, string> = {
  tip_sent: 'bg-green-500/10',
  tip_failed: 'bg-red-500/10',
  tip_scheduled: 'bg-amber-500/10',
  chain_selected: 'bg-blue-500/10',
  fee_optimized: 'bg-emerald-500/10',
  nlp_parsed: 'bg-purple-500/10',
  contact_saved: 'bg-cyan-500/10',
  batch_started: 'bg-indigo-500/10',
  condition_triggered: 'bg-yellow-500/10',
  condition_created: 'bg-yellow-500/10',
  tip_retrying: 'bg-orange-500/10',
  system: 'bg-surface-2',
};

const CHAIN_BADGES: Record<ChainId, { label: string; className: string }> = {
  'ethereum-sepolia': {
    label: 'ETH',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  'ton-testnet': {
    label: 'TON',
    className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  'tron-nile': {
    label: 'TRX',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  'ethereum-sepolia-gasless': {
    label: 'ETH-GL',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  'ton-testnet-gasless': {
    label: 'TON-GL',
    className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  'bitcoin-testnet': {
    label: 'BTC',
    className: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  'solana-devnet': {
    label: 'SOL',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  'plasma': {
    label: 'PLS',
    className: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  'stable': {
    label: 'STB',
    className: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  },
};

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

const MAX_VISIBLE = 50;

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial activity log
  useEffect(() => {
    api.getActivity().then(({ activity }) => {
      setEvents(activity.slice(-MAX_VISIBLE));
    }).catch(() => {
      // Silently fail on initial load
    });
  }, []);

  // SSE connection for real-time events
  useEffect(() => {
    let es: EventSource | null = null;

    const connect = () => {
      es = new EventSource('/api/activity/stream');

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'activity' && data.event) {
            setEvents((prev) => {
              const next = [...prev, data.event];
              return next.slice(-MAX_VISIBLE);
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es?.close();
        setIsLive(false);
        // Reconnect after 5 seconds
        setTimeout(() => {
          setIsLive(true);
          connect();
        }, 5000);
      };

      es.onopen = () => {
        setIsLive(true);
      };
    };

    connect();

    return () => {
      es?.close();
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  // Update relative times every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">Live Activity Feed</h2>
          <span className="text-[10px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <span className="text-[10px] text-text-muted">
            {isLive ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div
        ref={scrollRef}
        className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-muted">
            <Zap className="w-6 h-6 mb-2 opacity-30" />
            <p className="text-xs">No activity yet. Send a tip to see events here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {events.map((event, i) => {
              const Icon = EVENT_ICONS[event.type] ?? Info;
              const color = EVENT_COLORS[event.type] ?? 'text-text-muted';
              const bg = EVENT_BG[event.type] ?? 'bg-surface-2';
              const chainBadge = event.chainId ? CHAIN_BADGES[event.chainId] : null;
              const isNew = i === events.length - 1;

              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 px-4 py-2.5 transition-all duration-300 ${
                    isNew ? 'animate-activity-in' : ''
                  } hover:bg-surface-2/50`}
                >
                  {/* Icon */}
                  <div
                    className={`shrink-0 w-7 h-7 rounded-lg ${bg} flex items-center justify-center mt-0.5`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary leading-relaxed">
                      {event.message}
                    </p>
                    {event.detail && (
                      <p className="text-[11px] text-text-muted mt-0.5 truncate">
                        {event.detail}
                      </p>
                    )}
                  </div>

                  {/* Right side: chain badge + time */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      {relativeTime(event.timestamp)}
                    </span>
                    {chainBadge && (
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${chainBadge.className}`}
                      >
                        {chainBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
