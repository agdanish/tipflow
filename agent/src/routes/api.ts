import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { TipFlowAgent } from '../core/agent.js';
import type { WalletService } from '../services/wallet.service.js';
import type { AIService } from '../services/ai.service.js';
import { ContactsService } from '../services/contacts.service.js';
import type { ChainId, TipRequest, TokenType, BatchTipRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

/** Shared contacts service instance */
const contacts = new ContactsService();

/** Create API router with injected dependencies */
export function createApiRouter(
  agent: TipFlowAgent,
  wallet: WalletService,
  ai: AIService,
): Router {
  const router = Router();

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

  /** GET /api/wallet/seed — Get the seed phrase (for demo/setup display only) */
  router.get('/wallet/seed', (_req, res) => {
    res.json({ seed: wallet.getSeedPhrase() });
  });

  /** POST /api/tip — Execute a tip */
  router.post('/tip', async (req, res) => {
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
      }
      res.json({ result });
    } catch (err) {
      logger.error('Tip execution failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
    }
  });

  /** POST /api/tip/batch — Execute batch tips to multiple recipients */
  router.post('/tip/batch', async (req, res) => {
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

  /** POST /api/tip/parse — Parse natural language tip command */
  router.post('/tip/parse', async (req, res) => {
    try {
      const { input } = req.body as { input?: string };
      if (!input || typeof input !== 'string') {
        res.status(400).json({ error: 'input string is required' });
        return;
      }

      const parsed = await ai.parseNaturalLanguageTip(input);
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

  /** GET /api/agent/history — Get tip history */
  router.get('/agent/history', (_req, res) => {
    res.json({ history: agent.getHistory() });
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

  /** POST /api/tip/schedule — Schedule a future tip */
  router.post('/tip/schedule', (req, res) => {
    try {
      const { recipient, amount, token, chain, message, scheduledAt } = req.body as {
        recipient: string;
        amount: string;
        token?: TokenType;
        chain?: ChainId;
        message?: string;
        scheduledAt: string;
      };

      if (!recipient || !amount || !scheduledAt) {
        res.status(400).json({ error: 'recipient, amount, and scheduledAt are required' });
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
        { recipient, amount, token, chain, message },
        scheduledAt,
      );

      logger.info('Tip scheduled via API', { id: tip.id, scheduledAt });
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

  return router;
}
