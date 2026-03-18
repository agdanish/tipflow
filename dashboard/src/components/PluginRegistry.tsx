// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState } from 'react';
import { Puzzle, CheckCircle2, Clock, Webhook, Tv, Youtube, Twitch, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planned';
  version: string;
  icon: React.ReactNode;
  color: string;
  details: string;
}

const PLUGINS: Plugin[] = [
  {
    id: 'rumble',
    name: 'Rumble Adapter',
    description: 'Live engagement tracking and automatic tipping for Rumble streamers',
    status: 'active',
    version: '1.0.0',
    icon: <Tv className="w-5 h-5" />,
    color: 'text-green-400',
    details: 'Monitors live chat, tracks watch-time, and triggers engagement-based tips via the Proof-of-Engagement protocol.',
  },
  {
    id: 'youtube',
    name: 'YouTube Adapter',
    description: 'Super Chat alternative with USDT tipping for YouTube creators',
    status: 'planned',
    version: '0.1.0-draft',
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-400',
    details: 'Will use YouTube Data API v3 for live chat monitoring and creator discovery. Planned support for Super Chat-style overlays.',
  },
  {
    id: 'twitch',
    name: 'Twitch Adapter',
    description: 'Bits-alternative tipping with multi-chain USDT for Twitch streamers',
    status: 'planned',
    version: '0.1.0-draft',
    icon: <Twitch className="w-5 h-5" />,
    color: 'text-purple-400',
    details: 'Will integrate with Twitch EventSub for real-time chat events. Supports channel point redemption triggers.',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Generic webhook adapter for any platform — build your own integration',
    status: 'active',
    version: '1.0.0',
    icon: <Webhook className="w-5 h-5" />,
    color: 'text-cyan-400',
    details: 'POST events to any URL on tip sent, tip failed, condition triggered, or escrow released. HMAC-SHA256 signed payloads.',
  },
];

export function PluginRegistry() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeCount = PLUGINS.filter(p => p.status === 'active').length;
  const plannedCount = PLUGINS.filter(p => p.status === 'planned').length;

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-accent" />
          Plugin Ecosystem
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            {activeCount} active
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {plannedCount} planned
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {PLUGINS.map((plugin, i) => {
          const isExpanded = expandedId === plugin.id;
          return (
            <div
              key={plugin.id}
              className="rounded-lg border border-border bg-surface-2/50 card-hover animate-list-item-in overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : plugin.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`shrink-0 ${plugin.color}`}>
                  {plugin.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">{plugin.name}</span>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      plugin.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {plugin.status === 'active' ? (
                        <span className="flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Active</span>
                      ) : (
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Planned</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{plugin.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-text-muted">v{plugin.version}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3 animate-slide-down">
                  <p className="text-[11px] text-text-secondary leading-relaxed">{plugin.details}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted">
                    <span>Version: <span className="font-mono text-text-secondary">{plugin.version}</span></span>
                    <span>Status: <span className={plugin.status === 'active' ? 'text-green-400' : 'text-amber-400'}>{plugin.status}</span></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Develop Your Own CTA */}
      <div className="mt-4 p-3 rounded-lg border border-dashed border-accent/30 bg-accent/5 text-center">
        <p className="text-xs font-medium text-text-primary mb-1">Build Your Own Plugin</p>
        <p className="text-[10px] text-text-muted mb-2">
          TipFlow exposes a plugin interface for any streaming or social platform.
        </p>
        <a
          href="https://github.com/user/tipflow/blob/main/PROTOCOL.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors btn-press"
        >
          <ExternalLink className="w-3 h-3" />
          Develop Your Own
        </a>
      </div>
    </div>
  );
}
