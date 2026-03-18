#!/usr/bin/env node
// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent
//
// MCP Server — Exposes TipFlow's wallet capabilities via Model Context Protocol.
// Any MCP-compatible AI agent (Claude, GPT, Cursor, etc.) can use these tools
// to send tips, check balances, bridge USDT0, and interact with DeFi protocols.
//
// Usage:
//   npx tsx src/mcp-server.ts                     # stdio transport (for IDE integration)
//   WDK_SEED="your seed phrase" npx tsx src/mcp-server.ts  # with custom seed
//
// This implements the WDK MCP Toolkit as recommended by the Tether Hackathon Galactica.

import { WdkMcpServer, WALLET_TOOLS, PRICING_TOOLS } from '@tetherto/wdk-mcp-toolkit';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerTon from '@tetherto/wdk-wallet-ton';
import WalletManagerTron from '@tetherto/wdk-wallet-tron';
import WDK from '@tetherto/wdk';
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = resolve(__dirname, '..', '.seed');

// Load seed from env or file (same logic as main agent)
function getSeed(): string {
  if (process.env.WDK_SEED?.trim()) return process.env.WDK_SEED.trim();
  if (existsSync(SEED_FILE)) {
    const seed = readFileSync(SEED_FILE, 'utf-8').trim();
    if (seed) return seed;
  }
  return WDK.getRandomSeedPhrase();
}

async function main(): Promise<void> {
  const seed = getSeed();

  // Create MCP server with WDK wallet capabilities
  const server = new WdkMcpServer('tipflow-mcp', '1.0.0')
    .useWdk({ seed })
    // Register all 3 chains (same as main agent)
    .registerWallet('ethereum', WalletManagerEvm, {
      provider: process.env.ETH_SEPOLIA_RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com',
    })
    .registerWallet('ton', WalletManagerTon, {
      tonClient: { url: process.env.TON_TESTNET_URL ?? 'https://testnet.toncenter.com/api/v2/jsonRPC' },
    })
    .registerWallet('tron', WalletManagerTron, {
      provider: process.env.TRON_NILE_RPC ?? 'https://nile.trongrid.io',
      transferMaxFee: 10000000n,
    })
    // Enable pricing data
    .usePricing()
    // Register built-in wallet tools (35 tools: balance, send, sign, etc.)
    .registerTools(WALLET_TOOLS)
    .registerTools(PRICING_TOOLS);

  // Connect via stdio transport (for IDE/agent integration)
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
