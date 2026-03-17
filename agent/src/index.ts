import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import WDK from '@tetherto/wdk';
import { WalletService } from './services/wallet.service.js';
import { AIService } from './services/ai.service.js';
import { TipFlowAgent } from './core/agent.js';
import { createApiRouter, webhooks, challenges, limitsService, goalsService } from './routes/api.js';
import { logger } from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = resolve(__dirname, '..', '.seed');
const PORT = parseInt(process.env.PORT ?? '3001', 10);

/** Load or generate a persistent seed phrase */
function getOrCreateSeed(): string {
  // 1. Check env variable
  if (process.env.WDK_SEED && process.env.WDK_SEED.trim().length > 0) {
    logger.info('Using seed phrase from WDK_SEED env variable');
    return process.env.WDK_SEED.trim();
  }
  // 2. Check local seed file
  if (existsSync(SEED_FILE)) {
    const seed = readFileSync(SEED_FILE, 'utf-8').trim();
    if (seed.length > 0) {
      logger.info('Using seed phrase from .seed file');
      return seed;
    }
  }
  // 3. Generate and persist a new seed
  const newSeed = WDK.getRandomSeedPhrase();
  writeFileSync(SEED_FILE, newSeed, 'utf-8');
  logger.info('Generated new seed phrase and saved to .seed file');
  return newSeed;
}

async function main(): Promise<void> {
  logger.info('Starting TipFlow Agent...');

  // Initialize services
  const walletService = new WalletService();
  const aiService = new AIService();

  // Initialize wallet with persistent seed
  const seed = getOrCreateSeed();
  await walletService.initialize(seed);

  // Log wallet addresses
  const addresses = await walletService.getAllAddresses();
  for (const [chain, address] of Object.entries(addresses)) {
    logger.info(`Wallet address [${chain}]: ${address}`);
  }

  // Initialize AI service
  await aiService.initialize();

  // Create agent
  const agent = new TipFlowAgent(walletService, aiService);
  agent.setWebhooksService(webhooks);
  agent.setChallengesService(challenges);
  agent.setLimitsService(limitsService);
  agent.setGoalsService(goalsService);

  // Start Telegram bot (optional — only if TELEGRAM_BOT_TOKEN is set)
  agent.startTelegramBot().catch((err) => {
    logger.warn('Telegram bot startup failed (non-fatal)', { error: String(err) });
  });

  // Subscribe to state changes for logging
  agent.onStateChange((state) => {
    logger.info('Agent state changed', { status: state.status });
  });

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Security headers
  app.use((_req, _res, next) => {
    _res.setHeader('X-Content-Type-Options', 'nosniff');
    _res.setHeader('X-Frame-Options', 'DENY');
    _res.setHeader('X-XSS-Protection', '1; mode=block');
    _res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    _res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Mount API routes
  app.use('/api', createApiRouter(agent, walletService, aiService));

  // Serve dashboard static files in production (Docker build)
  const dashboardDist = resolve(__dirname, '..', '..', 'dashboard', 'dist');
  if (existsSync(dashboardDist)) {
    logger.info(`Serving dashboard from ${dashboardDist}`);
    app.use(express.static(dashboardDist));
    // SPA catch-all: serve index.html for non-API routes
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(resolve(dashboardDist, 'index.html'));
    });
  }

  // Start server
  app.listen(PORT, () => {
    logger.info(`TipFlow Agent running on http://localhost:${PORT}`);
    logger.info(`AI mode: ${aiService.isAvailable() ? 'LLM (Ollama)' : 'Rule-based'}`);
    logger.info('Ready to process tips');
  });

  // Graceful shutdown
  const shutdown = (): void => {
    logger.info('Shutting down...');
    walletService.dispose();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
