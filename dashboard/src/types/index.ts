export type ChainId = 'ethereum-sepolia' | 'ton-testnet' | 'ethereum-sepolia-gasless' | 'ton-testnet-gasless';
export type TokenType = 'native' | 'usdt';

/** Gasless status returned by the API */
export interface GaslessStatus {
  gaslessAvailable: boolean;
  evmErc4337: {
    available: boolean;
    chainId: ChainId;
    chainName: string;
    bundlerUrl: string;
    paymasterUrl: string;
    reason?: string;
  };
  tonGasless: {
    available: boolean;
    chainId: ChainId;
    chainName: string;
    reason?: string;
  };
}

/** Gasless tip result */
export interface GaslessTipResult {
  hash: string;
  fee: string;
  gasless: boolean;
  chainId: ChainId;
  explorerUrl: string;
  recipient: string;
  amount: string;
  token: TokenType;
  message?: string;
}

export interface WalletBalance {
  chainId: ChainId;
  address: string;
  nativeBalance: string;
  nativeCurrency: string;
  usdtBalance: string;
}

export interface ReasoningStep {
  step: number;
  action: string;
  detail: string;
  timestamp: string;
}

export interface ChainAnalysis {
  chainId: ChainId;
  chainName: string;
  available: boolean;
  balance: string;
  estimatedFee: string;
  estimatedFeeUsd: string;
  networkStatus: 'healthy' | 'congested' | 'down';
  score: number;
  reason: string;
}

export interface AgentDecision {
  selectedChain: ChainId;
  reasoning: string;
  analyses: ChainAnalysis[];
  steps: ReasoningStep[];
  confidence: number;
  feeComparison?: FeeComparison[];
  feeSavings?: string;
}

export interface TipResult {
  id: string;
  tipId: string;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: ChainId;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  token: TokenType;
  fee: string;
  explorerUrl: string;
  decision: AgentDecision;
  createdAt: string;
  confirmedAt?: string;
  error?: string;
  retryCount?: number;
}

export interface TipHistoryEntry {
  id: string;
  recipient: string;
  amount: string;
  token: TokenType;
  chainId: ChainId;
  txHash: string;
  status: 'confirmed' | 'failed';
  fee: string;
  createdAt: string;
  reasoning: string;
}

export interface AgentState {
  status: 'idle' | 'analyzing' | 'reasoning' | 'executing' | 'confirming';
  currentTip?: { id: string; recipient: string; amount: string };
  currentDecision?: AgentDecision;
  lastError?: string;
}

/** Fee comparison result for cross-chain cost optimization */
export interface FeeComparison {
  chainId: ChainId;
  chainName: string;
  estimatedFee: string;
  estimatedFeeUsd: string;
  savingsVsHighest: string;
  rank: number;
}

export interface AgentStats {
  totalTips: number;
  totalAmount: string;
  totalFeesSaved: string;
  avgTipAmount: string;
  chainDistribution: Record<ChainId, number>;
  tipsByDay: Array<{ date: string; count: number; volume: string }>;
  tipsByChain: Array<{ chainId: ChainId; chainName: string; count: number; volume: string; percentage: number }>;
  tipsByToken: Array<{ token: TokenType; count: number; volume: string; percentage: number }>;
  averageConfirmationTime: number;
  totalFeePaid: string;
  totalFeeSaved: string;
  successRate: number;
}

/** Natural language tip parse result */
export interface NLPTipParse {
  recipient: string;
  amount: string;
  token: 'native' | 'usdt';
  chain?: string;
  message?: string;
  confidence: number;
  rawInput: string;
}

/** Scheduled tip — a tip that will be executed at a future time */
export interface ScheduledTip {
  id: string;
  recipient: string;
  amount: string;
  token: TokenType;
  chain?: ChainId;
  message?: string;
  scheduledAt: string;
  status: 'scheduled' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
  result?: TipResult;
  recurring?: boolean;
  interval?: 'daily' | 'weekly' | 'monthly';
  lastExecuted?: string;
}

/** Reusable tip template — saved tip configurations */
export interface TipTemplate {
  id: string;
  name: string;
  recipient: string;
  amount: string;
  token: 'native' | 'usdt';
  chainId?: string;
  createdAt: string;
}

/** Address book contact */
export interface Contact {
  id: string;
  name: string;
  address: string;
  chain?: ChainId;
  tipCount: number;
  lastTipped?: string;
}

/** Leaderboard entry — top tip recipients */
export interface LeaderboardEntry {
  address: string;
  totalTips: number;
  totalVolume: string;
  rank: number;
}

/** Achievement — gamification badge with progress tracking */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export interface HealthResponse {
  status: string;
  agent: string;
  ai: string;
  chains: ChainId[];
  timestamp: string;
}

export interface ChainConfig {
  id: ChainId;
  name: string;
  blockchain: string;
  isTestnet: boolean;
  nativeCurrency: string;
  explorerUrl: string;
}

/** Real-time gas price data for a single chain */
export interface GasPriceInfo {
  chainId: ChainId;
  chainName: string;
  gasPrice: string;
  gasPriceGwei: string;
  status: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

/** Gas prices response from the API */
export interface GasPricesResponse {
  chains: GasPriceInfo[];
}

/** Condition types for smart conditional tipping */
export type ConditionType = 'gas_below' | 'balance_above' | 'time_of_day' | 'price_change';

/** A conditional tip — executes automatically when conditions are met */
export interface TipCondition {
  id: string;
  type: ConditionType;
  params: {
    threshold?: string;
    currency?: string;
    timeStart?: string;
    timeEnd?: string;
  };
  tip: {
    recipient: string;
    amount: string;
    token: 'native' | 'usdt';
    chainId?: string;
  };
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: string;
  triggeredAt?: string;
}

/** Activity event types for live tip feed */
export type ActivityEventType =
  | 'tip_sent'
  | 'tip_failed'
  | 'tip_scheduled'
  | 'chain_selected'
  | 'fee_optimized'
  | 'nlp_parsed'
  | 'contact_saved'
  | 'batch_started'
  | 'condition_triggered'
  | 'condition_created'
  | 'tip_retrying'
  | 'system';

/** Activity event for real-time activity feed */
export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  message: string;
  detail?: string;
  timestamp: string;
  chainId?: ChainId;
}

export interface BatchTipResult {
  id: string;
  total: number;
  succeeded: number;
  failed: number;
  results: TipResult[];
  totalAmount: string;
  totalFees: string;
  createdAt: string;
}

/** Split tip recipient with percentage allocation */
export interface SplitRecipient {
  address: string;
  percentage: number;
  name?: string;
}

/** Split tip result — aggregate results from all split transfers */
export interface SplitTipResult {
  totalAmount: string;
  results: Array<{
    recipient: string;
    amount: string;
    percentage: number;
    hash?: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  successCount: number;
  failCount: number;
}

/** Webhook configuration for external notifications */
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  lastTriggered?: string;
  failCount: number;
}

/** Price data for currency conversion */
export interface PriceData {
  prices: Record<string, number>;
  lastUpdated: string;
  note?: string;
}

/** Chat message for conversational interface */
export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  action?: {
    type: 'tip_executed' | 'balance_check' | 'fee_estimate' | 'address_lookup';
    data?: Record<string, unknown>;
  };
}

/** Gas speed option for transaction speed selection */
export interface GasSpeedOption {
  level: 'slow' | 'normal' | 'fast';
  label: string;
  gasPriceGwei: string;
  estimatedFee: string;
  estimatedTime: string;
}

/** Gas speeds for a chain */
export interface ChainGasSpeeds {
  chainId: string;
  chainName: string;
  speeds: GasSpeedOption[];
}

/** Tip receipt for shareable/printable receipt */
export interface TipReceipt {
  receiptId: string;
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  chain: string;
  chainName: string;
  txHash: string;
  fee: string;
  status: 'confirmed' | 'pending';
  blockNumber?: number;
  explorerUrl: string;
}

/** Wallet receive info for QR code display */
export interface WalletReceiveInfo {
  chainId: ChainId;
  chainName: string;
  address: string;
  qrCodeUrl: string;
  explorerUrl: string;
  nativeCurrency: string;
}

/** Network health status for a single chain */
export interface NetworkHealthStatus {
  chainId: string;
  chainName: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  blockNumber?: number;
}

/** Network health response from the API */
export interface NetworkHealthResponse {
  chains: NetworkHealthStatus[];
}

/** Derived wallet from HD path */
export interface DerivedWallet {
  index: number;
  address: string;
  chainId: ChainId;
  chainName: string;
  isActive: boolean;
}

/** Analytics daily volume entry */
export interface AnalyticsDailyVolume {
  date: string;
  count: number;
  volume: number;
}

/** Analytics cumulative data point */
export interface AnalyticsCumulativePoint {
  date: string;
  totalTips: number;
  totalVolume: number;
}

/** Analytics trends */
export interface AnalyticsTrends {
  tipsToday: number;
  tipsYesterday: number;
  tipsThisWeek: number;
  tipsLastWeek: number;
  avgTipSize: number;
  largestTip: number;
  busiestHour: number;
  mostActiveChain: string;
}

/** Analytics overview KPIs */
export interface AnalyticsOverview {
  totalTips: number;
  totalVolume: number;
  successRate: number;
  avgFee: number;
  totalFees: number;
  uniqueRecipients: number;
}

/** Chain distribution entry with percentage */
export interface ChainDistEntry {
  chain: string;
  count: number;
  percentage: number;
}

/** Token distribution entry with percentage */
export interface TokenDistEntry {
  token: string;
  count: number;
  percentage: number;
}

/** Hourly heatmap entry */
export interface HourlyHeatmapEntry {
  hour: number;
  count: number;
}

/** Top recipient entry */
export interface TopRecipientEntry {
  address: string;
  count: number;
  volume: number;
}

/** Tip streaks */
export interface TipStreaks {
  current: number;
  longest: number;
}

/** Full analytics response from GET /api/agent/analytics */
export interface AnalyticsData {
  overview: AnalyticsOverview;
  dailyVolume: AnalyticsDailyVolume[];
  hourlyDistribution: number[];
  hourlyHeatmap: HourlyHeatmapEntry[];
  tokenDistribution: { native: number; usdt: number };
  chainDistribution: Record<string, number>;
  chainDist: ChainDistEntry[];
  tokenDist: TokenDistEntry[];
  topRecipients: TopRecipientEntry[];
  recentTrend: 'up' | 'down' | 'stable';
  streaks: TipStreaks;
  trends: AnalyticsTrends;
  cumulativeData: AnalyticsCumulativePoint[];
  successRate: number;
  totalTips: number;
}

/** System info returned by GET /api/system/info */
export interface SystemInfoData {
  uptime: number;
  nodeVersion: string;
  wdkVersion: string;
  apiEndpoints: number;
  startTime: string;
  memoryUsage: { heapUsed: number; heapTotal: number };
  platform: string;
  environment: string;
}

/** Shareable tip link — pre-filled tip request URL */
export interface TipLink {
  id: string;
  recipient: string;
  amount: string;
  token: TokenType;
  message?: string;
  chainId?: ChainId;
  url: string;
  createdAt: string;
}

/** Agent personality types */
export type PersonalityType = 'professional' | 'friendly' | 'pirate' | 'emoji' | 'minimal';

/** Message types the personality system can format */
export type MessageType = 'greeting' | 'tip_confirmed' | 'tip_failed' | 'balance_report' | 'fee_comparison' | 'help' | 'unknown_intent';

/** A single personality definition */
export interface PersonalityDefinition {
  id: PersonalityType;
  name: string;
  description: string;
  templates: Record<MessageType, string>;
}

/** Agent settings */
export interface AgentSettings {
  personality: PersonalityType;
  defaultChain: ChainId | '';
  defaultToken: TokenType;
  autoConfirmThreshold: string;
  autoConfirmEnabled: boolean;
  notifications: {
    tipSent: boolean;
    tipFailed: boolean;
    conditionTriggered: boolean;
    scheduledExecuted: boolean;
  };
}

/** Telegram bot status */
export interface TelegramBotStatus {
  connected: boolean;
  username: string | null;
  messageCount: number;
  startedAt: string | null;
}
