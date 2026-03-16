import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type {
  WalletBalance,
  TipHistoryEntry,
  AgentState,
  AgentStats,
  HealthResponse,
} from '../types';

/** Hook for polling agent health */
export function useHealth(interval = 5000) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const data = await api.health();
        if (mounted) { setHealth(data); setError(null); }
      } catch (err) {
        if (mounted) setError(String(err));
      }
    };
    poll();
    const id = setInterval(poll, interval);
    return () => { mounted = false; clearInterval(id); };
  }, [interval]);

  return { health, error };
}

/** Hook for wallet balances with polling */
export function useBalances(interval = 10000) {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { balances: b } = await api.getBalances();
      setBalances(b);
    } catch {
      // Keep existing balances on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { balances, loading, refresh };
}

/** Hook for agent state via SSE (real-time) with polling fallback */
export function useAgentState() {
  const [state, setState] = useState<AgentState>({ status: 'idle' });

  useEffect(() => {
    let es: EventSource | null = null;
    let fallbackId: ReturnType<typeof setInterval> | null = null;

    const connectSSE = () => {
      es = new EventSource('/api/agent/events');
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state' && data.state) {
            setState(data.state);
          }
        } catch {
          // Ignore parse errors
        }
      };
      es.onerror = () => {
        es?.close();
        // Fallback to polling on SSE failure
        if (!fallbackId) {
          fallbackId = setInterval(async () => {
            try {
              const { state: s } = await api.getAgentState();
              setState(s);
            } catch {
              // Ignore
            }
          }, 2000);
        }
      };
    };

    connectSSE();

    return () => {
      es?.close();
      if (fallbackId) clearInterval(fallbackId);
    };
  }, []);

  return state;
}

/** Hook for tip history */
export function useHistory(interval = 5000) {
  const [history, setHistory] = useState<TipHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { history: h } = await api.getHistory();
      setHistory(h);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { history, loading, refresh };
}

/** Hook for agent stats */
export function useStats(interval = 10000) {
  const [stats, setStats] = useState<AgentStats | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { stats: s } = await api.getStats();
      setStats(s);
    } catch {
      // Keep existing
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { stats, refresh };
}
