<p align="center">
  <h1 align="center">⚡ TipFlow</h1>
  <p align="center"><strong>AI-Powered Multi-Chain Tipping Agent</strong></p>
  <p align="center">
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
    <img src="https://img.shields.io/badge/Tether-WDK-009393?logo=tether&logoColor=white" alt="Tether WDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Track-Tipping%20Bot-ff6b6b" alt="Track: Tipping Bot" />
    <img src="https://img.shields.io/badge/Endpoints-33-blueviolet" alt="33 API Endpoints" />
  </p>
</p>

---

## What is TipFlow?

TipFlow is an **autonomous AI agent** that eliminates the complexity of sending crypto tips across multiple blockchains. Tell it what you want in plain English — "send 0.01 ETH to 0x..." — and the agent analyzes chains, selects the optimal route, executes the transaction via **Tether WDK**, and confirms it on-chain. All decisions are transparent, all transactions are real.

[🎥 Watch Demo](https://youtube.com/watch?v=YOUR_DEMO_ID)

---

## Key Features

### Agent Intelligence

| | Feature | Description |
|---|---------|-------------|
| 🧠 | **AI Decision Pipeline** | 6-step autonomous pipeline: INTAKE → ANALYZE → REASON → EXECUTE → VERIFY → REPORT |
| 💬 | **Natural Language Processing** | Type "send 0.01 ETH to 0x..." — the agent parses, fills the form, and executes |
| 🤖 | **Conversational Chat Interface** | Full chat with the agent — ask about balances, fees, history, or execute tips via conversation |
| 🌳 | **Decision Tree Visualization** | See the agent's reasoning rendered as an interactive decision tree for every tip |

### Tipping Capabilities

| | Feature | Description |
|---|---------|-------------|
| 🪙 | **Single Tips** | Send native ETH/TON or USDT to any address with one click or a chat message |
| 📦 | **Batch Tipping** | Tip up to 10 recipients in a single operation with per-recipient amounts |
| ⏰ | **Scheduled Tips** | Schedule tips for future autonomous execution with a background scheduler |
| 🔄 | **Recurring Tips** | Set up daily, weekly, or monthly recurring tips that auto-execute |
| 📋 | **Tip Templates** | Save and reuse frequently-sent tip configurations (name, recipient, amount, token, chain) |
| 💰 | **USDT ERC-20 Transfers** | ERC-20 USDT token transfers via WDK `transfer()` method |

### Multi-Chain & Wallet

| | Feature | Description |
|---|---------|-------------|
| 🔗 | **Multi-Chain Support** | Ethereum Sepolia + TON Testnet with intelligent chain selection |
| ✅ | **On-Chain Verification** | Polls for transaction receipts — confirms block number and gas used |
| ⛽ | **Real-Time Gas Monitoring** | Live gas prices across all chains with low/medium/high status indicators |
| 💱 | **Fee Optimization** | Cross-chain fee comparison to automatically select the cheapest route |
| 📱 | **QR Code Wallet Receive** | Generate QR codes for your wallet addresses to easily receive funds |
| 🔐 | **Seed Phrase Management** | Persistent seed with WDK — wallet state survives restarts |

### Dashboard & UX

| | Feature | Description |
|---|---------|-------------|
| 📊 | **Real-Time Analytics** | Live stats dashboard with chain distribution, tip totals, and daily trend charts |
| 📡 | **Live Activity Feed (SSE)** | Watch the agent think in real-time — every pipeline step and event streams to the UI |
| 🏆 | **Leaderboard** | Top tip recipients ranked by total tips received |
| 🎖️ | **Achievements** | Unlock badges for milestones: first tip, batch tips, multi-chain usage, and more |
| 💱 | **Currency Converter** | Convert between ETH, TON, and USD with approximate price data |
| 📒 | **Address Book** | Save contacts, auto-track tip counts, quick-select from dropdown with persistence |
| 📥 | **CSV Export** | Export full tip history as CSV for record-keeping or analysis |
| 🌗 | **Dark / Light Theme** | Toggle between dark and light themes with localStorage persistence |
| ⌨️ | **Keyboard Shortcuts** | Power-user shortcuts: submit tips, toggle modes, switch themes, and more |
| 🔔 | **Notification Sounds** | Audio feedback on tip success/failure with toggle control |
| 🎓 | **Guided Onboarding Tour** | First-visit interactive walkthrough highlighting key features |
| 📱 | **Mobile Responsive** | Full functionality on any screen size |

---

## Architecture

```
┌──────────────────────────────────────────┐
│            React Dashboard               │
│          (Vite + Tailwind CSS)           │
│                                          │
│  Wallet View  ·  Tip Form  ·  NLP Chat  │
│  Batch Tips  ·  Scheduler  ·  Templates │
│  Gas Monitor · Converter · QR Receive   │
│  Leaderboard · Achievements · Activity  │
│  Decision Tree · CSV Export · Themes    │
└───────────────┬──────────────────────────┘
                │ REST API (33 endpoints) + SSE
┌───────────────┴──────────────────────────┐
│        Node.js Agent Server              │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │     TipFlow Agent Pipeline       │   │
│   │                                  │   │
│   │  1. INTAKE   ──→ Validate        │   │
│   │  2. ANALYZE  ──→ Balances + Fees │   │
│   │  3. REASON   ──→ AI / Rules      │   │
│   │  4. EXECUTE  ──→ WDK Send        │   │
│   │  5. VERIFY   ──→ On-chain        │   │
│   │  6. REPORT   ──→ Dashboard       │   │
│   └──────────────────────────────────┘   │
│     │         │            │             │
│  ┌──┴──┐  ┌───┴────┐  ┌───┴──────┐     │
│  │Ollama│  │ Tether │  │Scheduler │     │
│  │(LLM) │  │  WDK   │  │ + Chat   │     │
│  └──────┘  └───┬────┘  └──────────┘     │
└────────────────┼────────────────────────┘
                 │
   ┌─────────────┼──────────────┐
   │             │              │
┌──┴──────┐ ┌───┴────┐ ┌──────┴─────┐
│Ethereum │ │  TON   │ │  Future    │
│(Sepolia)│ │(Testnet)│ │  Chains    │
└─────────┘ └────────┘ └────────────┘
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
| **Real-Time** | Server-Sent Events (SSE) for live pipeline updates + activity feed |

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

### Docker (One-Command Startup)

```bash
docker-compose up
```

Open **http://localhost:3001** — the agent serves the dashboard and API together.

### Getting Testnet Funds

1. Copy your wallet addresses from the TipFlow dashboard
2. **Sepolia ETH** — Use a Sepolia faucet (Google Cloud, Alchemy, etc.)
3. **TON Testnet** — Visit [testnet.toncenter.com](https://testnet.toncenter.com)
4. Send real tips once funded

---

## API Reference (33 Endpoints)

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check (agent status, AI mode, chains) |
| `GET` | `/api/chains` | Supported chain configurations |
| `GET` | `/api/gas` | Real-time gas prices across all chains |
| `GET` | `/api/prices` | Approximate crypto prices for currency conversion |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wallet/addresses` | All wallet addresses across chains |
| `GET` | `/api/wallet/balances` | Native + USDT balances for all wallets |
| `GET` | `/api/wallet/receive` | Wallet addresses with QR code URLs and explorer links |
| `GET` | `/api/wallet/seed` | Seed phrase (for demo/setup display) |

### Tips

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip` | Execute a single tip (native or USDT) |
| `POST` | `/api/tip/batch` | Batch tip up to 10 recipients |
| `POST` | `/api/tip/parse` | Parse natural language into structured tip data |
| `GET` | `/api/tip/estimate` | Estimate fees across all chains |
| `GET` | `/api/fees/compare` | Cross-chain fee comparison with savings recommendation |

### Scheduling

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip/schedule` | Schedule a future tip (one-time or recurring) |
| `GET` | `/api/tip/scheduled` | List all scheduled tips |
| `DELETE` | `/api/tip/schedule/:id` | Cancel a scheduled tip |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agent/state` | Current agent pipeline state |
| `GET` | `/api/agent/events` | SSE stream — real-time agent pipeline updates |
| `GET` | `/api/agent/history` | Full tip history with reasoning |
| `GET` | `/api/agent/history/export` | Export tip history as CSV download |
| `GET` | `/api/agent/stats` | Analytics (totals, chain distribution, daily trends) |
| `GET` | `/api/tx/:hash/status` | On-chain transaction confirmation status |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity` | Recent activity log |
| `GET` | `/api/activity/stream` | SSE stream — real-time activity events |

### Address Book

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Add a contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/templates` | List all tip templates |
| `POST` | `/api/templates` | Create a tip template |
| `DELETE` | `/api/templates/:id` | Delete a tip template |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leaderboard` | Top tip recipients leaderboard |
| `GET` | `/api/achievements` | Achievement progress and unlocked badges |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Conversational chat — send tips, check balances, compare fees via natural language |

---

## Project Structure

```
tipflow/
├── agent/                          # Node.js agent server
│   └── src/
│       ├── core/agent.ts           # 6-step agent pipeline + scheduler + leaderboard + achievements
│       ├── services/
│       │   ├── wallet.service.ts   # WDK wallet operations + fee comparison
│       │   ├── ai.service.ts       # Ollama LLM + regex fallback + intent detection
│       │   ├── contacts.service.ts # Address book persistence
│       │   └── templates.service.ts# Tip templates persistence
│       ├── routes/api.ts           # 33 REST + SSE endpoints
│       ├── types/index.ts          # Shared TypeScript types
│       ├── utils/logger.ts         # Winston structured logging
│       └── index.ts                # Entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/
│       │   ├── TipForm.tsx         # NLP input + manual form + contacts + templates
│       │   ├── BatchTipForm.tsx    # Multi-recipient batch tips
│       │   ├── AgentPanel.tsx      # Real-time pipeline visualization
│       │   ├── WalletCard.tsx      # Balance display with copy
│       │   ├── TipHistory.tsx      # Transaction log with explorer links + CSV export
│       │   ├── StatsPanel.tsx      # Analytics charts (Recharts)
│       │   ├── GasMonitor.tsx      # Live gas prices across chains
│       │   ├── CurrencyConverter.tsx # ETH/TON/USD converter
│       │   ├── Leaderboard.tsx     # Top recipients ranking
│       │   ├── Achievements.tsx    # Milestone badges
│       │   ├── ActivityFeed.tsx    # SSE-powered live activity stream
│       │   ├── QRReceive.tsx       # QR codes for receiving funds
│       │   ├── DecisionTree.tsx    # Agent decision visualization
│       │   ├── TipTemplates.tsx    # Save/reuse tip templates
│       │   ├── ChatInterface.tsx   # Conversational chat with the agent
│       │   ├── OnboardingOverlay.tsx# Guided first-visit tour
│       │   ├── KeyboardShortcutsModal.tsx # Shortcut reference
│       │   ├── Header.tsx          # Status bar, theme toggle, sound toggle
│       │   ├── Toast.tsx           # Notification system
│       │   └── Skeleton.tsx        # Loading skeletons
│       ├── hooks/                  # API polling + keyboard shortcut hooks
│       ├── lib/                    # API client + utilities + sound effects
│       └── types/                  # Frontend TypeScript types
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command startup
├── package.json                    # Root orchestrator (concurrently)
├── LICENSE                         # Apache 2.0
└── README.md
```

---

## Hackathon Track: Tipping Bot

TipFlow targets the **Tipping Bot** track with a focus on what makes a great autonomous agent:

- **Agent Intelligence** — 6-step decision pipeline with LLM reasoning (Ollama) and transparent explanations for every chain selection. Conversational chat interface that understands intent (tip, balance, fees, history, help). Decision tree visualization shows agent reasoning in real time.

- **WDK Integration** — Deep use of Tether WDK across 10+ methods: seed generation, multi-chain wallet management, balance queries, fee estimation, native transfers, ERC-20 USDT transfers, fee rate queries, and graceful resource cleanup. Persistent seed phrase across restarts.

- **Technical Execution** — Full-stack TypeScript, 33 REST/SSE API endpoints, real testnet transactions, on-chain verification with block confirmation, dual SSE streams (agent pipeline + activity feed), structured Winston logging, CSV export, Docker containerization.

- **Agentic Payment Design** — Autonomous pipeline that analyzes, reasons, executes, and verifies without human intervention. Scheduled and recurring tips (daily/weekly/monthly) run in the background. Batch tipping orchestrates up to 10 transactions. Cross-chain fee optimizer automatically selects the cheapest route. Tip templates for one-click reuse.

- **Originality** — Natural language parsing via LLM with regex fallback, conversational chat that can execute tips, address book with tip count tracking, leaderboard and achievement system, decision tree visualization, guided onboarding tour, QR code wallet receive, currency converter.

- **Polish & Ship-ability** — Dark/light theme, mobile responsive, toast notifications with sounds, keyboard shortcuts, loading skeletons, error handling with friendly messages, guided onboarding tour, one-command Docker startup, CSV export for record-keeping.

- **Zero Budget** — No paid APIs. Local Ollama LLM with rule-based fallback. Free QR code generation. Fully self-contained.

---

## License

[Apache 2.0](./LICENSE)

---

<p align="center">
  Built with <a href="https://wdk.tether.io">Tether WDK</a> for Tether Hackathon Galactica: WDK Edition 1
</p>
