<p align="center">
  <h1 align="center">⚡ TipFlow</h1>
  <p align="center"><strong>AI-Powered Multi-Chain Tipping Agent</strong></p>
  <p align="center">
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
    <img src="https://img.shields.io/badge/Tether-WDK-009393?logo=tether&logoColor=white" alt="Tether WDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Track-Tipping%20Bot-ff6b6b" alt="Track: Tipping Bot" />
  </p>
</p>

---

## What is TipFlow?

TipFlow is an **autonomous AI agent** that eliminates the complexity of sending crypto tips across multiple blockchains. Tell it what you want in plain English — "send 0.01 ETH to 0x..." — and the agent analyzes chains, selects the optimal route, executes the transaction via **Tether WDK**, and confirms it on-chain. All decisions are transparent, all transactions are real.

---

## Key Features

| | Feature | Description |
|---|---------|-------------|
| 🧠 | **AI Decision Pipeline** | 6-step autonomous pipeline: INTAKE → ANALYZE → REASON → EXECUTE → VERIFY → REPORT |
| 💬 | **Natural Language Processing** | Type "send 0.01 ETH to 0x..." — the agent parses, fills the form, and executes |
| 📦 | **Batch Tipping** | Tip up to 10 recipients in a single operation with per-recipient amounts |
| ⏰ | **Scheduled Tips** | Schedule tips for future autonomous execution with a background scheduler |
| 📒 | **Address Book** | Save contacts, auto-track tip counts, quick-select from dropdown |
| 🔗 | **Multi-Chain Support** | Ethereum Sepolia + TON Testnet with intelligent chain selection |
| 💰 | **USDT Transfers** | ERC-20 USDT token transfers via WDK `transfer()` method |
| ✅ | **On-Chain Verification** | Polls for transaction receipts — confirms block number and gas used |
| 📊 | **Real-Time Analytics** | Live stats dashboard with chain distribution, tip history, and charts |
| 📡 | **Server-Sent Events** | Watch the agent think in real-time — every pipeline step streams to the UI |
| 📱 | **Mobile Responsive** | Full functionality on any screen size |

---

## Architecture

```
┌─────────────────────────────────────┐
│         React Dashboard             │
│       (Vite + Tailwind CSS)         │
│                                     │
│  Wallet View  ·  Tip Form  ·  NLP  │
│  Batch Tips  ·  Scheduler  ·  Stats │
│  Address Book  ·  Agent Panel       │
└──────────────┬──────────────────────┘
               │ REST API + SSE
┌──────────────┴──────────────────────┐
│       Node.js Agent Server          │
│                                     │
│   ┌─────────────────────────────┐   │
│   │    TipFlow Agent Pipeline   │   │
│   │                             │   │
│   │  1. INTAKE   ──→ Validate   │   │
│   │  2. ANALYZE  ──→ Balances   │   │
│   │  3. REASON   ──→ AI/Rules   │   │
│   │  4. EXECUTE  ──→ WDK Send   │   │
│   │  5. VERIFY   ──→ On-chain   │   │
│   │  6. REPORT   ──→ Dashboard  │   │
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

## WDK Integration

TipFlow uses the Tether WDK as its core wallet infrastructure. Every transaction flows through WDK — no mocked calls.

| WDK Feature | Package | Method(s) | Where Used |
|-------------|---------|-----------|------------|
| Seed phrase generation | `@tetherto/wdk` | `WDK.getRandomSeedPhrase()` | `wallet.service.ts` — first-run wallet creation |
| Wallet orchestration | `@tetherto/wdk` | `new WDK(seed)`, `registerWallet()` | `wallet.service.ts` — multi-chain wallet setup |
| EVM wallet | `@tetherto/wdk-wallet-evm` | `getAccount()`, `getAddress()` | `wallet.service.ts` — Ethereum operations |
| TON wallet | `@tetherto/wdk-wallet-ton` | `getAccount()`, `getAddress()` | `wallet.service.ts` — TON operations |
| Balance queries | Both wallet modules | `getBalance()`, `getTokenBalance()` | Chain analysis + dashboard display |
| Fee estimation | Both wallet modules | `quoteSendTransaction()` | Agent ANALYZE step — cross-chain fee comparison |
| Native transfers | Both wallet modules | `sendTransaction()` | Agent EXECUTE step — ETH/TON sends |
| USDT transfers | `@tetherto/wdk-wallet-evm` | `transfer()` | Agent EXECUTE step — ERC-20 token sends |
| Fee rate queries | `@tetherto/wdk` | `getFeeRates()` | Real-time gas price monitoring |
| Resource cleanup | `@tetherto/wdk` | `dispose()` | Graceful shutdown |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Lucide Icons, Recharts, Framer Motion |
| **Backend** | Node.js 22+, Express 5, TypeScript 5.9 |
| **Wallet SDK** | `@tetherto/wdk`, `@tetherto/wdk-wallet-evm`, `@tetherto/wdk-wallet-ton` |
| **AI Engine** | Ollama (local LLM — phi3:mini) with rule-based fallback |
| **Blockchains** | Ethereum Sepolia, TON Testnet |
| **Real-Time** | Server-Sent Events (SSE) for live pipeline updates |

---

## Quick Start

### Prerequisites

- **Node.js 22+** — [download](https://nodejs.org/)
- **Ollama** (optional) — [download](https://ollama.ai/) for AI-powered chain reasoning

### Install & Run

```bash
# Clone
git clone https://github.com/agdanish/tipflow.git
cd tipflow

# Install all dependencies
cd agent && npm install && cd ../dashboard && npm install && cd ..

# (Optional) Pull AI model
ollama pull phi3:mini

# Configure environment
cp agent/.env.example agent/.env

# Start everything
npm run dev
```

Dashboard opens at **http://localhost:5173** | Agent API at **http://localhost:3001**

### Getting Testnet Funds

1. Copy your wallet addresses from the TipFlow dashboard
2. **Sepolia ETH** — Use a Sepolia faucet (Google Cloud, Alchemy, etc.)
3. **TON Testnet** — Visit [testnet.toncenter.com](https://testnet.toncenter.com)
4. Send real tips once funded

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check (agent status, AI mode, chains) |
| `GET` | `/api/wallet/addresses` | All wallet addresses across chains |
| `GET` | `/api/wallet/balances` | Native + USDT balances for all wallets |
| `POST` | `/api/tip` | Execute a single tip (native or USDT) |
| `POST` | `/api/tip/batch` | Batch tip up to 10 recipients |
| `POST` | `/api/tip/parse` | Parse natural language into structured tip data |
| `GET` | `/api/tip/estimate` | Estimate fees across all chains |
| `POST` | `/api/tip/schedule` | Schedule a tip for future execution |
| `GET` | `/api/tip/scheduled` | List all scheduled tips |
| `DELETE` | `/api/tip/schedule/:id` | Cancel a scheduled tip |
| `GET` | `/api/agent/state` | Current agent pipeline state |
| `GET` | `/api/agent/events` | SSE stream — real-time agent updates |
| `GET` | `/api/agent/history` | Full tip history with reasoning |
| `GET` | `/api/agent/stats` | Analytics (totals, chain distribution, daily trends) |
| `GET` | `/api/tx/:hash/status` | On-chain transaction confirmation status |
| `GET` | `/api/contacts` | Address book — list contacts |
| `POST` | `/api/contacts` | Add a contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |
| `GET` | `/api/chains` | Supported chain configurations |

---

## Project Structure

```
tipflow/
├── agent/                          # Node.js agent server
│   └── src/
│       ├── core/agent.ts           # 6-step agent pipeline + scheduler
│       ├── services/
│       │   ├── wallet.service.ts   # WDK wallet operations
│       │   ├── ai.service.ts       # Ollama LLM + regex fallback
│       │   └── contacts.service.ts # Address book persistence
│       ├── routes/api.ts           # 19 REST + SSE endpoints
│       ├── types/index.ts          # Shared TypeScript types
│       ├── utils/logger.ts         # Winston structured logging
│       └── index.ts                # Entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/
│       │   ├── TipForm.tsx         # NLP input + manual form + contacts
│       │   ├── BatchTipForm.tsx    # Multi-recipient batch tips
│       │   ├── AgentPanel.tsx      # Real-time pipeline visualization
│       │   ├── WalletCard.tsx      # Balance display with copy
│       │   ├── TipHistory.tsx      # Transaction log with explorer links
│       │   ├── StatsPanel.tsx      # Analytics charts (Recharts)
│       │   ├── Header.tsx          # Status bar with health indicator
│       │   └── Toast.tsx           # Notification system
│       ├── hooks/                  # API polling hooks
│       ├── lib/                    # API client + utilities
│       └── types/                  # Frontend TypeScript types
├── package.json                    # Root orchestrator (concurrently)
├── LICENSE                         # Apache 2.0
└── README.md
```

---

## Hackathon Track: Tipping Bot

TipFlow targets the **Tipping Bot** track with a focus on what makes a great autonomous agent:

- **Agent Intelligence** — 6-step decision pipeline with LLM reasoning (Ollama) and transparent explanations for every chain selection
- **WDK Integration** — Deep use of Tether WDK across 10+ methods: seed generation, multi-chain wallet management, balance queries, fee estimation, native transfers, and ERC-20 USDT transfers
- **Technical Execution** — Full-stack TypeScript, real testnet transactions, on-chain verification with block confirmation, SSE streaming, structured logging
- **Agentic Design** — Autonomous pipeline that analyzes, reasons, executes, and verifies without human intervention. Scheduled tips run in the background. Batch tipping orchestrates multiple transactions
- **Originality** — Natural language parsing, address book with tip tracking, cross-chain fee comparison, real-time pipeline visualization
- **Polish** — Dark theme UI, mobile responsive, toast notifications, loading states, error handling with friendly messages, one-command startup
- **Zero Budget** — No paid APIs. Local Ollama LLM with rule-based fallback. Fully self-contained

---

## License

[Apache 2.0](./LICENSE)

---

<p align="center">
  Built with <a href="https://wdk.tether.io">Tether WDK</a> for Tether Hackathon Galactica: WDK Edition 1
</p>
