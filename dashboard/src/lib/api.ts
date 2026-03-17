import type {
  WalletBalance,
  TipResult,
  TipHistoryEntry,
  AgentState,
  AgentStats,
  HealthResponse,
  ChainId,
  ChainConfig,
  TokenType,
  BatchTipResult,
  NLPTipParse,
  ScheduledTip,
  Contact,
} from '../types';

const BASE = '/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    fetchJson<HealthResponse>('/health'),

  getAddresses: () =>
    fetchJson<{ addresses: Record<ChainId, string> }>('/wallet/addresses'),

  getBalances: () =>
    fetchJson<{ balances: WalletBalance[] }>('/wallet/balances'),

  getSeed: () =>
    fetchJson<{ seed: string }>('/wallet/seed'),

  sendTip: (recipient: string, amount: string, token?: TokenType, preferredChain?: ChainId, message?: string) =>
    fetchJson<{ result: TipResult }>('/tip', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, token: token ?? 'native', preferredChain, message }),
    }),

  sendBatchTip: (recipients: Array<{ address: string; amount: string; message?: string }>, token?: TokenType, preferredChain?: ChainId) =>
    fetchJson<{ result: BatchTipResult }>('/tip/batch', {
      method: 'POST',
      body: JSON.stringify({ recipients, token: token ?? 'native', preferredChain }),
    }),

  parseTipInput: (input: string) =>
    fetchJson<{ parsed: NLPTipParse; source: 'llm' | 'regex' }>('/tip/parse', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

  estimateFees: (recipient: string, amount: string) =>
    fetchJson<{ estimates: Array<{ chainId: ChainId; fee: string }> }>(
      `/tip/estimate?recipient=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(amount)}`,
    ),

  getAgentState: () =>
    fetchJson<{ state: AgentState }>('/agent/state'),

  getHistory: () =>
    fetchJson<{ history: TipHistoryEntry[] }>('/agent/history'),

  getStats: () =>
    fetchJson<{ stats: AgentStats }>('/agent/stats'),

  getChains: () =>
    fetchJson<{ chains: ChainConfig[] }>('/chains'),

  scheduleTip: (recipient: string, amount: string, scheduledAt: string, token?: TokenType, chain?: ChainId, message?: string) =>
    fetchJson<{ tip: ScheduledTip }>('/tip/schedule', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, scheduledAt, token: token ?? 'native', chain, message }),
    }),

  getScheduledTips: () =>
    fetchJson<{ tips: ScheduledTip[] }>('/tip/scheduled'),

  cancelScheduledTip: (id: string) =>
    fetchJson<{ cancelled: boolean; id: string }>(`/tip/schedule/${id}`, {
      method: 'DELETE',
    }),

  // Address Book
  getContacts: () =>
    fetchJson<{ contacts: Contact[] }>('/contacts'),

  addContact: (name: string, address: string, chain?: ChainId) =>
    fetchJson<{ contact: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ name, address, chain }),
    }),

  deleteContact: (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/contacts/${id}`, {
      method: 'DELETE',
    }),
};
