# TipFlow — AI-Powered Multi-Chain Tipping Agent

> Autonomous AI agent that manages multi-chain wallets and executes crypto tips with intelligent chain selection — powered by [Tether WDK](https://wdk.tether.io).

**Hackathon:** Tether Hackathon Galactica: WDK Edition 1
**Track:** Tipping Bot
**Built by:** Danish A

---

## What is TipFlow?

TipFlow is an autonomous AI tipping agent that eliminates the complexity of sending crypto tips across multiple blockchains. Instead of manually selecting chains, calculating gas fees, and managing wallets — you simply specify a recipient and amount. The AI agent handles everything else.

### The Problem

Sending crypto tips across different blockchains is:
- **Confusing** — users must understand gas fees, chain selection, and wallet management
- **Expensive** — choosing the wrong chain can cost 10x more in fees
- **Manual** — every step requires human decision-making

### The Solution

TipFlow's AI agent autonomously:
1. **Analyzes** all available chains (fees, balances, network health)
2. **Reasons** about the optimal chain using LLM intelligence (Ollama)
3. **Executes** the transaction via Tether WDK
4. **Reports** with full transparency — every decision is explained

---

## Architecture

```
┌─────────────────────────────────────┐
│         React Dashboard             │
│   (Vite + Tailwind CSS)             │
│   Wallet View │ Tip Form │ History  │
│   Agent Panel │ Analytics           │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────┴──────────────────────┐
│         Node.js Agent Server        │
│   ┌─────────────────────────────┐   │
│   │    TipFlow Agent Pipeline   │   │
│   │  INTAKE → ANALYZE → REASON  │   │
│   │  → EXECUTE → VERIFY → REPORT│   │
│   └─────────────────────────────┘   │
│         │              │            │
│    ┌────┴────┐    ┌────┴─────┐     │
│    │ Ollama  │    │ Tether   │     │
│    │  (LLM)  │    │   WDK    │     │
│    └─────────┘    └────┬─────┘     │
└────────────────────────┼───────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
   ┌──────┴──────┐ ┌────┴─────┐ ┌─────┴──────┐
   │  Ethereum   │ │   TON    │ │  Future    │
   │  (Sepolia)  │ │(Testnet) │ │  Chains    │
   └─────────────┘ └──────────┘ └────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Node.js 22+, Express, TypeScript |
| **Wallet SDK** | Tether WDK (`@tetherto/wdk`, `wdk-wallet-evm`, `wdk-wallet-ton`) |
| **AI** | Ollama (local LLM — phi3:mini) with rule-based fallback |
| **Chains** | Ethereum Sepolia, TON Testnet |

---

## WDK Integration Points

TipFlow uses Tether WDK extensively:

| Feature | WDK Module | Method |
|---------|-----------|--------|
| Seed phrase generation | `@tetherto/wdk` | `WDK.getRandomSeedPhrase()` |
| Wallet orchestration | `@tetherto/wdk` | `new WDK(seed).registerWallet()` |
| EVM wallet management | `@tetherto/wdk-wallet-evm` | `getAccount()`, `getAddress()` |
| TON wallet management | `@tetherto/wdk-wallet-ton` | `getAccount()`, `getAddress()` |
| Balance queries | Both wallet modules | `getBalance()`, `getTokenBalance()` |
| Fee estimation | Both wallet modules | `quoteSendTransaction()` |
| Transaction execution | Both wallet modules | `sendTransaction()`, `transfer()` |
| Fee rate queries | `@tetherto/wdk` | `getFeeRates()` |
| Resource cleanup | `@tetherto/wdk` | `dispose()` |

---

## Quick Start

### Prerequisites

- **Node.js 22+** ([download](https://nodejs.org/))
- **Ollama** ([download](https://ollama.ai/)) — optional, for AI reasoning

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/agdanish/tipflow.git
cd tipflow

# 2. Install dependencies
cd agent && npm install && cd ../dashboard && npm install && cd ..

# 3. Pull the AI model (optional but recommended)
ollama pull phi3:mini

# 4. Configure environment
cp agent/.env.example agent/.env
# Edit agent/.env if you want to use a specific seed phrase

# 5. Start both services
npm run dev
```

The dashboard opens at `http://localhost:5173` and the agent API runs on `http://localhost:3001`.

### Getting Testnet Funds

To send real test transactions, you need testnet tokens:

1. **Sepolia ETH**: Visit a Sepolia faucet (e.g. Google Cloud faucet, Alchemy faucet)
2. **TON Testnet**: Visit [testnet.toncenter.com](https://testnet.toncenter.com) faucet
3. Copy your wallet addresses from the TipFlow dashboard and request testnet tokens
4. Once funded, you can send real tips through the dashboard

### One-Command Start

```bash
npm run dev
```

---

## Agent Decision Pipeline

Every tip goes through a 6-step autonomous pipeline:

1. **INTAKE** — Parse and validate the tip request
2. **ANALYZE** — Query balances and fees across all chains
3. **REASON** — AI selects the optimal chain with natural language explanation
4. **EXECUTE** — Build and send transaction via WDK
5. **VERIFY** — Confirm transaction broadcast
6. **REPORT** — Update dashboard with results and reasoning

The entire pipeline is visible in real-time on the dashboard.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/wallet/addresses` | All wallet addresses |
| GET | `/api/wallet/balances` | All wallet balances |
| POST | `/api/tip` | Execute a tip |
| GET | `/api/tip/estimate` | Estimate fees |
| GET | `/api/agent/state` | Current agent state |
| GET | `/api/agent/history` | Tip history |
| GET | `/api/agent/stats` | Agent statistics |
| GET | `/api/chains` | Supported chains |

---

## Project Structure

```
tipflow/
├── agent/                    # Node.js agent server
│   ├── src/
│   │   ├── core/agent.ts     # TipFlow agent pipeline
│   │   ├── services/
│   │   │   ├── wallet.service.ts  # WDK wallet operations
│   │   │   └── ai.service.ts     # Ollama LLM integration
│   │   ├── routes/api.ts     # REST API endpoints
│   │   ├── types/index.ts    # Shared type definitions
│   │   ├── utils/logger.ts   # Winston logger
│   │   └── index.ts          # Entry point
│   └── package.json
├── dashboard/                # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/            # API polling hooks
│   │   ├── lib/              # API client + utilities
│   │   └── types/            # TypeScript types
│   └── package.json
├── research/                 # Hackathon research docs
├── CLAUDE.md                 # AI assistant context
├── LICENSE                   # Apache 2.0
└── README.md                 # This file
```

---

## Future Roadmap

- **Gasless transactions** via ERC-4337 and TON Gasless modules
- **USDT transfers** on all supported chains
- **Batch tipping** — tip multiple recipients at once
- **Discord/Telegram bots** — tip from chat platforms
- **Tip leaderboards** and streak tracking
- **Scheduled tips** — recurring payments
- **Mainnet deployment** with production-grade security

---

## License

Apache 2.0 — see [LICENSE](./LICENSE)
