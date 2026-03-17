import { useState, useEffect, useCallback } from 'react';
import { Server, Clock, Cpu, Database, Layers, Box } from 'lucide-react';
import { api } from '../lib/api';
import type { SystemInfoData } from '../types';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export function SystemInfo() {
  const [info, setInfo] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getSystemInfo();
      setInfo(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 animate-pulse">
        <div className="h-4 w-24 bg-surface-3 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-full bg-surface-3 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Server className="w-4 h-4 text-text-muted" />
          System Info
        </h3>
        <p className="text-xs text-text-muted mt-2">Unable to fetch system info</p>
      </div>
    );
  }

  const memPercent = info.memoryUsage.heapTotal > 0
    ? Math.round((info.memoryUsage.heapUsed / info.memoryUsage.heapTotal) * 100)
    : 0;

  const items = [
    { icon: Clock, label: 'Uptime', value: formatUptime(info.uptime), color: 'text-green-400' },
    { icon: Box, label: 'Node.js', value: info.nodeVersion, color: 'text-emerald-400' },
    { icon: Layers, label: 'WDK', value: `v${info.wdkVersion}`, color: 'text-teal-400' },
    { icon: Server, label: 'API Endpoints', value: String(info.apiEndpoints), color: 'text-blue-400' },
    { icon: Cpu, label: 'Memory', value: `${info.memoryUsage.heapUsed}MB / ${info.memoryUsage.heapTotal}MB`, color: 'text-purple-400' },
    { icon: Database, label: 'Platform', value: info.platform, color: 'text-amber-400' },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-accent" />
        System Info
        <span className="ml-auto text-[10px] font-normal text-text-muted px-1.5 py-0.5 rounded-full bg-surface-3 border border-border">
          {info.environment}
        </span>
      </h3>

      <div className="space-y-2">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </span>
            <span className="font-mono text-text-primary">{value}</span>
          </div>
        ))}
      </div>

      {/* Memory bar */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
          <span>Heap Usage</span>
          <span>{memPercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              memPercent > 80 ? 'bg-red-400' : memPercent > 60 ? 'bg-amber-400' : 'bg-accent'
            }`}
            style={{ width: `${memPercent}%` }}
          />
        </div>
      </div>

      {/* Last restart */}
      <div className="mt-2 text-[10px] text-text-muted text-right">
        Started {new Date(info.startTime).toLocaleString()}
      </div>
    </div>
  );
}
