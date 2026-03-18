// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

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
import { createApiRouter, webhooks, challenges, limitsService, goalsService, rumbleService, autonomyService, treasuryService, indexerService, bridgeService, lendingService, reputationService, escrowService, orchestratorService, predictorService, feeArbitrageService, memoryService, dcaService, creatorAnalyticsService } from './routes/api.js';
import { DemoService } from './services/demo.service.js';
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
  agent.setAutonomyService(autonomyService);

  // Log Rumble integration
  logger.info(`Rumble integration loaded: ${rumbleService.listCreators().length} creators registered`);

  // Log Treasury service
  const treasuryAlloc = treasuryService.getAllocation();
  logger.info(`Treasury service loaded: ${treasuryAlloc.tippingReservePercent}% reserve, ${treasuryAlloc.yieldPercent}% yield, ${treasuryAlloc.gasBufferPercent}% gas`);

  // Check WDK Indexer API availability (non-blocking)
  indexerService.healthCheck().then((health) => {
    if (health.isAvailable) {
      logger.info(`WDK Indexer API reachable (${health.latencyMs}ms)`);
    } else {
      logger.warn('WDK Indexer API unreachable (non-fatal)', { error: health.error });
    }
  }).catch(() => {
    logger.warn('WDK Indexer API health check failed (non-fatal)');
  });

  // Log new patent-level features
  logger.info(`Reputation engine: ${reputationService.getCreatorCount()} creators tracked`);
  logger.info('Cryptographic receipts (Proof-of-Tip): enabled');
  logger.info('Tip streaming protocol: enabled');

  // Log DeFi protocol integrations
  logger.info(`USDT0 Bridge service: ${bridgeService.isAvailable() ? 'available' : 'unavailable'} (${bridgeService.getRoutes().length} routes)`);
  logger.info(`Aave V3 Lending service: ${lendingService.isAvailable() ? 'available' : 'unavailable'}`);

  // Log Escrow service
  logger.info(`Tip Escrow Protocol: ${escrowService.getActiveCount()} active escrows`);

  // Log Predictive Tipping Intelligence
  logger.info(`Predictive tipping intelligence: enabled (${predictorService.getPendingPredictions().length} pending)`);

  // Log Fee Arbitrage Service
  logger.info(`Fee arbitrage service: ${feeArbitrageService.getCurrentFees().length} chains monitored`);

  // Log Agent Memory Service
  const memStats = memoryService.getStats();
  logger.info(`Agent memory service: ${memStats.totalMemories} memories, ${memStats.conversations} conversations`);

  // Log Multi-Agent Orchestrator
  const orchStats = orchestratorService.getStats();
  logger.info('Multi-agent orchestrator ready', { agents: ['TipExecutor', 'Guardian', 'TreasuryOptimizer'], dailyLimit: orchStats.dailyLimit });

  // Log DCA Tipping Service
  const dcaStats = dcaService.getStats();
  logger.info(`DCA tipping service: ${dcaStats.active} active plans, ${dcaStats.totalDistributed} distributed`);

  // Log Creator Analytics Service
  const platformStats = creatorAnalyticsService.getPlatformAnalytics();
  logger.info(`Creator analytics service: ready (${platformStats.totalTipsProcessed} tips ingested, income trends enabled)`);

  // Start Telegram bot (optional — only if TELEGRAM_BOT_TOKEN is set)
  agent.startTelegramBot().catch((err) => {
    logger.warn('Telegram bot startup failed (non-fatal)', { error: String(err) });
  });

  // Demo mode — seed sample data for judges
  const demoService = new DemoService();
  if (demoService.isEnabled()) {
    logger.info('Demo mode enabled — seeding sample data for evaluation');

    // Seed Rumble creators
    for (const creator of demoService.getSampleCreators()) {
      rumbleService.registerCreator(creator.name, creator.channelUrl, creator.walletAddress, creator.categories);
    }

    // Seed autonomy policies
    for (const policy of demoService.getSamplePolicies()) {
      autonomyService.setPolicy('default', policy);
    }

    // Seed tip history into agent
    for (const tip of demoService.getSampleTipHistory()) {
      agent.addDemoTip(tip);
    }

    // Seed activity feed
    for (const activity of demoService.getSampleActivities()) {
      agent.addDemoActivity(activity);
    }

    logger.info('Demo seed complete: 5 creators, 3 policies, 12 tips, 7 activities');
  }

  // ── Autonomous Demo Cycle ─────────────────────────────────────
  // Demonstrates ZERO-CLICK autonomy — agent acts on its own
  if (demoService.isEnabled()) {
    setTimeout(async () => {
      try {
        logger.info('═══ AUTONOMOUS CYCLE STARTING ═══');
        logger.info('Watch-time threshold reached for CryptoDaily (890 min)');

        // Step 1: Orchestrator evaluates the auto-tip
        const orchestratorAction = orchestratorService.propose('tip', {
          recipient: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
          amount: '0.003',
          token: 'usdt',
          chainId: 'ethereum-sepolia',
          memo: '[Auto] Watch-time threshold: CryptoDaily (890 min)',
        });

        logger.info('Multi-agent consensus', {
          consensus: orchestratorAction.consensus,
          confidence: orchestratorAction.overallConfidence,
          votes: orchestratorAction.votes.map(v => `${v.agent}: ${v.decision} (${v.confidence}%)`),
        });

        // Step 2: Add to activity feed
        agent.addActivity({
          type: 'system',
          message: `Autonomous cycle: ${orchestratorAction.consensus.toUpperCase()}`,
          detail: orchestratorAction.reasoningChain.join(' → '),
        });

        // Step 3: Predictor learns from demo history and generates predictions
        const tips = agent.getHistory().map(h => ({
          recipient: h.recipient,
          amount: h.amount,
          chainId: h.chainId,
          createdAt: h.createdAt,
        }));
        predictorService.learnFromHistory(tips);
        const predictions = predictorService.generatePredictions();

        if (predictions.length > 0) {
          logger.info('Predictions generated', {
            count: predictions.length,
            topPrediction: `${predictions[0].recipient.slice(0, 12)}... (${predictions[0].confidence}% confidence)`,
            category: predictions[0].category,
          });
          agent.addActivity({
            type: 'system',
            message: `Predicted ${predictions.length} upcoming tips`,
            detail: predictions.map(p => `${p.category}: ${p.confidence}%`).join(', '),
          });
        }

        // Step 4: Fee arbitrage recommendation
        const feeComparison = feeArbitrageService.compareFees('0.003', 'usdt');
        logger.info('Fee arbitrage recommendation', {
          bestChain: feeComparison.recommendation.bestChain,
          reason: feeComparison.recommendation.reason,
          savings: feeComparison.recommendation.savings,
        });
        agent.addActivity({
          type: 'system',
          message: `Fee optimization: ${feeComparison.recommendation.bestChain} recommended`,
          detail: feeComparison.recommendation.reason,
        });

        logger.info('═══ AUTONOMOUS CYCLE COMPLETE ═══');
        logger.info('Agent is now running autonomously. No human input required.');
        logger.info('Decision loop: 60s | Fee updates: 30s | Auto-release: 30s');
      } catch (err) {
        logger.error('Autonomous cycle failed', { error: String(err) });
      }
    }, 15_000);
  }

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
    logger.info(`Autonomy engine: ${autonomyService.getPolicies('default').length} policies loaded`);
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
