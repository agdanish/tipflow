// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Brain, Search, Trash2, Plus, X, Save } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

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

  // Teach agent form
  const [showStore, setShowStore] = useState(false);
  const [storeType, setStoreType] = useState('preference');
  const [storeKey, setStoreKey] = useState('');
  const [storeValue, setStoreValue] = useState('');
  const [storing, setStoring] = useState(false);

  const handleStore = async () => {
    if (!storeKey.trim() || !storeValue.trim()) return;
    setStoring(true);
    try {
      await api.memoryStore(storeType, storeKey.trim(), storeValue.trim());
      setShowStore(false);
      setStoreKey('');
      setStoreValue('');
      await load();
    } catch { /* ignore */ }
    setStoring(false);
  };

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

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text-line" width="120px" height="16px" />
        <Skeleton variant="text-line" width="140px" height="12px" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[1,2,3,4].map(i => <Skeleton key={i} variant="card" height="48px" />)}
      </div>
      <Skeleton variant="text-line" width="100%" height="32px" />
      {[1,2,3].map(i => <Skeleton key={i} variant="card" height="44px" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          Agent Memory
        </h3>
        <div className="flex items-center gap-2">
          {stats && <span className="text-xs text-text-secondary hidden sm:inline">{stats.totalMemories} memories</span>}
          <button
            onClick={() => setShowStore(!showStore)}
            className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1 btn-press"
          >
            {showStore ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showStore ? 'Cancel' : 'Teach Agent'}
          </button>
        </div>
      </div>

      {/* ── TEACH AGENT FORM ── */}
      {showStore && (
        <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2 animate-slide-down">
          <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Brain className="w-3 h-3" /> Teach Agent a New Memory
          </h4>
          <select
            value={storeType}
            onChange={e => setStoreType(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
          >
            <option value="preference">Preference</option>
            <option value="fact">Fact</option>
            <option value="context">Context</option>
            <option value="correction">Correction</option>
          </select>
          <input
            type="text"
            value={storeKey}
            onChange={e => setStoreKey(e.target.value)}
            placeholder="What to remember (key)..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
          />
          <input
            type="text"
            value={storeValue}
            onChange={e => setStoreValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStore()}
            placeholder="The information (value)..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
          />
          <button
            onClick={handleStore}
            disabled={storing || !storeKey.trim() || !storeValue.trim()}
            className="w-full py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 btn-press"
          >
            <Save className="w-3 h-3" />
            {storing ? 'Storing...' : 'Store Memory'}
          </button>
        </div>
      )}

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
              <div className="text-xs text-text-secondary">{s.label}</div>
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
        <button onClick={search} className="px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors btn-press" aria-label="Search memories">Search</button>
      </div>

      {/* Memory List */}
      {memories.length === 0 ? (
        <div className="text-center py-6 animate-fade-in">
          <Brain className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No memories yet</p>
          <p className="text-xs text-text-muted/60 mt-1">The agent learns from your interactions</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {memories.slice(0, 15).map((mem, i) => {
            const color = typeColors[mem.type] ?? 'text-accent bg-accent/10';
            return (
              <div key={mem.id} className="p-2.5 rounded-lg bg-surface-2 border border-border flex items-start gap-2 card-hover animate-list-item-in" style={{ animationDelay: `${i * 40}ms` }}>
                <span className={`text-xs px-1.5 py-0.5 rounded ${color} mt-0.5`}>
                  {mem.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{mem.key}</div>
                  <div className="text-xs text-text-secondary truncate">{mem.value}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-text-secondary">{mem.confidence}%</span>
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
