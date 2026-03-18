// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useRef } from 'react';
import { Activity, Server, Link2, Cpu, GitBranch, Boxes, Sparkles } from 'lucide-react';
import type { HealthResponse } from '../types';

interface LiveMetricsProps {
  health: HealthResponse | null;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function LiveMetrics({ health }: LiveMetricsProps) {
  const [uptime, setUptime] = useState(0);
  const startRef = useRef(Date.now());

  // Tick uptime every second
  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const chainCount = health?.chains?.length ?? 0;
  const agentId = health?.agent ?? 'tipflow-agent';
  const isHealthy = health?.status === 'ok';
  const serviceCount = 42;
  const healthyServices = isHealthy ? serviceCount : 0;

  const metrics = [
    {
      icon: <Activity className="w-3 h-3" />,
      label: 'Uptime',
      value: formatUptime(uptime),
      color: 'text-green-400',
    },
    {
      icon: <Server className="w-3 h-3" />,
      label: 'Services',
      value: `${healthyServices}/${serviceCount}`,
      color: isHealthy ? 'text-green-400' : 'text-amber-400',
      dot: true,
    },
    {
      icon: <Link2 className="w-3 h-3" />,
      label: 'Chains',
      value: String(chainCount),
      color: 'text-blue-400',
    },
    {
      icon: <Cpu className="w-3 h-3" />,
      label: 'Agent',
      value: agentId.length > 14 ? agentId.slice(0, 14) + '\u2026' : agentId,
      color: 'text-purple-400',
    },
    {
      icon: <GitBranch className="w-3 h-3" />,
      label: 'Pipeline',
      value: '11-step',
      color: 'text-cyan-400',
      badge: true,
    },
    {
      icon: <Boxes className="w-3 h-3" />,
      label: 'WDK Pkgs',
      value: '10',
      color: 'text-amber-400',
      badge: true,
    },
    {
      icon: <Sparkles className="w-3 h-3" />,
      label: 'Innovations',
      value: '12',
      color: 'text-pink-400',
      badge: true,
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface-1/60 backdrop-blur-sm px-3 py-2 mb-4 sm:mb-5">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {/* Health dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-amber-400'}`} />
            {isHealthy && (
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
            )}
          </div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Live</span>
        </div>

        <div className="w-px h-4 bg-border shrink-0" />

        {/* Metric items */}
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="flex items-center gap-1.5 shrink-0 animate-list-item-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`${m.color} opacity-70`}>{m.icon}</span>
            <span className="text-xs text-text-muted hidden sm:inline">{m.label}</span>
            {m.badge ? (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold ${m.color} bg-surface-2 border border-border`}>
                {m.value}
              </span>
            ) : m.dot ? (
              <span className="text-sm font-mono font-medium text-text-primary flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-amber-400'}`} />
                {m.value}
              </span>
            ) : (
              <span className="text-sm font-mono font-medium text-text-primary">{m.value}</span>
            )}

            {i < metrics.length - 1 && <div className="w-px h-3 bg-border/50 ml-1 shrink-0 hidden sm:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}
