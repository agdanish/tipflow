import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JsonRpcProvider, formatUnits } from 'ethers';
import type { TipFlowAgent } from '../core/agent.js';
import type { WalletService } from '../services/wallet.service.js';
import type { AIService } from '../services/ai.service.js';
import { ContactsService } from '../services/contacts.service.js';
import { TemplatesService } from '../services/templates.service.js';
import { WebhooksService } from '../services/webhooks.service.js';
import type { ActivityEvent, ChatMessage, ChainId, ConditionType, TipRequest, TokenType, BatchTipRequest, SplitTipRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { transactionLimiter } from '../middleware/rateLimit.js';
import { validateTipInput, validateBatchTipInput, validateChatInput, auditLog } from '../middleware/validate.js';
import { getOpenApiSpec } from './openapi.js';

/** Shared contacts service instance */
const contacts = new ContactsService();

/** Shared templates service instance */
const templates = new TemplatesService();

/** Shared webhooks service instance — exported for agent integration */
export const webhooks = new WebhooksService();

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

  /** GET /api/agent/history/export — Export tip history as CSV */
  router.get('/agent/history/export', (_req, res) => {
    const format = (_req.query.format as string) ?? 'csv';
    if (format !== 'csv') {
      res.status(400).json({ error: 'Only csv format is supported' });
      return;
    }

    const history = agent.getHistory();
    const headers = ['Date', 'Recipient', 'Amount', 'Token', 'Chain', 'Status', 'TxHash', 'Fee', 'Message'];
    const rows = history.map((entry) => {
      const token = entry.token === 'usdt' ? 'USDT' : entry.chainId.startsWith('ethereum') ? 'ETH' : 'TON';
      const chain = entry.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
      return [
        entry.createdAt,
        entry.recipient,
        entry.amount,
        token,
        chain,
        entry.status,
        entry.txHash,
        entry.fee,
        entry.reasoning.replace(/"/g, '""'), // escape quotes for CSV
      ].map((v) => `"${v}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tipflow-history.csv"');
    res.send(csv);
  });

  /** GET /api/agent/stats — Get agent statistics */
  router.get('/agent/stats', (_req, res) => {
    res.json({ stats: agent.getStats() });
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

  /** GET /api/contacts — List all contacts */
  router.get('/contacts', (_req, res) => {
    res.json({ contacts: contacts.getContacts() });
  });

  /** POST /api/contacts — Add a contact */
  router.post('/contacts', (req, res) => {
    try {
      const { name, address, chain } = req.body as {
        name: string;
        address: string;
        chain?: ChainId;
      };

      if (!name || !address) {
        res.status(400).json({ error: 'name and address are required' });
        return;
      }

      const contact = contacts.addContact(name, address, chain);
      agent.addActivity({ type: 'contact_saved', message: `Contact saved: ${name}`, detail: address.slice(0, 10) + '...' });
      res.json({ contact });
    } catch (err) {
      logger.error('Failed to add contact', { error: String(err) });
      res.status(500).json({ error: 'Failed to add contact' });
    }
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

  /** GET /api/prices — Approximate crypto prices for currency conversion */
  router.get('/prices', (_req, res) => {
    res.json({
      prices: {
        ETH: 2500,
        TON: 2.50,
        USDT: 1.00,
      },
      lastUpdated: new Date().toISOString(),
      note: 'Approximate prices for conversion estimates only. Not suitable for trading.',
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
                content = `Tip sent successfully! I transferred ${result.amount} ${result.token === 'usdt' ? 'USDT' : result.chainId.startsWith('ethereum') ? 'ETH' : 'TON'} to ${result.to.slice(0, 8)}...${result.to.slice(-6)} on ${result.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet'}. Transaction: ${result.txHash.slice(0, 12)}...`;
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
                content = `The tip transaction failed: ${result.error ?? 'Unknown error'}. Please check your balance and try again.`;
              }
            } catch (err) {
              content = `I couldn't execute the tip: ${String(err)}. Make sure you have sufficient funds.`;
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
                  content = `Done! Sent ${result.amount} ${result.token === 'usdt' ? 'USDT' : result.chainId.startsWith('ethereum') ? 'ETH' : 'TON'} to ${result.to.slice(0, 8)}...${result.to.slice(-6)}. TX: ${result.txHash.slice(0, 12)}...`;
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
                  content = `Tip failed: ${result.error ?? 'Unknown error'}. Please check your balance.`;
                }
              } catch (err) {
                content = `Couldn't complete the tip: ${String(err)}.`;
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
            content = `Here are your current balances:\n\n${lines.join('\n')}`;
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
              content = `Current fee estimates for a 0.01 transfer:\n\n${lines.join('\n')}\n\nCheapest: ${cheapest.chainName} at ~$${cheapest.estimatedFeeUsd}`;
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
          content = `I'm TipFlow, your AI-powered tipping assistant! Here's what I can do:\n\n` +
            `- Send tips: "send 0.01 ETH to 0x1234..."\n` +
            `- Check balances: "what's my balance?"\n` +
            `- Compare fees: "which chain is cheapest?"\n` +
            `- View addresses: "show my wallet address"\n` +
            `- Tip history: "show my recent tips"\n` +
            `- USDT tips: "tip 5 USDT to 0x1234..."\n\n` +
            `I support Ethereum Sepolia and TON Testnet, and I'll automatically pick the best chain for your tip!`;
          break;
        }

        default: {
          content = `I'm not sure what you mean. I can help you with:\n\n` +
            `- Sending tips (e.g. "send 0.01 ETH to 0x...")\n` +
            `- Checking balances ("what's my balance?")\n` +
            `- Comparing fees ("which chain is cheapest?")\n` +
            `- Viewing wallet addresses ("show my address")\n\n` +
            `Try one of these, or say "help" for more details!`;
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

      const validTypes: ConditionType[] = ['gas_below', 'balance_above', 'time_of_day', 'price_change'];
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

  return router;
}
