import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WalletService } from './services/wallet.service.js';
import { AIService } from './services/ai.service.js';
import { TipFlowAgent } from './core/agent.js';
import { createApiRouter } from './routes/api.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main(): Promise<void> {
  logger.info('Starting TipFlow Agent...');

  // Initialize services
  const walletService = new WalletService();
  const aiService = new AIService();

  // Initialize wallet with seed from env or generate new one
  const seed = process.env.WDK_SEED || undefined;
  if (!seed) {
    logger.warn('No WDK_SEED found in env — generating new seed phrase');
  }
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

  // Subscribe to state changes for logging
  agent.onStateChange((state) => {
    logger.info('Agent state changed', { status: state.status });
  });

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount API routes
  app.use('/api', createApiRouter(agent, walletService, aiService));

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
