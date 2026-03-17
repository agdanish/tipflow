import type {
  WalletBalance,
  WalletReceiveInfo,
  TipResult,
  TipReceipt,
  TipHistoryEntry,
  GaslessStatus,
  GaslessTipResult,
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
  GasPricesResponse,
  ActivityEvent,
  LeaderboardEntry,
  Achievement,
  ChatMessage,
  PriceData,
  TipTemplate,
  SplitRecipient,
  SplitTipResult,
  TipCondition,
  ConditionType,
  WebhookConfig,
  NetworkHealthResponse,
  ChainGasSpeeds,
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

/** Trigger a file download from a fetch response */
async function downloadBlob(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  // Extract filename from Content-Disposition header, or use fallback
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  a.download = match?.[1] ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export const api = {
  health: () =>
    fetchJson<HealthResponse>('/health'),

  getAddresses: () =>
    fetchJson<{ addresses: Record<ChainId, string> }>('/wallet/addresses'),

  getBalances: () =>
    fetchJson<{ balances: WalletBalance[] }>('/wallet/balances'),

  getReceiveInfo: () =>
    fetchJson<{ wallets: WalletReceiveInfo[] }>('/wallet/receive'),

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

  splitTip: (recipients: SplitRecipient[], totalAmount: string, token?: TokenType, chainId?: string) =>
    fetchJson<{ result: SplitTipResult }>('/tip/split', {
      method: 'POST',
      body: JSON.stringify({ recipients, totalAmount, token: token ?? 'native', chainId }),
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

  getHistory: (filters?: { search?: string; chain?: string; status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.chain) params.set('chain', filters.chain);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    const qs = params.toString();
    return fetchJson<{ history: TipHistoryEntry[]; total: number }>(`/agent/history${qs ? `?${qs}` : ''}`);
  },

  getGasSpeeds: () =>
    fetchJson<{ speeds: ChainGasSpeeds[] }>('/gas/speeds'),

  getStats: () =>
    fetchJson<{ stats: AgentStats }>('/agent/stats'),

  getChains: () =>
    fetchJson<{ chains: ChainConfig[] }>('/chains'),

  scheduleTip: (recipient: string, amount: string, scheduledAt: string, token?: TokenType, chain?: ChainId, message?: string, recurring?: boolean, interval?: 'daily' | 'weekly' | 'monthly') =>
    fetchJson<{ tip: ScheduledTip }>('/tip/schedule', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, scheduledAt, token: token ?? 'native', chain, message, recurring, interval }),
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

  // Gas Prices
  getGasPrices: () =>
    fetchJson<GasPricesResponse>('/gas'),

  // Leaderboard & Achievements
  getLeaderboard: () =>
    fetchJson<{ leaderboard: LeaderboardEntry[] }>('/leaderboard'),

  getAchievements: () =>
    fetchJson<{ achievements: Achievement[] }>('/achievements'),

  // Tip Templates
  getTemplates: () =>
    fetchJson<{ templates: TipTemplate[] }>('/templates'),

  createTemplate: (template: { name: string; recipient: string; amount: string; token?: 'native' | 'usdt'; chainId?: string }) =>
    fetchJson<{ template: TipTemplate }>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),

  deleteTemplate: (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/templates/${id}`, {
      method: 'DELETE',
    }),

  // Prices
  getPrices: () =>
    fetchJson<PriceData>('/prices'),

  // Activity Feed
  getActivity: () =>
    fetchJson<{ activity: ActivityEvent[] }>('/activity'),

  // Chat
  sendChatMessage: (message: string) =>
    fetchJson<{ message: ChatMessage }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Export
  exportHistory: (format: 'csv' = 'csv') =>
    downloadBlob(`${BASE}/agent/history/export?format=${format}`, `tipflow-history.${format}`),

  // Receipt
  getReceipt: (tipId: string) =>
    fetchJson<{ receipt: TipReceipt }>(`/tip/${encodeURIComponent(tipId)}/receipt`),

  // Conditional Tips
  getConditions: () =>
    fetchJson<{ conditions: TipCondition[] }>('/conditions'),

  createCondition: (type: ConditionType, params: TipCondition['params'], tip: TipCondition['tip']) =>
    fetchJson<{ condition: TipCondition }>('/conditions', {
      method: 'POST',
      body: JSON.stringify({ type, params, tip }),
    }),

  cancelCondition: (id: string) =>
    fetchJson<{ cancelled: boolean; id: string }>(`/conditions/${id}`, {
      method: 'DELETE',
    }),

  // Gasless / ERC-4337
  getGaslessStatus: () =>
    fetchJson<GaslessStatus>('/gasless/status'),

  sendGaslessTip: (recipient: string, amount: string, token?: TokenType, message?: string) =>
    fetchJson<{ result: GaslessTipResult }>('/tip/gasless', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, token: token ?? 'native', message }),
    }),

  // Webhooks
  getWebhooks: () =>
    fetchJson<{ webhooks: WebhookConfig[] }>('/webhooks'),

  registerWebhook: (url: string, events: string[]) =>
    fetchJson<{ webhook: WebhookConfig }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    }),

  deleteWebhook: (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/webhooks/${id}`, {
      method: 'DELETE',
    }),

  testWebhooks: () =>
    fetchJson<{ sent: boolean; webhookCount: number }>('/webhooks/test', {
      method: 'POST',
    }),

  // OpenAPI Docs
  getOpenApiSpec: () =>
    fetchJson<Record<string, unknown>>('/docs'),

  // Network Health
  getNetworkHealth: () =>
    fetchJson<NetworkHealthResponse>('/network/health'),
};
