// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Brain, Search, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface MemoryEntry {
  id: string;
  type: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  accessCount: number;
  createdAt: string;
}

interface MemoryStats {
  totalMemories: number;
  preferences: number;
  facts: number;
  contexts: number;
  corrections: number;
  conversations: number;
  avgConfidence: number;
  topMemories: { key: string; value: string; accessed: number }[];
}

const typeColors: Record<string, string> = {
  preference: 'text-yellow-400 bg-yellow-500/10',
  fact: 'text-blue-400 bg-blue-500/10',
  context: 'text-purple-400 bg-purple-500/10',
  correction: 'text-red-400 bg-red-500/10',
};

export function MemoryPanel() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [m, s] = await Promise.all([api.memoryAll(), api.memoryStats()]);
      setMemories(m as unknown as MemoryEntry[]);
      setStats(s as unknown as MemoryStats);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const search = async () => {
    if (!searchQuery.trim()) { load(); return; }
    try {
      const results = await api.memorySearch(searchQuery);
      setMemories(results as unknown as MemoryEntry[]);
    } catch { /* ignore */ }
  };

  const forget = async (id: string) => {
    try { await api.memoryForget(id); await load(); } catch { /* ignore */ }
  };

  if (loading) return <div className="p-4 text-text-secondary text-sm">Loading memories...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          Agent Memory
        </h3>
        {stats && <span className="text-[10px] text-text-secondary">{stats.totalMemories} memories | {stats.avgConfidence}% avg confidence</span>}
      </div>

      {/* Stats */}
      {stats && stats.totalMemories > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Preferences', count: stats.preferences, color: 'text-yellow-400' },
            { label: 'Facts', count: stats.facts, color: 'text-blue-400' },
            { label: 'Context', count: stats.contexts, color: 'text-purple-400' },
            { label: 'Corrections', count: stats.corrections, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="p-2 rounded bg-surface-2 border border-border text-center">
              <div className={`text-sm font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[9px] text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search memories..."
            className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-surface-2 border border-border text-text-primary text-xs placeholder:text-text-secondary"
          />
        </div>
        <button onClick={search} className="px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors">Search</button>
      </div>

      {/* Memory List */}
      {memories.length === 0 ? (
        <p className="text-xs text-text-secondary p-3 text-center">No memories yet. The agent learns from your interactions.</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {memories.slice(0, 15).map((mem) => {
            const color = typeColors[mem.type] ?? 'text-accent bg-accent/10';
            return (
              <div key={mem.id} className="p-2.5 rounded-lg bg-surface-2 border border-border flex items-start gap-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${color} mt-0.5`}>
                  {mem.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-text-primary truncate">{mem.key}</div>
                  <div className="text-[10px] text-text-secondary truncate">{mem.value}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-text-secondary">{mem.confidence}%</span>
                  <button onClick={() => forget(mem.id)} className="p-0.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
