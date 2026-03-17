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
  AnalyticsData,
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
  DerivedWallet,
  TelegramBotStatus,
  SystemInfoData,
  AgentSettings,
  PersonalityDefinition,
  PersonalityType,
  TipLink,
  ENSResolveResult,
  ENSReverseResult,
  AddressTag,
  Challenge,
  StreakData,
  CalendarResponse,
  ContactImportResult,
  ChainAnalyticsResponse,
  SpendingLimit,
  SpendingTotals,
  AuditEntry,
  CSVImportResult,
  TipGoal,
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
  getContacts: (group?: string) => {
    const qs = group ? `?group=${encodeURIComponent(group)}` : '';
    return fetchJson<{ contacts: Contact[] }>(`/contacts${qs}`);
  },

  addContact: (name: string, address: string, chain?: ChainId, group?: string) =>
    fetchJson<{ contact: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ name, address, chain, group }),
    }),

  updateContact: (id: string, updates: { name?: string; group?: string }) =>
    fetchJson<{ contact: Contact }>(`/contacts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteContact: (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/contacts/${id}`, {
      method: 'DELETE',
    }),

  getContactGroups: () =>
    fetchJson<{ groups: string[] }>('/contacts/groups'),

  exportContacts: () =>
    fetchJson<Contact[]>('/contacts/export'),

  importContacts: (contactsData: Array<{ name: string; address: string; chain?: ChainId; group?: string }>) =>
    fetchJson<ContactImportResult>('/contacts/import', {
      method: 'POST',
      body: JSON.stringify(contactsData),
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
  exportHistory: (format: 'csv' | 'json' | 'markdown' | 'summary' = 'csv') => {
    const extMap: Record<string, string> = { csv: 'csv', json: 'json', markdown: 'md', summary: 'txt' };
    return downloadBlob(`${BASE}/agent/history/export?format=${format}`, `tipflow-history.${extMap[format] ?? format}`);
  },

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

  // Multi-Wallet (HD Derivation)
  listWallets: (chain?: string, count?: number) => {
    const params = new URLSearchParams();
    if (chain) params.set('chain', chain);
    if (count) params.set('count', String(count));
    const qs = params.toString();
    return fetchJson<{ wallets: DerivedWallet[]; activeIndex: number }>(`/wallets${qs ? `?${qs}` : ''}`);
  },

  getWalletByIndex: (index: number, chain?: string) => {
    const params = chain ? `?chain=${encodeURIComponent(chain)}` : '';
    return fetchJson<{ wallet: DerivedWallet }>(`/wallets/${index}${params}`);
  },

  setActiveWallet: (index: number) =>
    fetchJson<{ activeIndex: number }>('/wallets/active', {
      method: 'POST',
      body: JSON.stringify({ index }),
    }),

  // Network Health
  getNetworkHealth: () =>
    fetchJson<NetworkHealthResponse>('/network/health'),

  // Analytics
  getAnalytics: () =>
    fetchJson<AnalyticsData>('/agent/analytics'),

  // Telegram Bot
  getTelegramStatus: () =>
    fetchJson<TelegramBotStatus>('/telegram/status'),

  // System Info
  getSystemInfo: () =>
    fetchJson<SystemInfoData>('/system/info'),

  // Settings
  getSettings: () =>
    fetchJson<{ settings: AgentSettings }>('/settings'),

  updateSettings: (settings: Partial<AgentSettings>) =>
    fetchJson<{ settings: AgentSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Personality
  getPersonalities: () =>
    fetchJson<{ active: PersonalityType; personalities: PersonalityDefinition[] }>('/personality'),

  setPersonality: (type: PersonalityType) =>
    fetchJson<{ active: PersonalityType; definition: PersonalityDefinition }>('/personality', {
      method: 'PUT',
      body: JSON.stringify({ type }),
    }),

  // Tip Links
  createTipLink: (recipient: string, amount: string, token?: TokenType, message?: string, chainId?: ChainId) =>
    fetchJson<{ tipLink: TipLink }>('/tiplinks', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, token: token ?? 'native', message, chainId }),
    }),

  getTipLinks: () =>
    fetchJson<{ tipLinks: TipLink[] }>('/tiplinks'),

  getTipLink: (id: string) =>
    fetchJson<{ tipLink: TipLink }>(`/tiplinks/${encodeURIComponent(id)}`),

  deleteTipLink: (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/tiplinks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // ENS Resolution
  resolveENS: (name: string) =>
    fetchJson<ENSResolveResult>(`/ens/resolve?name=${encodeURIComponent(name)}`),

  reverseENS: (address: string) =>
    fetchJson<ENSReverseResult>(`/ens/reverse?address=${encodeURIComponent(address)}`),

  // Address Tags
  getTags: () =>
    fetchJson<{ tags: AddressTag[] }>('/tags'),

  getTag: (address: string) =>
    fetchJson<{ tag: AddressTag }>(`/tags/${encodeURIComponent(address)}`),

  addTag: (address: string, label: string, color?: string) =>
    fetchJson<{ tag: AddressTag }>('/tags', {
      method: 'POST',
      body: JSON.stringify({ address, label, color }),
    }),

  deleteTag: (address: string) =>
    fetchJson<{ deleted: boolean; address: string }>(`/tags/${encodeURIComponent(address)}`, {
      method: 'DELETE',
    }),

  // Challenges & Streaks
  getChallenges: () =>
    fetchJson<{ daily: Challenge[]; weekly: Challenge[]; streak: StreakData }>('/challenges'),

  refreshChallenges: () =>
    fetchJson<{ daily: Challenge[]; weekly: Challenge[]; streak: StreakData }>('/challenges/refresh', {
      method: 'POST',
    }),

  // Calendar
  getCalendar: (month: number, year: number) =>
    fetchJson<CalendarResponse>(`/calendar?month=${month}&year=${year}`),

  // Chain Analytics (Cross-Chain Comparison)
  getChainAnalytics: () =>
    fetchJson<ChainAnalyticsResponse>('/analytics/chains'),

  // Spending Limits
  getLimits: () =>
    fetchJson<{ spending: SpendingTotals }>('/limits'),

  updateLimits: (limits: Partial<SpendingLimit>) =>
    fetchJson<{ limits: SpendingLimit }>('/limits', {
      method: 'PUT',
      body: JSON.stringify(limits),
    }),

  // Audit Log
  getAuditLog: (filters?: { eventType?: string; dateFrom?: string; dateTo?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return fetchJson<{ entries: AuditEntry[] }>(`/audit${qs ? `?${qs}` : ''}`);
  },

  // CSV Import
  importCSV: (csv: string) =>
    fetchJson<CSVImportResult>('/tip/import', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    }),

  // Goals (Fundraising Targets)
  getGoals: () =>
    fetchJson<{ goals: TipGoal[] }>('/goals'),

  createGoal: (goal: { title: string; description?: string; targetAmount: number; token: string; recipient?: string; deadline?: string }) =>
    fetchJson<{ goal: TipGoal }>('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    }),

  updateGoal: (id: string, updates: Partial<{ title: string; description: string; targetAmount: number; deadline: string; recipient: string }>) =>
    fetchJson<{ goal: TipGoal }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteGoal: (id: string) =>
    fetchJson<{ success: boolean }>(`/goals/${id}`, {
      method: 'DELETE',
    }),

  // Demo Mode
  getDemoScenarios: () =>
    fetchJson<{ scenarios: Array<{ id: string; name: string; description: string; feature: string; action: string }>; addresses: Record<string, string> }>('/demo/scenarios'),

  demoSelfTip: () =>
    fetchJson<{ result: TipResult; demoInfo: { selfAddress: string; amount: string; purpose: string } }>('/demo/self-tip', {
      method: 'POST',
    }),
};
