import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { TipFlowAgent } from '../core/agent.js';
import type { WalletService } from '../services/wallet.service.js';
import type { AIService } from '../services/ai.service.js';
import type { ChainId, TipRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

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
      const { recipient, amount, preferredChain, message } = req.body as {
        recipient: string;
        amount: string;
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
        preferredChain,
        message,
        createdAt: new Date().toISOString(),
      };

      logger.info('Processing tip request', { tipId: tipRequest.id, recipient, amount });

      const result = await agent.executeTip(tipRequest);
      res.json({ result });
    } catch (err) {
      logger.error('Tip execution failed', { error: String(err) });
      res.status(500).json({ error: String(err) });
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

  /** GET /api/agent/history — Get tip history */
  router.get('/agent/history', (_req, res) => {
    res.json({ history: agent.getHistory() });
  });

  /** GET /api/agent/stats — Get agent statistics */
  router.get('/agent/stats', (_req, res) => {
    res.json({ stats: agent.getStats() });
  });

  /** GET /api/chains — Get supported chains info */
  router.get('/chains', (_req, res) => {
    const chains = wallet.getRegisteredChains().map((id) => ({
      id,
      ...wallet.getChainConfig(id),
    }));
    res.json({ chains });
  });

  return router;
}
