export type ChainId = 'ethereum-sepolia' | 'ton-testnet';
export type TokenType = 'native' | 'usdt';

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

/** Wallet receive info for QR code display */
export interface WalletReceiveInfo {
  chainId: ChainId;
  chainName: string;
  address: string;
  qrCodeUrl: string;
  explorerUrl: string;
  nativeCurrency: string;
}
