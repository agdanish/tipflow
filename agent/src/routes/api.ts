import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JsonRpcProvider, formatUnits } from 'ethers';
import type { TipFlowAgent } from '../core/agent.js';
import type { WalletService } from '../services/wallet.service.js';
import type { AIService } from '../services/ai.service.js';
import { ContactsService } from '../services/contacts.service.js';
import { TemplatesService } from '../services/templates.service.js';
import { WebhooksService } from '../services/webhooks.service.js';
import { PersonalityService } from '../services/personality.service.js';
import type { PersonalityType, AgentSettings } from '../types/index.js';
import type { ActivityEvent, ChatMessage, ChainId, ConditionType, TipRequest, TokenType, BatchTipRequest, SplitTipRequest, TipLink } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { transactionLimiter } from '../middleware/rateLimit.js';
import { validateTipInput, validateBatchTipInput, validateChatInput, auditLog } from '../middleware/validate.js';
import { getOpenApiSpec } from './openapi.js';
import { ExportService } from '../services/export.service.js';
import { ENSService } from '../services/ens.service.js';
import { TagsService } from '../services/tags.service.js';
import { ChallengesService } from '../services/challenges.service.js';
import { LimitsService } from '../services/limits.service.js';
import { GoalsService } from '../services/goals.service.js';

/** Shared challenges service instance — exported for agent integration */
export const challenges = new ChallengesService();

/** Shared limits service instance — exported for agent integration */
export const limitsService = new LimitsService();

/** Shared goals service instance — exported for agent integration */
export const goalsService = new GoalsService();

/** Shared contacts service instance */
const contacts = new ContactsService();

/** Shared templates service instance */
const templates = new TemplatesService();

/** Shared webhooks service instance — exported for agent integration */
export const webhooks = new WebhooksService();

/** Shared personality service instance — exported for agent integration */
export const personality = new PersonalityService();

/** In-memory agent settings */
let agentSettings: AgentSettings = {
  personality: 'friendly',
  defaultChain: '',
  defaultToken: 'native',
  autoConfirmThreshold: '0.01',
  autoConfirmEnabled: false,
  notifications: {
    tipSent: true,
    tipFailed: true,
    conditionTriggered: true,
    scheduledExecuted: true,
  },
};

/** Shared export service instance */
const exportService = new ExportService();

/** Shared ENS service instance */
const ensService = new ENSService();

/** Shared tags service instance */
const tagsService = new TagsService();

/** In-memory tip link store */
const tipLinks: TipLink[] = [];

/** Create API router with injected dependencies */
export function createApiRouter(
  agent: TipFlowAgent,
  wallet: WalletService,
  ai: AIService,
): Router {
  const router = Router();

  // Apply audit logging to all API routes
  router.use(auditLog());

  /** GET /api/health — Service health check */
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      agent: agent.getState().status,
      ai: ai.isAvailable() ? 'llm' : 'rule-based',
      chains: wallet.getRegisteredChains(),
      timestamp: new Date().toISOString(),
    });
  });

  /** GET /api/docs — OpenAPI 3.0 specification */
  router.get('/docs', (_req, res) => {
    res.json(getOpenApiSpec());
  });

  /** GET /api/network/health — Check connectivity to each registered chain */
  router.get('/network/health', async (_req, res) => {
    try {
      const chainIds = wallet.getRegisteredChains();
      const results = await Promise.all(
        chainIds.map(async (chainId) => {
          const config = wallet.getChainConfig(chainId);
          const start = Date.now();

          if (config.blockchain === 'ethereum') {
            try {
              const rpcUrl = config.rpcUrl
                ?? process.env.ETH_SEPOLIA_RPC
                ?? 'https://ethereum-sepolia-rpc.publicnode.com';
              const provider = new JsonRpcProvider(rpcUrl);
              const blockNumber = await provider.getBlockNumber();
              const latencyMs = Date.now() - start;
              const status = latencyMs > 2000 ? 'degraded' : 'healthy';
              return { chainId, chainName: config.name, status, latencyMs, blockNumber };
            } catch {
              return { chainId, chainName: config.name, status: 'down' as const, latencyMs: Date.now() - start };
            }
          }

          // TON: try a simple fetch to the TON API
          try {
            const tonApi = 'https://testnet.toncenter.com/api/v2/getMasterchainInfo';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(tonApi, { signal: controller.signal });
            clearTimeout(timeout);
            const latencyMs = Date.now() - start;
            if (!resp.ok) {
              return { chainId, chainName: config.name, status: 'down' as const, latencyMs };
            }
            const data = await resp.json() as { ok: boolean; result?: { last?: { seqno?: number } } };
            const blockNumber = data?.result?.last?.seqno;
            const status = latencyMs > 2000 ? 'degraded' : 'healthy';
            return { chainId, chainName: config.name, status, latencyMs, blockNumber };
          } catch {
            return { chainId, chainName: config.name, status: 'down' as const, latencyMs: Date.now() - start };
          }
        }),
      );

      res.json({ chains: results });
    } catch (err) {
      logger.error('Network health check failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to check network health' });
    }
  });

  /** GET /api/wallet/addresses — Get all wallet addresses */
  router.get('/wallet/addresses', async (_req, res) => {
    try {
      const addresses = await wallet.getAllAddresses();
      res.json({ addresses });
    } catch (err) {
      logger.error('Failed to get addresses', { error: String(err) });
      res.status(500).json({ error: 'Failed to fetch wallet addresses' });
    }
  });

  /** GET /api/wallet/balances — Get all wallet balances */
  router.get('/wallet/balances', async (_req, res) => {
    try {
      const balances = await wallet.getAllBalances();
      res.json({ balances });
    } catch (err) {
      logger.error('Failed to get balances', { error: String(err) });
      res.status(500).json({ error: 'Failed to fetch balances' });
    }
  });

  /** GET /api/wallet/receive — Get wallet addresses formatted for receiving with QR code URLs */
  router.get('/wallet/receive', async (_req, res) => {
    try {
      const addresses = await wallet.getAllAddresses();
      const chains = wallet.getRegisteredChains();
      const wallets = chains
        .filter((chainId) => addresses[chainId])
        .map((chainId) => {
          const config = wallet.getChainConfig(chainId);
          const address = addresses[chainId];
          const isEth = chainId.startsWith('ethereum');
          const explorerBase = isEth
            ? 'https://sepolia.etherscan.io/address/'
            : 'https://testnet.tonviewer.com/';
          return {
            chainId,
            chainName: config.name,
            address,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(address)}`,
            explorerUrl: `${explorerBase}${address}`,
            nativeCurrency: config.nativeCurrency,
          };
        });
      res.json({ wallets });
    } catch (err) {
      logger.error('Failed to get receive info', { error: String(err) });
      res.status(500).json({ error: 'Failed to fetch receive info' });
    }
  });

  /** GET /api/wallet/seed — Get the seed phrase (for demo/setup display only) */
  router.get('/wallet/seed', (_req, res) => {
    res.json({ seed: wallet.getSeedPhrase() });
  });

  /** GET /api/wallets — List multiple derived wallets for a chain */
  router.get('/wallets', async (req, res) => {
    try {
      const chain = (req.query.chain as string) || 'ethereum-sepolia';
      const count = Math.min(Math.max(parseInt(req.query.count as string, 10) || 5, 1), 20);
      const wallets = await wallet.listWallets(chain as ChainId, count);
      res.json({ wallets, activeIndex: wallet.getActiveWalletIndex() });
    } catch (err) {
      logger.error('Failed to list wallets', { error: String(err) });
      res.status(500).json({ error: 'Failed to list derived wallets' });
    }
  });

  /** GET /api/wallets/:index — Get wallet at a specific derivation index */
  router.get('/wallets/:index', async (req, res) => {
    try {
      const index = parseInt(req.params.index, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ error: 'Index must be a non-negative integer' });
        return;
      }
      const chain = (req.query.chain as string) || 'ethereum-sepolia';
      const derived = await wallet.getWalletByIndex(chain as ChainId, index);
      res.json({ wallet: derived });
    } catch (err) {
      logger.error('Failed to get wallet by index', { error: String(err) });
      res.status(500).json({ error: 'Failed to get wallet at index' });
    }
  });

  /** POST /api/wallets/active — Set the active wallet index for sending */
  router.post('/wallets/active', (req, res) => {
    try {
      const { index } = req.body as { index: number };
      if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
        res.status(400).json({ error: 'index must be a non-negative integer' });
        return;
      }
      wallet.setActiveWalletIndex(index);
      res.json({ activeIndex: index });
    } catch (err) {
      logger.error('Failed to set active wallet', { error: String(err) });
      res.status(500).json({ error: 'Failed to set active wallet index' });
    }
  });

  /** POST /api/tip — Execute a tip */
  router.post('/tip', transactionLimiter, validateTipInput(), async (req, res) => {
    try {
      const { recipient, amount, token, preferredChain, message } = req.body as {
        recipient: string;
        amount: string;
        token?: TokenType;
        preferredChain?: ChainId;
        message?: string;
      };

      if (!recipient || !amount) {
        res.status(400).json({ error: 'recipient and amount are required' });
        return;
      }

      const tipRequest: TipRequest = {
        id: uuidv4(),
        recipient,
        amount,
        token: token ?? 'native',
        preferredChain,
        message,
        createdAt: new Date().toISOString(),
      };

      logger.info('Processing tip request', { tipId: tipRequest.id, recipient, amount, token: tipRequest.token });

      const result = await agent.executeTip(tipRequest);
      if (result.status === 'confirmed') {
        contacts.incrementTipCount(recipient);
        if (result.decision?.feeSavings) {
          agent.markFeeOptimizerUsed();
        }
      }
      res.json({ result });
    } catch (err) {
      logger.error('Tip execution failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** POST /api/tip/batch — Execute batch tips to multiple recipients */
  router.post('/tip/batch', transactionLimiter, validateBatchTipInput(), async (req, res) => {
    try {
      const { recipients, token, preferredChain } = req.body as BatchTipRequest;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'recipients array is required and must not be empty' });
        return;
      }

      if (recipients.length > 10) {
        res.status(400).json({ error: 'Maximum 10 recipients per batch' });
        return;
      }

      for (const r of recipients) {
        if (!r.address || !r.amount) {
          res.status(400).json({ error: 'Each recipient must have an address and amount' });
          return;
        }
      }

      const batch: BatchTipRequest = {
        recipients,
        token: token ?? 'native',
        preferredChain,
      };

      logger.info('Processing batch tip', { count: recipients.length });

      const result = await agent.executeBatchTip(batch);
      res.json({ result });
    } catch (err) {
      logger.error('Batch tip failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** POST /api/tip/split — Execute a split tip among multiple recipients by percentage */
  router.post('/tip/split', transactionLimiter, async (req, res) => {
    try {
      const { recipients, totalAmount, token, chainId } = req.body as SplitTipRequest;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'recipients array is required and must not be empty' });
        return;
      }

      if (recipients.length > 5) {
        res.status(400).json({ error: 'Maximum 5 recipients per split tip' });
        return;
      }

      if (!totalAmount) {
        res.status(400).json({ error: 'totalAmount is required' });
        return;
      }

      for (const r of recipients) {
        if (!r.address) {
          res.status(400).json({ error: 'Each recipient must have an address' });
          return;
        }
        if (typeof r.percentage !== 'number' || r.percentage <= 0 || r.percentage > 100) {
          res.status(400).json({ error: 'Each recipient must have a percentage between 0 and 100' });
          return;
        }
      }

      const totalPct = recipients.reduce((sum, r) => sum + r.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        res.status(400).json({ error: `Percentages must sum to 100 (got ${totalPct})` });
        return;
      }

      const splitRequest: SplitTipRequest = {
        recipients,
        totalAmount,
        token: token ?? 'native',
        chainId,
      };

      logger.info('Processing split tip', { count: recipients.length, totalAmount });

      const result = await agent.executeSplitTip(splitRequest);
      res.json({ result });
    } catch (err) {
      logger.error('Split tip failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** POST /api/tip/import — Import tips from CSV text and execute them sequentially */
  router.post('/tip/import', transactionLimiter, async (req, res) => {
    try {
      const { csv } = req.body as { csv?: string };
      if (!csv || typeof csv !== 'string') {
        res.status(400).json({ error: 'csv string is required in request body' });
        return;
      }

      // Parse CSV lines (skip empty lines and header if present)
      const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        res.status(400).json({ error: 'CSV is empty' });
        return;
      }

      // Detect and skip header row
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('recipient') || firstLine.includes('address');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      if (dataLines.length === 0) {
        res.status(400).json({ error: 'CSV contains only a header row, no data' });
        return;
      }

      if (dataLines.length > 20) {
        res.status(400).json({ error: `Maximum 20 tips per import (got ${dataLines.length})` });
        return;
      }

      // Parse rows: recipient,amount,token,chain,memo
      const validTokens = ['native', 'usdt'];
      const validChains = ['ethereum-sepolia', 'ton-testnet', 'ethereum-sepolia-gasless', 'ton-testnet-gasless', ''];

      interface ParsedRow {
        row: number;
        recipient: string;
        amount: string;
        token: TokenType;
        chain: ChainId | undefined;
        memo: string;
        valid: boolean;
        error?: string;
      }

      const parsed: ParsedRow[] = dataLines.map((line, idx) => {
        // Handle quoted fields
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
        fields.push(current.trim());

        const [recipient = '', amount = '', token = 'native', chain = '', memo = ''] = fields;

        // Validate
        const errors: string[] = [];
        if (!recipient) errors.push('missing recipient');
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.push('invalid amount');
        if (!validTokens.includes(token.toLowerCase())) errors.push(`invalid token "${token}"`);
        if (chain && !validChains.includes(chain.toLowerCase())) errors.push(`invalid chain "${chain}"`);

        return {
          row: idx + 1,
          recipient,
          amount,
          token: (token.toLowerCase() || 'native') as TokenType,
          chain: (chain || undefined) as ChainId | undefined,
          memo,
          valid: errors.length === 0,
          error: errors.length > 0 ? errors.join(', ') : undefined,
        };
      });

      // Execute tips sequentially
      const results: Array<{
        row: number;
        recipient: string;
        amount: string;
        status: 'success' | 'failed';
        txHash?: string;
        error?: string;
        memo?: string;
      }> = [];

      let successCount = 0;
      let failCount = 0;

      for (const row of parsed) {
        if (!row.valid) {
          results.push({
            row: row.row,
            recipient: row.recipient,
            amount: row.amount,
            status: 'failed',
            error: `Validation: ${row.error}`,
            memo: row.memo || undefined,
          });
          failCount++;
          continue;
        }

        try {
          const tipRequest: TipRequest = {
            id: uuidv4(),
            recipient: row.recipient,
            amount: row.amount,
            token: row.token,
            preferredChain: row.chain,
            message: row.memo || undefined,
            createdAt: new Date().toISOString(),
          };

          const result = await agent.executeTip(tipRequest);
          if (result.status === 'confirmed') {
            contacts.incrementTipCount(row.recipient);
            successCount++;
            results.push({
              row: row.row,
              recipient: row.recipient,
              amount: row.amount,
              status: 'success',
              txHash: result.txHash,
              memo: row.memo || undefined,
            });
          } else {
            failCount++;
            results.push({
              row: row.row,
              recipient: row.recipient,
              amount: row.amount,
              status: 'failed',
              error: result.error || 'Transaction failed',
              memo: row.memo || undefined,
            });
          }
        } catch (err) {
          failCount++;
          results.push({
            row: row.row,
            recipient: row.recipient,
            amount: row.amount,
            status: 'failed',
            error: String(err),
            memo: row.memo || undefined,
          });
        }
      }

      logger.info('CSV import complete', { total: parsed.length, success: successCount, failed: failCount });

      res.json({
        total: parsed.length,
        success: successCount,
        failed: failCount,
        results,
      });
    } catch (err) {
      logger.error('CSV import failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** POST /api/tip/parse — Parse natural language tip command */
  router.post('/tip/parse', async (req, res) => {
    try {
      const { input } = req.body as { input?: string };
      if (!input || typeof input !== 'string') {
        res.status(400).json({ error: 'input string is required' });
        return;
      }

      const parsed = await ai.parseNaturalLanguageTip(input);
      agent.markNlpUsed();
      agent.addActivity({ type: 'nlp_parsed', message: `NLP parsed: "${input.slice(0, 50)}"`, detail: `${parsed.amount} to ${parsed.recipient.slice(0, 10)}... (${Math.round(parsed.confidence * 100)}% confidence)` });
      res.json({ parsed, source: ai.isAvailable() ? 'llm' : 'regex' });
    } catch (err) {
      logger.error('Tip parsing failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to parse tip input' });
    }
  });

  /** GET /api/tip/estimate — Estimate fees for a tip */
  router.get('/tip/estimate', async (req, res) => {
    try {
      const { recipient, amount } = req.query as { recipient: string; amount: string };
      if (!recipient || !amount) {
        res.status(400).json({ error: 'recipient and amount query params required' });
        return;
      }

      const chains = wallet.getRegisteredChains();
      const estimates = await Promise.all(
        chains.map(async (chainId) => {
          try {
            const fee = await wallet.estimateFee(chainId, recipient, amount);
            return { chainId, ...fee };
          } catch {
            return { chainId, fee: 'N/A', feeRaw: 0n };
          }
        }),
      );

      res.json({
        estimates: estimates.map((e) => ({
          chainId: e.chainId,
          fee: e.fee,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  /** GET /api/tip/:id/receipt — Generate a structured receipt for a completed tip */
  router.get('/tip/:id/receipt', (req, res) => {
    const { id } = req.params;
    const receipt = agent.getReceipt(id);
    if (!receipt) {
      res.status(404).json({ error: 'Tip not found or receipt unavailable' });
      return;
    }
    res.json({ receipt });
  });

  /** GET /api/agent/state — Get current agent state */
  router.get('/agent/state', (_req, res) => {
    res.json({ state: agent.getState() });
  });

  /** GET /api/agent/events — SSE stream for real-time agent updates */
  router.get('/agent/events', (_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: {"type":"connected"}\n\n');

    const unsubscribe = agent.onStateChange((state) => {
      res.write(`data: ${JSON.stringify({ type: 'state', state })}\n\n`);
    });

    _req.on('close', () => {
      unsubscribe();
    });
  });

  /** GET /api/activity — Get recent activity log */
  router.get('/activity', (_req, res) => {
    res.json({ activity: agent.getActivityLog() });
  });

  /** GET /api/activity/stream — SSE stream for real-time activity events */
  router.get('/activity/stream', (_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: {"type":"connected"}\n\n');

    const unsubscribe = agent.onActivity((event: ActivityEvent) => {
      res.write(`data: ${JSON.stringify({ type: 'activity', event })}\n\n`);
    });

    _req.on('close', () => {
      unsubscribe();
    });
  });

  /** GET /api/gas/speeds — Get gas speed options (slow/normal/fast) with estimated fees */
  router.get('/gas/speeds', async (_req, res) => {
    try {
      const chainIds = wallet.getRegisteredChains();
      const speeds: Array<{
        chainId: string;
        chainName: string;
        speeds: Array<{
          level: 'slow' | 'normal' | 'fast';
          label: string;
          gasPriceGwei: string;
          estimatedFee: string;
          estimatedTime: string;
        }>;
      }> = [];

      for (const chainId of chainIds) {
        const config = wallet.getChainConfig(chainId);

        if (config.blockchain === 'ethereum') {
          try {
            const rpcUrl = config.rpcUrl
              ?? process.env.ETH_SEPOLIA_RPC
              ?? 'https://ethereum-sepolia-rpc.publicnode.com';
            const provider = new JsonRpcProvider(rpcUrl);
            const feeData = await provider.getFeeData();
            const baseFee = feeData.gasPrice ?? 0n;
            const baseGwei = parseFloat(formatUnits(baseFee, 'gwei'));

            // 21000 gas units for a simple transfer
            const gasUnits = 21000n;

            const slowPrice = baseFee * 80n / 100n;
            const normalPrice = baseFee;
            const fastPrice = baseFee * 150n / 100n;

            const slowFee = slowPrice * gasUnits;
            const normalFee = normalPrice * gasUnits;
            const fastFee = fastPrice * gasUnits;

            speeds.push({
              chainId,
              chainName: config.name,
              speeds: [
                {
                  level: 'slow',
                  label: 'Slow (save fees)',
                  gasPriceGwei: (baseGwei * 0.8).toFixed(2),
                  estimatedFee: `${parseFloat(formatUnits(slowFee, 'ether')).toFixed(6)} ETH`,
                  estimatedTime: '~5-10 min',
                },
                {
                  level: 'normal',
                  label: 'Normal',
                  gasPriceGwei: baseGwei.toFixed(2),
                  estimatedFee: `${parseFloat(formatUnits(normalFee, 'ether')).toFixed(6)} ETH`,
                  estimatedTime: '~1-3 min',
                },
                {
                  level: 'fast',
                  label: 'Fast (priority)',
                  gasPriceGwei: (baseGwei * 1.5).toFixed(2),
                  estimatedFee: `${parseFloat(formatUnits(fastFee, 'ether')).toFixed(6)} ETH`,
                  estimatedTime: '~15-30 sec',
                },
              ],
            });
          } catch (err) {
            logger.warn('Failed to fetch gas speeds for EVM chain', { chainId, error: String(err) });
          }
        } else {
          // TON: fixed/low gas, speeds don't vary much
          speeds.push({
            chainId,
            chainName: config.name,
            speeds: [
              { level: 'slow', label: 'Slow', gasPriceGwei: '0.005', estimatedFee: '~0.005 TON', estimatedTime: '~30 sec' },
              { level: 'normal', label: 'Normal', gasPriceGwei: '0.01', estimatedFee: '~0.01 TON', estimatedTime: '~15 sec' },
              { level: 'fast', label: 'Fast', gasPriceGwei: '0.02', estimatedFee: '~0.02 TON', estimatedTime: '~5 sec' },
            ],
          });
        }
      }

      res.json({ speeds });
    } catch (err) {
      logger.error('Gas speed fetch failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to fetch gas speeds' });
    }
  });

  /** GET /api/agent/history — Get tip history with optional filtering */
  router.get('/agent/history', (req, res) => {
    let history = agent.getHistory();

    const search = (req.query.search as string)?.toLowerCase();
    const chain = req.query.chain as string;
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    if (search) {
      history = history.filter((h) =>
        h.recipient.toLowerCase().includes(search) ||
        h.txHash.toLowerCase().includes(search) ||
        (h.chainId.startsWith('ethereum') ? 'ethereum' : 'ton').includes(search),
      );
    }

    if (chain) {
      history = history.filter((h) => {
        if (chain === 'ethereum') return h.chainId.startsWith('ethereum');
        if (chain === 'ton') return h.chainId.startsWith('ton');
        return h.chainId === chain;
      });
    }

    if (status && (status === 'confirmed' || status === 'failed')) {
      history = history.filter((h) => h.status === status);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (!isNaN(from)) {
        history = history.filter((h) => new Date(h.createdAt).getTime() >= from);
      }
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      if (!isNaN(to)) {
        // Include the entire day for dateTo
        history = history.filter((h) => new Date(h.createdAt).getTime() <= to + 86400000);
      }
    }

    res.json({ history, total: agent.getHistory().length });
  });

  /** GET /api/agent/history/export — Export tip history in multiple formats */
  router.get('/agent/history/export', (_req, res) => {
    const format = (_req.query.format as string) ?? 'csv';
    const history = agent.getHistory();

    switch (format) {
      case 'csv': {
        const csv = exportService.exportCSV(history);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tipflow-history.csv"');
        res.send(csv);
        break;
      }
      case 'json': {
        const json = exportService.exportJSON(history);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="tipflow-history.json"');
        res.send(json);
        break;
      }
      case 'markdown': {
        const md = exportService.exportMarkdown(history);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="tipflow-history.md"');
        res.send(md);
        break;
      }
      case 'summary': {
        const summary = exportService.exportSummary(history);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="tipflow-summary.txt"');
        res.send(summary);
        break;
      }
      default:
        res.status(400).json({ error: 'Unsupported format. Use: csv, json, markdown, summary' });
    }
  });

  /** GET /api/agent/stats — Get agent statistics */
  router.get('/agent/stats', (_req, res) => {
    res.json({ stats: agent.getStats() });
  });

  /** GET /api/agent/analytics — Advanced analytics with aggregated data */
  router.get('/agent/analytics', (_req, res) => {
    try {
      const allTips = agent.getHistory();
      const confirmed = allTips.filter((h) => h.status === 'confirmed');

      // Daily volume — last 7 days
      const dailyMap = new Map<string, { count: number; volume: number }>();
      for (const h of confirmed) {
        const day = h.createdAt.split('T')[0];
        const existing = dailyMap.get(day) ?? { count: 0, volume: 0 };
        existing.count++;
        existing.volume += parseFloat(h.amount);
        dailyMap.set(day, existing);
      }
      const dailyVolume: Array<{ date: string; count: number; volume: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = dailyMap.get(dateStr);
        dailyVolume.push({
          date: dateStr,
          count: entry?.count ?? 0,
          volume: entry?.volume ?? 0,
        });
      }

      // Hourly distribution (0-23)
      const hourlyDistribution = new Array<number>(24).fill(0);
      for (const h of confirmed) {
        const hour = new Date(h.createdAt).getHours();
        hourlyDistribution[hour]++;
      }

      // Token distribution
      let nativeCount = 0;
      let usdtCount = 0;
      for (const h of confirmed) {
        if (h.token === 'usdt') usdtCount++;
        else nativeCount++;
      }

      // Chain distribution
      const chainDistribution: Record<string, number> = {};
      for (const h of confirmed) {
        chainDistribution[h.chainId] = (chainDistribution[h.chainId] ?? 0) + 1;
      }

      // Trends
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

      const tipsToday = confirmed.filter((h) => h.createdAt.startsWith(today)).length;
      const tipsYesterday = confirmed.filter((h) => h.createdAt.startsWith(yesterday)).length;
      const tipsThisWeek = confirmed.filter((h) => h.createdAt >= weekAgo).length;
      const tipsLastWeek = confirmed.filter((h) => h.createdAt >= twoWeeksAgo && h.createdAt < weekAgo).length;

      const amounts = confirmed.map((h) => parseFloat(h.amount));
      const avgTipSize = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      const largestTip = amounts.length > 0 ? Math.max(...amounts) : 0;

      const busiestHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
      const mostActiveChain = Object.entries(chainDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

      // Cumulative data
      const sortedConfirmed = [...confirmed].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const cumulativeMap = new Map<string, { totalTips: number; totalVolume: number }>();
      let runningTips = 0;
      let runningVolume = 0;
      for (const h of sortedConfirmed) {
        const day = h.createdAt.split('T')[0];
        runningTips++;
        runningVolume += parseFloat(h.amount);
        cumulativeMap.set(day, { totalTips: runningTips, totalVolume: runningVolume });
      }
      // Fill in gaps for last 7 days
      const cumulativeData: Array<{ date: string; totalTips: number; totalVolume: number }> = [];
      let prevTips = 0;
      let prevVol = 0;
      // Find first entry before the 7-day window
      for (const [, val] of cumulativeMap) {
        prevTips = val.totalTips;
        prevVol = val.totalVolume;
      }
      // Reset and build properly
      prevTips = 0;
      prevVol = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = cumulativeMap.get(dateStr);
        if (entry) {
          prevTips = entry.totalTips;
          prevVol = entry.totalVolume;
        }
        cumulativeData.push({
          date: dateStr,
          totalTips: prevTips,
          totalVolume: Math.round(prevVol * 1e6) / 1e6,
        });
      }

      // Success rate
      const successRate = allTips.length > 0
        ? Math.round((confirmed.length / allTips.length) * 100)
        : 100;

      // Total volume & fees
      const totalVolume = confirmed.reduce((s, h) => s + parseFloat(h.amount), 0);
      const totalFees = confirmed.reduce((s, h) => s + parseFloat(h.fee || '0'), 0);
      const avgFee = confirmed.length > 0 ? totalFees / confirmed.length : 0;

      // Unique recipients
      const uniqueRecipients = new Set(confirmed.map((h) => h.recipient)).size;

      // Overview
      const overview = {
        totalTips: confirmed.length,
        totalVolume: Math.round(totalVolume * 1e6) / 1e6,
        successRate,
        avgFee: Math.round(avgFee * 1e8) / 1e8,
        totalFees: Math.round(totalFees * 1e8) / 1e8,
        uniqueRecipients,
      };

      // Chain distribution with percentages
      const chainDist = Object.entries(chainDistribution).map(([chain, count]) => ({
        chain,
        count,
        percentage: confirmed.length > 0 ? Math.round((count / confirmed.length) * 100) : 0,
      }));

      // Token distribution with percentages
      const tokenDist = [
        { token: 'native', count: nativeCount, percentage: confirmed.length > 0 ? Math.round((nativeCount / confirmed.length) * 100) : 0 },
        { token: 'usdt', count: usdtCount, percentage: confirmed.length > 0 ? Math.round((usdtCount / confirmed.length) * 100) : 0 },
      ];

      // Hourly heatmap
      const hourlyHeatmap = hourlyDistribution.map((count, hour) => ({ hour, count }));

      // Top recipients by volume
      const recipientMap = new Map<string, { count: number; volume: number }>();
      for (const h of confirmed) {
        const existing = recipientMap.get(h.recipient) ?? { count: 0, volume: 0 };
        existing.count++;
        existing.volume += parseFloat(h.amount);
        recipientMap.set(h.recipient, existing);
      }
      const topRecipients = [...recipientMap.entries()]
        .map(([address, data]) => ({ address, count: data.count, volume: Math.round(data.volume * 1e6) / 1e6 }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      // Recent trend
      let recentTrend: 'up' | 'down' | 'stable' = 'stable';
      if (tipsThisWeek > tipsLastWeek) recentTrend = 'up';
      else if (tipsThisWeek < tipsLastWeek) recentTrend = 'down';

      // Streaks (consecutive days with at least 1 tip)
      const tipDays = new Set(confirmed.map((h) => h.createdAt.split('T')[0]));
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      for (let i = 0; i < 90; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (tipDays.has(dateStr)) {
          streak++;
          if (i <= currentStreak + 1) currentStreak = streak;
          longestStreak = Math.max(longestStreak, streak);
        } else {
          if (i === 0) {
            // Today has no tips yet, don't break streak for "current"
          } else {
            streak = 0;
          }
        }
      }

      res.json({
        overview,
        dailyVolume,
        hourlyDistribution,
        hourlyHeatmap,
        tokenDistribution: { native: nativeCount, usdt: usdtCount },
        chainDistribution,
        chainDist,
        tokenDist,
        topRecipients,
        recentTrend,
        streaks: { current: currentStreak, longest: longestStreak },
        trends: {
          tipsToday,
          tipsYesterday,
          tipsThisWeek,
          tipsLastWeek,
          avgTipSize: Math.round(avgTipSize * 1e6) / 1e6,
          largestTip: Math.round(largestTip * 1e6) / 1e6,
          busiestHour,
          mostActiveChain,
        },
        cumulativeData,
        successRate,
        totalTips: confirmed.length,
      });
    } catch (err) {
      logger.error('Analytics endpoint failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to compute analytics' });
    }
  });

  /** GET /api/tx/:hash/status — Check on-chain confirmation status of a transaction */
  router.get('/tx/:hash/status', async (req, res) => {
    try {
      const { hash } = req.params;
      const chainId = (req.query.chain as ChainId) ?? 'ethereum-sepolia';

      if (!hash || hash.length === 0) {
        res.status(400).json({ error: 'Transaction hash is required' });
        return;
      }

      const registeredChains = wallet.getRegisteredChains();
      if (!registeredChains.includes(chainId)) {
        res.status(400).json({ error: `Unsupported chain: ${chainId}` });
        return;
      }

      const confirmation = await wallet.waitForConfirmation(chainId, hash, 10000);
      res.json({
        txHash: hash,
        chainId,
        confirmed: confirmation.confirmed,
        blockNumber: confirmation.blockNumber || undefined,
        gasUsed: confirmation.gasUsed !== '0' ? confirmation.gasUsed : undefined,
        explorerUrl: wallet.getExplorerUrl(chainId, hash),
      });
    } catch (err) {
      logger.error('Transaction status check failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to check transaction status' });
    }
  });

  /** POST /api/tip/schedule — Schedule a future tip (optionally recurring) */
  router.post('/tip/schedule', transactionLimiter, validateTipInput(), (req, res) => {
    try {
      const { recipient, amount, token, chain, message, scheduledAt, recurring, interval } = req.body as {
        recipient: string;
        amount: string;
        token?: TokenType;
        chain?: ChainId;
        message?: string;
        scheduledAt: string;
        recurring?: boolean;
        interval?: 'daily' | 'weekly' | 'monthly';
      };

      if (!recipient || !amount || !scheduledAt) {
        res.status(400).json({ error: 'recipient, amount, and scheduledAt are required' });
        return;
      }

      if (recurring && !interval) {
        res.status(400).json({ error: 'interval is required when recurring is true' });
        return;
      }

      const scheduledTime = new Date(scheduledAt);
      if (isNaN(scheduledTime.getTime())) {
        res.status(400).json({ error: 'scheduledAt must be a valid ISO date string' });
        return;
      }

      if (scheduledTime.getTime() <= Date.now()) {
        res.status(400).json({ error: 'scheduledAt must be in the future' });
        return;
      }

      const tip = agent.scheduleTip(
        { recipient, amount, token, chain, message, recurring, interval },
        scheduledAt,
      );

      agent.markScheduleUsed();
      logger.info('Tip scheduled via API', { id: tip.id, scheduledAt, recurring, interval });
      res.json({ tip });
    } catch (err) {
      logger.error('Failed to schedule tip', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** GET /api/tip/scheduled — List all scheduled tips */
  router.get('/tip/scheduled', (_req, res) => {
    const tips = agent.getScheduledTips();
    res.json({ tips });
  });

  /** DELETE /api/tip/schedule/:id — Cancel a scheduled tip */
  router.delete('/tip/schedule/:id', (req, res) => {
    const { id } = req.params;
    const cancelled = agent.cancelScheduledTip(id);
    if (!cancelled) {
      res.status(404).json({ error: 'Scheduled tip not found or already executed' });
      return;
    }
    res.json({ cancelled: true, id });
  });

  // ── Gasless / ERC-4337 Account Abstraction ─────────────────────

  /** GET /api/gasless/status — Check gasless availability and configuration */
  router.get('/gasless/status', (_req, res) => {
    const status = wallet.getGaslessStatus();
    res.json({
      gaslessAvailable: wallet.isGaslessAvailable(),
      ...status,
    });
  });

  /** POST /api/tip/gasless — Send a gasless tip (zero gas fees for user) */
  router.post('/tip/gasless', transactionLimiter, validateTipInput(), async (req, res) => {
    try {
      const { recipient, amount, token, message } = req.body as {
        recipient: string;
        amount: string;
        token?: TokenType;
        message?: string;
      };

      if (!recipient || !amount) {
        res.status(400).json({ error: 'recipient and amount are required' });
        return;
      }

      logger.info('Processing gasless tip request', { recipient, amount, token: token ?? 'native' });

      const result = await wallet.sendGaslessTransaction(
        recipient,
        amount,
        token ?? 'native',
      );

      const explorerUrl = wallet.getExplorerUrl(result.chainId, result.hash);

      agent.addActivity({
        type: 'tip_sent',
        message: `Gasless tip sent: ${amount} ${token === 'usdt' ? 'USDT' : 'native'} to ${recipient.slice(0, 8)}...`,
        detail: result.gasless ? 'Zero gas fees (ERC-4337)' : 'Fallback to regular transaction',
        chainId: result.chainId,
      });

      res.json({
        result: {
          hash: result.hash,
          fee: result.fee,
          gasless: result.gasless,
          chainId: result.chainId,
          explorerUrl,
          recipient,
          amount,
          token: token ?? 'native',
          message,
        },
      });
    } catch (err) {
      logger.error('Gasless tip failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  // ── Address Book Contacts ──────────────────────────────────────

  /** GET /api/contacts/groups — List all unique group names */
  router.get('/contacts/groups', (_req, res) => {
    res.json({ groups: contacts.getGroups() });
  });

  /** GET /api/contacts/export/csv — Export all contacts as CSV */
  router.get('/contacts/export/csv', (_req, res) => {
    const data = contacts.exportContacts();
    const header = 'name,address,group,tipCount';
    const rows = data.map((c) => {
      const escapeCsv = (v: string) =>
        v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
      return `${escapeCsv(c.name)},${escapeCsv(c.address)},${escapeCsv(c.group ?? '')},${c.tipCount}`;
    });
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tipflow-contacts.csv"');
    res.send(csv);
  });

  /** GET /api/contacts/export — Export all contacts as JSON */
  router.get('/contacts/export', (_req, res) => {
    const data = contacts.exportContacts();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="tipflow-contacts.json"');
    res.json(data);
  });

  /** POST /api/contacts/import — Import contacts from JSON array */
  router.post('/contacts/import', (req, res) => {
    try {
      const body = req.body;
      if (!Array.isArray(body)) {
        res.status(400).json({ error: 'Request body must be a JSON array of contacts' });
        return;
      }
      const result = contacts.importContacts(body);
      res.json(result);
    } catch (err) {
      logger.error('Failed to import contacts', { error: String(err) });
      res.status(500).json({ error: 'Failed to import contacts' });
    }
  });

  /** GET /api/contacts — List all contacts, optionally filtered by group */
  router.get('/contacts', (req, res) => {
    const group = req.query.group as string | undefined;
    if (group) {
      res.json({ contacts: contacts.getContactsByGroup(group) });
    } else {
      res.json({ contacts: contacts.getContacts() });
    }
  });

  /** POST /api/contacts — Add a contact */
  router.post('/contacts', (req, res) => {
    try {
      const { name, address, chain, group } = req.body as {
        name: string;
        address: string;
        chain?: ChainId;
        group?: string;
      };

      if (!name || !address) {
        res.status(400).json({ error: 'name and address are required' });
        return;
      }

      const contact = contacts.addContact(name, address, chain, group);
      agent.addActivity({ type: 'contact_saved', message: `Contact saved: ${name}`, detail: address.slice(0, 10) + '...' });
      res.json({ contact });
    } catch (err) {
      logger.error('Failed to add contact', { error: String(err) });
      res.status(500).json({ error: 'Failed to add contact' });
    }
  });

  /** PUT /api/contacts/:id — Update a contact */
  router.put('/contacts/:id', (req, res) => {
    const { id } = req.params;
    const { name, group } = req.body as { name?: string; group?: string };
    const updated = contacts.updateContact(id, { name, group });
    if (!updated) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ contact: updated });
  });

  /** DELETE /api/contacts/:id — Delete a contact */
  router.delete('/contacts/:id', (req, res) => {
    const { id } = req.params;
    const deleted = contacts.deleteContact(id);
    if (!deleted) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ deleted: true, id });
  });

  /** GET /api/fees/compare — Compare fees across all chains for a given transfer */
  router.get('/fees/compare', async (req, res) => {
    try {
      const { recipient, amount } = req.query as { recipient?: string; amount?: string };
      if (!recipient || !amount) {
        res.status(400).json({ error: 'recipient and amount query params are required' });
        return;
      }

      const comparison = await wallet.estimateAllFees(recipient, amount);
      const cheapest = comparison[0];
      const mostExpensive = comparison[comparison.length - 1];

      res.json({
        comparison,
        recommendation: cheapest
          ? {
              cheapestChain: cheapest.chainId,
              cheapestChainName: cheapest.chainName,
              cheapestFeeUsd: cheapest.estimatedFeeUsd,
              potentialSavings: cheapest.savingsVsHighest,
            }
          : null,
        summary:
          cheapest && mostExpensive && comparison.length > 1
            ? `Use ${cheapest.chainName} to save ${cheapest.savingsVsHighest} vs ${mostExpensive.chainName}`
            : 'Only one chain available',
      });
    } catch (err) {
      logger.error('Fee comparison failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to compare fees across chains' });
    }
  });

  /** GET /api/chains — Get supported chains info */
  router.get('/chains', (_req, res) => {
    const chains = wallet.getRegisteredChains().map((id) => wallet.getChainConfig(id));
    res.json({ chains });
  });

  /** GET /api/gas — Real-time gas prices across all chains */
  router.get('/gas', async (_req, res) => {
    try {
      const chainIds = wallet.getRegisteredChains();
      const chains = await Promise.all(
        chainIds.map(async (chainId) => {
          const config = wallet.getChainConfig(chainId);

          // EVM chains: fetch live gas price from the RPC provider
          if (config.blockchain === 'ethereum') {
            try {
              const rpcUrl = config.rpcUrl
                ?? process.env.ETH_SEPOLIA_RPC
                ?? 'https://ethereum-sepolia-rpc.publicnode.com';
              const provider = new JsonRpcProvider(rpcUrl);
              const feeData = await provider.getFeeData();
              const gasPriceWei = feeData.gasPrice ?? 0n;
              const gasPriceGwei = parseFloat(formatUnits(gasPriceWei, 'gwei'));

              let status: 'low' | 'medium' | 'high' = 'medium';
              if (gasPriceGwei < 10) status = 'low';
              else if (gasPriceGwei >= 30) status = 'high';

              return {
                chainId,
                chainName: config.name,
                gasPrice: gasPriceWei.toString(),
                gasPriceGwei: gasPriceGwei.toFixed(2),
                status,
                lastUpdated: new Date().toISOString(),
              };
            } catch (err) {
              logger.warn('Failed to fetch EVM gas price', { chainId, error: String(err) });
              return {
                chainId,
                chainName: config.name,
                gasPrice: '0',
                gasPriceGwei: '0.00',
                status: 'medium' as const,
                lastUpdated: new Date().toISOString(),
              };
            }
          }

          // TON: static estimate (TON has fixed/low gas costs)
          return {
            chainId,
            chainName: config.name,
            gasPrice: '10000000', // ~0.01 TON in nanoton
            gasPriceGwei: '0.01',
            status: 'low' as const,
            lastUpdated: new Date().toISOString(),
          };
        }),
      );

      res.json({ chains });
    } catch (err) {
      logger.error('Gas price fetch failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to fetch gas prices' });
    }
  });

  /** GET /api/prices — Crypto prices via CoinGecko free API with static fallback */
  const priceCache = { prices: { ETH: 2500, TON: 2.50, USDT: 1.00 }, fetchedAt: '', isLive: false };
  router.get('/prices', async (_req, res) => {
    // Try CoinGecko free API (no API key needed, rate-limited)
    const cacheAge = priceCache.fetchedAt ? Date.now() - new Date(priceCache.fetchedAt).getTime() : Infinity;
    if (cacheAge > 60_000) { // Refresh every 60s max
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,the-open-network,tether&vs_currencies=usd',
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json() as Record<string, { usd: number }>;
          priceCache.prices = {
            ETH: data.ethereum?.usd ?? 2500,
            TON: data['the-open-network']?.usd ?? 2.50,
            USDT: data.tether?.usd ?? 1.00,
          };
          priceCache.fetchedAt = new Date().toISOString();
          priceCache.isLive = true;
        }
      } catch {
        // CoinGecko unavailable — use cached/static prices
        if (!priceCache.fetchedAt) priceCache.fetchedAt = new Date().toISOString();
        priceCache.isLive = false;
      }
    }
    res.json({
      prices: priceCache.prices,
      lastUpdated: priceCache.fetchedAt || new Date().toISOString(),
      isLive: priceCache.isLive,
      source: priceCache.isLive ? 'CoinGecko API' : 'Static fallback (CoinGecko unavailable)',
    });
  });

  // ── Tip Templates ──────────────────────────────────────────────

  /** GET /api/templates — List all templates */
  router.get('/templates', (_req, res) => {
    res.json({ templates: templates.getTemplates() });
  });

  /** POST /api/templates — Create a template */
  router.post('/templates', (req, res) => {
    try {
      const { name, recipient, amount, token, chainId } = req.body as {
        name: string;
        recipient: string;
        amount: string;
        token?: 'native' | 'usdt';
        chainId?: string;
      };

      if (!name || !recipient || !amount) {
        res.status(400).json({ error: 'name, recipient, and amount are required' });
        return;
      }

      const template = templates.addTemplate({
        name,
        recipient,
        amount,
        token: token ?? 'native',
        chainId,
      });
      res.json({ template });
    } catch (err) {
      logger.error('Failed to create template', { error: String(err) });
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  /** DELETE /api/templates/:id — Delete a template */
  router.delete('/templates/:id', (req, res) => {
    const { id } = req.params;
    const deleted = templates.deleteTemplate(id);
    if (!deleted) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ deleted: true, id });
  });

  // ── Leaderboard & Achievements ──────────────────────────────────

  /** GET /api/leaderboard — Top tip recipients */
  router.get('/leaderboard', (_req, res) => {
    res.json({ leaderboard: agent.getLeaderboard() });
  });

  /** GET /api/achievements — Achievement progress */
  router.get('/achievements', (_req, res) => {
    res.json({ achievements: agent.getAchievements() });
  });

  // ── Conversational Chat ──────────────────────────────────────

  /** POST /api/chat — Conversational chat with the TipFlow agent */
  router.post('/chat', transactionLimiter, validateChatInput(), async (req, res) => {
    try {
      const { message } = req.body as { message?: string };
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ error: 'message string is required' });
        return;
      }

      const trimmed = message.trim();
      const { intent, params } = await ai.detectIntent(trimmed);

      let content = '';
      let action: ChatMessage['action'] | undefined;

      switch (intent) {
        case 'tip': {
          // If we have enough info, parse and execute; otherwise guide the user
          if (params.recipient && params.amount) {
            const token = (params.token as TokenType) ?? 'native';
            const tipRequest: TipRequest = {
              id: uuidv4(),
              recipient: params.recipient,
              amount: params.amount,
              token,
              createdAt: new Date().toISOString(),
            };
            try {
              const result = await agent.executeTip(tipRequest);
              if (result.status === 'confirmed') {
                const currency = result.token === 'usdt' ? 'USDT' : result.chainId.startsWith('ethereum') ? 'ETH' : 'TON';
                const chain = result.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
                content = personality.formatMessage('tip_confirmed', {
                  amount: result.amount,
                  currency,
                  recipient: `${result.to.slice(0, 8)}...${result.to.slice(-6)}`,
                  chain,
                  txHash: `${result.txHash.slice(0, 12)}...`,
                });
                action = {
                  type: 'tip_executed',
                  data: {
                    txHash: result.txHash,
                    amount: result.amount,
                    token: result.token,
                    chainId: result.chainId,
                    to: result.to,
                    fee: result.fee,
                    explorerUrl: result.explorerUrl,
                  },
                };
              } else {
                content = personality.formatMessage('tip_failed', {
                  error: result.error ?? 'Unknown error',
                });
              }
            } catch (err) {
              content = personality.formatMessage('tip_failed', {
                error: String(err),
              });
            }
          } else {
            // Parse what we can and ask for missing info
            const parsed = await ai.parseNaturalLanguageTip(trimmed);
            if (parsed.recipient && parsed.amount) {
              // We extracted enough from NLP, execute
              const token = parsed.token ?? 'native';
              const tipRequest: TipRequest = {
                id: uuidv4(),
                recipient: parsed.recipient,
                amount: parsed.amount,
                token,
                preferredChain: parsed.chain as ChainId | undefined,
                message: parsed.message,
                createdAt: new Date().toISOString(),
              };
              try {
                const result = await agent.executeTip(tipRequest);
                if (result.status === 'confirmed') {
                  const currency = result.token === 'usdt' ? 'USDT' : result.chainId.startsWith('ethereum') ? 'ETH' : 'TON';
                  const chain = result.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
                  content = personality.formatMessage('tip_confirmed', {
                    amount: result.amount,
                    currency,
                    recipient: `${result.to.slice(0, 8)}...${result.to.slice(-6)}`,
                    chain,
                    txHash: `${result.txHash.slice(0, 12)}...`,
                  });
                  action = {
                    type: 'tip_executed',
                    data: {
                      txHash: result.txHash,
                      amount: result.amount,
                      token: result.token,
                      chainId: result.chainId,
                      to: result.to,
                      fee: result.fee,
                      explorerUrl: result.explorerUrl,
                    },
                  };
                } else {
                  content = personality.formatMessage('tip_failed', { error: result.error ?? 'Unknown error' });
                }
              } catch (err) {
                content = personality.formatMessage('tip_failed', { error: String(err) });
              }
            } else {
              const missing: string[] = [];
              if (!parsed.recipient) missing.push('a recipient address (0x... or UQ...)');
              if (!parsed.amount) missing.push('an amount');
              content = `I'd like to help you send a tip! I still need ${missing.join(' and ')}. Try something like: "send 0.01 ETH to 0x1234..."`;
            }
          }
          break;
        }

        case 'balance': {
          try {
            const balances = await wallet.getAllBalances();
            const lines = balances.map((b) => {
              const chain = b.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
              return `${chain}: ${b.nativeBalance} ${b.nativeCurrency}${parseFloat(b.usdtBalance) > 0 ? ` + ${b.usdtBalance} USDT` : ''}`;
            });
            content = personality.formatMessage('balance_report', { balances: lines.join('\n') });
            action = {
              type: 'balance_check',
              data: { balances: balances.map((b) => ({ chainId: b.chainId, native: b.nativeBalance, usdt: b.usdtBalance, currency: b.nativeCurrency })) },
            };
          } catch (err) {
            content = `I couldn't fetch your balances: ${String(err)}`;
          }
          break;
        }

        case 'fees': {
          try {
            // Use a dummy address for fee comparison
            const dummyRecipient = '0x0000000000000000000000000000000000000001';
            const comparison = await wallet.estimateAllFees(dummyRecipient, '0.01');
            if (comparison.length === 0) {
              content = 'No fee data available right now. Try again in a moment.';
            } else {
              const lines = comparison.map((c) =>
                `${c.chainName}: ~$${c.estimatedFeeUsd} (${c.estimatedFee})`
              );
              const cheapest = comparison[0];
              content = personality.formatMessage('fee_comparison', {
                amount: '0.01',
                fees: lines.join('\n'),
                cheapest: cheapest.chainName,
                cheapestFee: cheapest.estimatedFeeUsd,
              });
              action = {
                type: 'fee_estimate',
                data: { comparison },
              };
            }
          } catch (err) {
            content = `Couldn't fetch fee estimates: ${String(err)}`;
          }
          break;
        }

        case 'address': {
          try {
            const addresses = await wallet.getAllAddresses();
            const lines = Object.entries(addresses).map(([chainId, addr]) => {
              const chain = chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
              return `${chain}: ${addr}`;
            });
            content = `Your wallet addresses:\n\n${lines.join('\n')}\n\nYou can share these to receive funds.`;
            action = {
              type: 'address_lookup',
              data: { addresses },
            };
          } catch (err) {
            content = `Couldn't fetch addresses: ${String(err)}`;
          }
          break;
        }

        case 'history': {
          const history = agent.getHistory();
          if (history.length === 0) {
            content = 'No tips sent yet. Try sending your first tip!';
          } else {
            const recent = history.slice(0, 5);
            const lines = recent.map((h) => {
              const chain = h.chainId.startsWith('ethereum') ? 'ETH' : 'TON';
              const status = h.status === 'confirmed' ? 'Confirmed' : 'Failed';
              return `${h.amount} ${h.token === 'usdt' ? 'USDT' : chain} to ${h.recipient.slice(0, 8)}... - ${status}`;
            });
            content = `Your recent tips (${history.length} total):\n\n${lines.join('\n')}${history.length > 5 ? `\n\n...and ${history.length - 5} more` : ''}`;
          }
          break;
        }

        case 'help': {
          content = personality.formatMessage('help');
          break;
        }

        default: {
          content = personality.formatMessage('unknown_intent');
          break;
        }
      }

      const response: ChatMessage = {
        id: uuidv4(),
        role: 'agent',
        content,
        timestamp: new Date().toISOString(),
        action,
      };

      res.json({ message: response });
    } catch (err) {
      logger.error('Chat processing failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // ── Conditional Tips ──────────────────────────────────────────

  /** GET /api/conditions — List all conditions */
  router.get('/conditions', (_req, res) => {
    res.json({ conditions: agent.getConditions() });
  });

  /** POST /api/conditions — Create a new condition */
  router.post('/conditions', (req, res) => {
    try {
      const { type, params, tip } = req.body as {
        type?: ConditionType;
        params?: { threshold?: string; currency?: string; timeStart?: string; timeEnd?: string };
        tip?: { recipient: string; amount: string; token?: 'native' | 'usdt'; chainId?: string };
      };

      if (!type || !tip?.recipient || !tip?.amount) {
        res.status(400).json({ error: 'type, tip.recipient, and tip.amount are required' });
        return;
      }

      const validTypes: ConditionType[] = ['gas_below', 'balance_above', 'time_of_day'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `Invalid condition type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const condition = agent.addCondition({
        type,
        params: params ?? {},
        tip: {
          recipient: tip.recipient,
          amount: tip.amount,
          token: tip.token ?? 'native',
          chainId: tip.chainId,
        },
      });

      logger.info('Condition created via API', { id: condition.id, type });
      res.json({ condition });
    } catch (err) {
      logger.error('Failed to create condition', { error: String(err) });
      res.status(500).json({ error: 'Failed to create condition' });
    }
  });

  /** DELETE /api/conditions/:id — Cancel a condition */
  router.delete('/conditions/:id', (req, res) => {
    const { id } = req.params;
    const cancelled = agent.cancelCondition(id);
    if (!cancelled) {
      res.status(404).json({ error: 'Condition not found or not active' });
      return;
    }
    res.json({ cancelled: true, id });
  });

  // ── Webhooks ──────────────────────────────────────────────────

  /** GET /api/webhooks — List registered webhooks */
  router.get('/webhooks', (_req, res) => {
    res.json({ webhooks: webhooks.getWebhooks() });
  });

  /** POST /api/webhooks — Register a new webhook */
  router.post('/webhooks', (req, res) => {
    try {
      const { url, events } = req.body as { url?: string; events?: string[] };

      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'url is required and must be a string' });
        return;
      }

      if (!events || !Array.isArray(events) || events.length === 0) {
        res.status(400).json({ error: 'events array is required and must not be empty' });
        return;
      }

      const validEvents = ['tip.sent', 'tip.failed', 'tip.scheduled', 'condition.triggered'];
      const invalid = events.filter((e) => !validEvents.includes(e));
      if (invalid.length > 0) {
        res.status(400).json({ error: `Invalid events: ${invalid.join(', ')}. Valid: ${validEvents.join(', ')}` });
        return;
      }

      const webhook = webhooks.registerWebhook(url, events);
      res.json({ webhook });
    } catch (err) {
      logger.error('Failed to register webhook', { error: String(err) });
      res.status(500).json({ error: 'Failed to register webhook' });
    }
  });

  /** DELETE /api/webhooks/:id — Unregister a webhook */
  router.delete('/webhooks/:id', (req, res) => {
    const { id } = req.params;
    const removed = webhooks.unregisterWebhook(id);
    if (!removed) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }
    res.json({ deleted: true, id });
  });

  /** POST /api/webhooks/test — Send a test event to all webhooks */
  router.post('/webhooks/test', async (_req, res) => {
    try {
      await webhooks.fireWebhook('test', {
        message: 'This is a test webhook event from TipFlow',
        timestamp: new Date().toISOString(),
      });
      res.json({ sent: true, webhookCount: webhooks.getWebhooks().length });
    } catch (err) {
      logger.error('Webhook test failed', { error: String(err) });
      res.status(500).json({ error: 'Failed to send test webhook' });
    }
  });

  // ── System Info ──────────────────────────────────────────────

  /** GET /api/system/info — System and runtime information */
  router.get('/system/info', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      wdkVersion: '1.0.0-beta.6',
      apiEndpoints: 61,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      memoryUsage: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ── Telegram Bot ─────────────────────────────────────────────

  /** GET /api/telegram/status — Telegram bot status */
  router.get('/telegram/status', (_req, res) => {
    try {
      const status = agent.getTelegramStatus();
      res.json(status);
    } catch (err) {
      logger.error('Failed to get Telegram status', { error: String(err) });
      res.status(500).json({ error: 'Failed to get Telegram status' });
    }
  });

  // ── Settings & Personality ──────────────────────────────────

  /** GET /api/settings — Get current agent settings */
  router.get('/settings', (_req, res) => {
    res.json({ settings: agentSettings });
  });

  /** PUT /api/settings — Update agent settings */
  router.put('/settings', (req, res) => {
    try {
      const body = req.body as Partial<AgentSettings>;

      if (body.personality !== undefined) {
        const validPersonalities: PersonalityType[] = ['professional', 'friendly', 'pirate', 'emoji', 'minimal'];
        if (!validPersonalities.includes(body.personality)) {
          res.status(400).json({ error: `Invalid personality. Must be one of: ${validPersonalities.join(', ')}` });
          return;
        }
        agentSettings.personality = body.personality;
        personality.setPersonality(body.personality);
      }

      if (body.defaultChain !== undefined) {
        agentSettings.defaultChain = body.defaultChain;
      }

      if (body.defaultToken !== undefined) {
        if (body.defaultToken !== 'native' && body.defaultToken !== 'usdt') {
          res.status(400).json({ error: 'defaultToken must be "native" or "usdt"' });
          return;
        }
        agentSettings.defaultToken = body.defaultToken;
      }

      if (body.autoConfirmThreshold !== undefined) {
        agentSettings.autoConfirmThreshold = body.autoConfirmThreshold;
      }

      if (body.autoConfirmEnabled !== undefined) {
        agentSettings.autoConfirmEnabled = body.autoConfirmEnabled;
      }

      if (body.notifications !== undefined) {
        agentSettings.notifications = {
          ...agentSettings.notifications,
          ...body.notifications,
        };
      }

      logger.info('Agent settings updated', { settings: agentSettings });
      res.json({ settings: agentSettings });
    } catch (err) {
      logger.error('Failed to update settings', { error: String(err) });
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  /** GET /api/personality — Get available personalities and active one */
  router.get('/personality', (_req, res) => {
    res.json({
      active: personality.getActivePersonality(),
      personalities: personality.getPersonalities(),
    });
  });

  /** PUT /api/personality — Set the active personality */
  router.put('/personality', (req, res) => {
    try {
      const { type } = req.body as { type?: PersonalityType };
      if (!type) {
        res.status(400).json({ error: 'type is required' });
        return;
      }

      const success = personality.setPersonality(type);
      if (!success) {
        res.status(400).json({ error: `Invalid personality type: ${type}` });
        return;
      }

      agentSettings.personality = type;
      res.json({
        active: personality.getActivePersonality(),
        definition: personality.getActiveDefinition(),
      });
    } catch (err) {
      logger.error('Failed to set personality', { error: String(err) });
      res.status(500).json({ error: 'Failed to set personality' });
    }
  });


  // -- Tip Links ----------------------------------------------------------

  /** POST /api/tiplinks - Create a shareable tip link */
  router.post('/tiplinks', (req, res) => {
    try {
      const { recipient, amount, token, message, chainId } = req.body as {
        recipient?: string;
        amount?: string;
        token?: string;
        message?: string;
        chainId?: string;
      };

      if (!recipient || !amount) {
        res.status(400).json({ error: 'recipient and amount are required' });
        return;
      }

      const id = uuidv4().slice(0, 8);
      const tipLink: TipLink = {
        id,
        recipient,
        amount,
        token: (token as TokenType) || 'native',
        message: message || undefined,
        chainId: (chainId as ChainId) || undefined,
        url: `?tiplink=${id}`,
        createdAt: new Date().toISOString(),
      };

      tipLinks.push(tipLink);
      logger.info('Tip link created', { id, recipient, amount });
      res.json({ tipLink });
    } catch (err) {
      logger.error('Failed to create tip link', { error: String(err) });
      res.status(500).json({ error: 'Failed to create tip link' });
    }
  });

  /** GET /api/tiplinks - List all tip links */
  router.get('/tiplinks', (_req, res) => {
    res.json({ tipLinks: [...tipLinks].reverse() });
  });

  /** GET /api/tiplinks/:id - Get a single tip link */
  router.get('/tiplinks/:id', (req, res) => {
    const link = tipLinks.find((l) => l.id === req.params.id);
    if (!link) {
      res.status(404).json({ error: 'Tip link not found' });
      return;
    }
    res.json({ tipLink: link });
  });

  /** DELETE /api/tiplinks/:id - Delete a tip link */
  router.delete('/tiplinks/:id', (req, res) => {
    const idx = tipLinks.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Tip link not found' });
      return;
    }
    tipLinks.splice(idx, 1);
    logger.info('Tip link deleted', { id: req.params.id });
    res.json({ deleted: true, id: req.params.id });
  });

  // ── ENS Resolution ──────────────────────────────────────────────────

  /** GET /api/ens/resolve?name=vitalik.eth — Resolve ENS name to address */
  router.get('/ens/resolve', async (req, res) => {
    try {
      const name = req.query.name as string | undefined;
      if (!name || !name.endsWith('.eth')) {
        res.status(400).json({ error: 'Query parameter "name" is required and must end with .eth' });
        return;
      }
      const address = await ensService.resolveENS(name);
      if (address) {
        res.json({ name, address, resolved: true });
      } else {
        res.json({ name, address: null, resolved: false });
      }
    } catch (err) {
      logger.error('ENS resolve error', { error: String(err) });
      res.status(500).json({ error: 'ENS resolution failed' });
    }
  });

  /** GET /api/ens/reverse?address=0x... — Reverse lookup address to ENS name */
  router.get('/ens/reverse', async (req, res) => {
    try {
      const address = req.query.address as string | undefined;
      if (!address || !address.startsWith('0x')) {
        res.status(400).json({ error: 'Query parameter "address" is required and must start with 0x' });
        return;
      }
      const name = await ensService.lookupAddress(address);
      if (name) {
        res.json({ address, name, resolved: true });
      } else {
        res.json({ address, name: null, resolved: false });
      }
    } catch (err) {
      logger.error('ENS reverse lookup error', { error: String(err) });
      res.status(500).json({ error: 'ENS reverse lookup failed' });
    }
  });

  // ── Address Tags ────────────────────────────────────────────────────

  /** GET /api/tags — List all address tags */
  router.get('/tags', (_req, res) => {
    res.json({ tags: tagsService.getTags() });
  });

  /** GET /api/tags/:address — Get tag for a specific address */
  router.get('/tags/:address', (req, res) => {
    const tag = tagsService.getTag(req.params.address);
    if (tag) {
      res.json({ tag });
    } else {
      res.status(404).json({ error: 'No tag found for this address' });
    }
  });

  /** POST /api/tags — Add or update an address tag */
  router.post('/tags', (req, res) => {
    const { address, label, color } = req.body as { address?: string; label?: string; color?: string };
    if (!address || !label) {
      res.status(400).json({ error: 'address and label are required' });
      return;
    }
    const tag = tagsService.addTag(address, label, color);
    res.json({ tag });
  });

  /** DELETE /api/tags/:address — Remove an address tag */
  router.delete('/tags/:address', (req, res) => {
    const deleted = tagsService.deleteTag(req.params.address);
    if (deleted) {
      res.json({ deleted: true, address: req.params.address });
    } else {
      res.status(404).json({ error: 'No tag found for this address' });
    }
  });

  // ── Challenges & Streaks ──────────────────────────────────────────

  /** GET /api/challenges — Active challenges with progress */
  router.get('/challenges', (_req, res) => {
    try {
      const { daily, weekly } = challenges.getChallenges();
      const streak = challenges.getStreakData();
      res.json({ daily, weekly, streak });
    } catch (err) {
      logger.error('Failed to get challenges', { error: String(err) });
      res.status(500).json({ error: 'Failed to get challenges' });
    }
  });

  /** POST /api/challenges/refresh — Reset daily challenges */
  router.post('/challenges/refresh', (_req, res) => {
    try {
      challenges.resetDailyChallenges();
      const { daily, weekly } = challenges.getChallenges();
      const streak = challenges.getStreakData();
      res.json({ daily, weekly, streak });
    } catch (err) {
      logger.error('Failed to refresh challenges', { error: String(err) });
      res.status(500).json({ error: 'Failed to refresh challenges' });
    }
  });

  // ── Calendar View ─────────────────────────────────────────────

  /** GET /api/calendar — Get scheduled/recurring tips projected onto a month grid */
  router.get('/calendar', (req, res) => {
    try {
      const now = new Date();
      const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();

      if (month < 1 || month > 12 || year < 2000 || year > 2100) {
        res.status(400).json({ error: 'Invalid month or year' });
        return;
      }

      const tips = agent.getScheduledTips();
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();

      // Build a map: date string -> tips[]
      const dayMap = new Map<string, Array<{
        id: string;
        recipient: string;
        amount: string;
        token: string;
        chain?: string;
        message?: string;
        recurring: boolean;
        interval?: string;
        scheduledAt: string;
        status: string;
      }>>();

      for (const tip of tips) {
        const tipDate = new Date(tip.scheduledAt);

        if (tip.recurring && tip.status === 'scheduled') {
          // Project recurring tips across the month
          for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month - 1, day);
            if (checkDate < tipDate && !tip.lastExecuted) continue; // hasn't started yet before this day

            let shouldShow = false;
            if (tip.interval === 'daily') {
              shouldShow = checkDate >= firstDay;
            } else if (tip.interval === 'weekly') {
              shouldShow = checkDate.getDay() === tipDate.getDay();
            } else if (tip.interval === 'monthly') {
              shouldShow = checkDate.getDate() === tipDate.getDate();
            }

            if (shouldShow && checkDate >= tipDate) {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
              dayMap.get(dateStr)!.push({
                id: tip.id,
                recipient: tip.recipient,
                amount: tip.amount,
                token: tip.token || 'native',
                chain: tip.chain,
                message: tip.message,
                recurring: true,
                interval: tip.interval,
                scheduledAt: tip.scheduledAt,
                status: tip.status,
              });
            }
          }
        } else {
          // One-time tip — show on its exact date
          if (tipDate.getMonth() + 1 === month && tipDate.getFullYear() === year) {
            const day = tipDate.getDate();
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
            dayMap.get(dateStr)!.push({
              id: tip.id,
              recipient: tip.recipient,
              amount: tip.amount,
              token: tip.token || 'native',
              chain: tip.chain,
              message: tip.message,
              recurring: !!tip.recurring,
              interval: tip.interval,
              scheduledAt: tip.scheduledAt,
              status: tip.status,
            });
          }
        }
      }

      const events = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dateTips]) => ({ date, tips: dateTips }));

      res.json({ month, year, events });
    } catch (err) {
      logger.error('Failed to get calendar data', { error: String(err) });
      res.status(500).json({ error: 'Failed to get calendar data' });
    }
  });

  // ── Chain Analytics (Cross-Chain Comparison) ────────────────────────

  /** GET /api/analytics/chains — Per-chain analytics for side-by-side comparison */
  router.get('/analytics/chains', async (_req, res) => {
    try {
      const history = agent.getHistory();
      const chainIds = wallet.getRegisteredChains();
      const balances = await wallet.getAllBalances();

      // Gather per-chain stats
      const chainStats = chainIds.map((chainId) => {
        const chainHistory = history.filter((h) => h.chainId === chainId);
        const succeeded = chainHistory.filter((h) => h.status === 'confirmed');
        const totalTips = chainHistory.length;
        const totalVolume = succeeded.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
        const fees = succeeded.map((h) => parseFloat(h.fee || '0')).filter((f) => !isNaN(f));
        const avgFee = fees.length > 0 ? fees.reduce((a, b) => a + b, 0) / fees.length : 0;
        const successRate = totalTips > 0 ? Math.round((succeeded.length / totalTips) * 100) : 100;
        const bal = balances.find((b) => b.chainId === chainId);

        // Estimate average confirmation time (use 15s for ETH, 5s for TON as defaults)
        const config = wallet.getChainConfig(chainId);
        const avgConfirmationTime = config.blockchain === 'ethereum' ? 15 : 5;

        return {
          chainId,
          name: config.name,
          totalTips,
          totalVolume: totalVolume.toFixed(6),
          avgFee: avgFee.toFixed(6),
          successRate,
          balance: bal?.nativeBalance ?? '0',
          avgConfirmationTime,
          gasPrice: '0',
        };
      });

      // Try to fetch gas prices for each chain
      for (const stat of chainStats) {
        try {
          const config = wallet.getChainConfig(stat.chainId as ChainId);
          if (config.blockchain === 'ethereum') {
            const provider = new JsonRpcProvider('https://rpc.sepolia.org');
            const feeData = await provider.getFeeData();
            if (feeData.gasPrice) {
              stat.gasPrice = parseFloat(formatUnits(feeData.gasPrice, 'gwei')).toFixed(2) + ' gwei';
            }
          } else {
            stat.gasPrice = 'N/A';
          }
        } catch {
          stat.gasPrice = 'N/A';
        }
      }

      // Determine recommendations
      const withFees = chainStats.filter((c) => parseFloat(c.avgFee) > 0);
      const lowestFee = withFees.length > 0
        ? withFees.reduce((a, b) => parseFloat(a.avgFee) < parseFloat(b.avgFee) ? a : b).chainId
        : chainIds[chainIds.length - 1] || '';
      const fastest = chainStats.reduce((a, b) => a.avgConfirmationTime < b.avgConfirmationTime ? a : b).chainId;

      res.json({
        chains: chainStats,
        recommendation: { lowestFee, fastest },
      });
    } catch (err) {
      logger.error('Failed to get chain analytics', { error: String(err) });
      res.status(500).json({ error: 'Failed to get chain analytics' });
    }
  });

  // ── Spending Limits ────────────────────────────────────────────

  /** GET /api/limits — Get current spending limits and totals */
  router.get('/limits', (_req, res) => {
    try {
      const spending = limitsService.getSpending();
      res.json({ spending });
    } catch (err) {
      logger.error('Failed to get spending limits', { error: String(err) });
      res.status(500).json({ error: 'Failed to get spending limits' });
    }
  });

  /** PUT /api/limits — Update spending limits */
  router.put('/limits', (req, res) => {
    try {
      const body = req.body as {
        dailyLimit?: number;
        weeklyLimit?: number;
        perTipLimit?: number;
        currency?: string;
      };

      if (body.dailyLimit !== undefined && (typeof body.dailyLimit !== 'number' || body.dailyLimit < 0)) {
        res.status(400).json({ error: 'dailyLimit must be a non-negative number' });
        return;
      }
      if (body.weeklyLimit !== undefined && (typeof body.weeklyLimit !== 'number' || body.weeklyLimit < 0)) {
        res.status(400).json({ error: 'weeklyLimit must be a non-negative number' });
        return;
      }
      if (body.perTipLimit !== undefined && (typeof body.perTipLimit !== 'number' || body.perTipLimit < 0)) {
        res.status(400).json({ error: 'perTipLimit must be a non-negative number' });
        return;
      }

      const limits = limitsService.setLimits(body);
      res.json({ limits });
    } catch (err) {
      logger.error('Failed to update spending limits', { error: String(err) });
      res.status(500).json({ error: 'Failed to update spending limits' });
    }
  });

  // ── Audit Log ─────────────────────────────────────────────────

  /** GET /api/audit — Get audit log entries with optional filters */
  router.get('/audit', (req, res) => {
    try {
      const filters = {
        eventType: req.query.eventType as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
      };
      const entries = limitsService.getAuditLog(filters);
      res.json({ entries });
    } catch (err) {
      logger.error('Failed to get audit log', { error: String(err) });
      res.status(500).json({ error: 'Failed to get audit log' });
    }
  });

  // ── Goals (Fundraising Targets) ──────────────────────────────

  /** GET /api/goals — List all goals */
  router.get('/goals', (_req, res) => {
    try {
      const goals = goalsService.getGoals();
      res.json({ goals });
    } catch (err) {
      logger.error('Failed to get goals', { error: String(err) });
      res.status(500).json({ error: 'Failed to get goals' });
    }
  });

  /** POST /api/goals — Create a new goal */
  router.post('/goals', (req, res) => {
    try {
      const { title, description, targetAmount, token, recipient, deadline } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'title is required' });
        return;
      }
      if (!targetAmount || typeof targetAmount !== 'number' || targetAmount <= 0) {
        res.status(400).json({ error: 'targetAmount must be a positive number' });
        return;
      }
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'token is required (native, usdt, or any)' });
        return;
      }

      const goal = goalsService.createGoal({
        title: title.trim(),
        description: description ?? '',
        targetAmount,
        token,
        recipient,
        deadline,
      });

      res.status(201).json({ goal });
    } catch (err) {
      logger.error('Failed to create goal', { error: String(err) });
      res.status(500).json({ error: 'Failed to create goal' });
    }
  });

  /** PUT /api/goals/:id — Update a goal */
  router.put('/goals/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, targetAmount, deadline, recipient } = req.body;

      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (targetAmount !== undefined) updates.targetAmount = targetAmount;
      if (deadline !== undefined) updates.deadline = deadline;
      if (recipient !== undefined) updates.recipient = recipient;

      const goal = goalsService.updateGoal(id, updates);
      if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
      }

      res.json({ goal });
    } catch (err) {
      logger.error('Failed to update goal', { error: String(err) });
      res.status(500).json({ error: 'Failed to update goal' });
    }
  });

  /** DELETE /api/goals/:id — Delete a goal */
  router.delete('/goals/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = goalsService.deleteGoal(id);
      if (!deleted) {
        res.status(404).json({ error: 'Goal not found' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      logger.error('Failed to delete goal', { error: String(err) });
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  });

  return router;
}
