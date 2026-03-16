/** Supported blockchain networks */
export type ChainId = 'ethereum-sepolia' | 'ton-testnet';

/** Token types supported for tipping */
export type TokenType = 'native' | 'usdt';

/** Chain configuration for WDK wallet modules */
export interface ChainConfig {
  id: ChainId;
  name: string;
  blockchain: string;
  isTestnet: boolean;
  nativeCurrency: string;
  explorerUrl: string;
  rpcUrl?: string;
}

/** Wallet balance information */
export interface WalletBalance {
  chainId: ChainId;
  address: string;
  nativeBalance: string;
  nativeCurrency: string;
  usdtBalance: string;
}

/** Tip request from the user */
export interface TipRequest {
  id: string;
  recipient: string;
  amount: string;
  token: TokenType;
  preferredChain?: ChainId;
  message?: string;
  createdAt: string;
}

/** Batch tip request — tip multiple recipients at once */
export interface BatchTipRequest {
  recipients: Array<{
    address: string;
    amount: string;
    message?: string;
  }>;
  token: TokenType;
  preferredChain?: ChainId;
}

/** Batch tip result */
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

/** Agent reasoning step */
export interface ReasoningStep {
  step: number;
  action: string;
  detail: string;
  timestamp: string;
}

/** Chain analysis result */
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

/** Agent decision result */
export interface AgentDecision {
  selectedChain: ChainId;
  reasoning: string;
  analyses: ChainAnalysis[];
  steps: ReasoningStep[];
  confidence: number;
}

/** Transaction result */
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

/** Dashboard state */
export interface AgentState {
  status: 'idle' | 'analyzing' | 'reasoning' | 'executing' | 'confirming';
  currentTip?: TipRequest;
  currentDecision?: AgentDecision;
  lastError?: string;
}

/** Tip history entry for analytics */
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

/** Agent stats for dashboard */
export interface AgentStats {
  totalTips: number;
  totalAmount: string;
  totalFeesSaved: string;
  avgTipAmount: string;
  chainDistribution: Record<ChainId, number>;
  tipsByDay: Array<{ date: string; count: number; amount: number }>;
}
