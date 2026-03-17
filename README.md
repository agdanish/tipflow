<p align="center">
  <h1 align="center">TipFlow</h1>
  <p align="center"><strong>AI-Powered Multi-Chain Tipping Agent</strong></p>
  <p align="center">
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
    <img src="https://img.shields.io/badge/Tether-WDK-009393?logo=tether&logoColor=white" alt="Tether WDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Track-Tipping%20Bot-ff6b6b" alt="Track: Tipping Bot" />
    <img src="https://img.shields.io/badge/Endpoints-61-blueviolet" alt="61 API Endpoints" />
    <img src="https://img.shields.io/badge/Components-45-orange" alt="45 React Components" />
  </p>
</p>

---

## What is TipFlow?

TipFlow is an **autonomous AI agent** that eliminates the complexity of sending crypto tips across multiple blockchains. Tell it what you want in plain English -- "send 0.01 ETH to 0x..." -- and the agent analyzes chains, selects the optimal route, executes the transaction via **Tether WDK**, and confirms it on-chain.

It features a conversational chat interface, voice commands, conditional tips that trigger on gas prices or balances, split/batch tipping, recurring scheduled tips, a full analytics dashboard with SVG charts and heatmaps, webhook integrations, Telegram bot support, and a PWA-ready mobile experience -- all built with zero budget and zero paid APIs.

[Watch Demo](https://youtube.com/watch?v=YOUR_DEMO_ID)

---

## Features (55+)

### Agent Intelligence

| Feature | Description |
|---------|-------------|
| **6-Step Decision Pipeline** | Autonomous pipeline: INTAKE, ANALYZE, REASON, EXECUTE, VERIFY, REPORT |
| **Natural Language Processing** | Type "send 0.01 ETH to 0x..." -- the agent parses, fills the form, and executes |
| **Conversational Chat Interface** | Full chat with the agent -- ask about balances, fees, history, or execute tips via conversation |
| **Intent Detection** | Detects intents: tip, balance, fees, address, help, history, unknown |
| **Decision Tree Visualization** | See the agent's reasoning rendered as an interactive SVG decision tree |
| **Agent Personality System** | 5 personalities: Professional, Friendly, Pirate, Emoji, Minimal -- each with unique message templates |
| **LLM + Rule-Based Fallback** | Ollama (phi3:mini) when available, regex-based NLP fallback when not |
| **Voice Commands** | Speak your tip commands via Web Speech API -- microphone button with live transcript |

### Tipping Capabilities

| Feature | Description |
|---------|-------------|
| **Single Tips** | Send native ETH/TON or USDT to any address with one click or chat message |
| **Batch Tipping** | Tip up to 10 recipients in a single operation with per-recipient amounts |
| **Split Tipping** | Divide a total amount among up to 5 recipients by percentage allocation |
| **Scheduled Tips** | Schedule tips for future autonomous execution with background scheduler |
| **Recurring Tips** | Set up daily, weekly, or monthly recurring tips that auto-execute |
| **Conditional Tips** | Auto-tip when conditions are met: gas below threshold, balance above target, time-of-day window, price change |
| **Tip Templates** | Save and reuse frequently-sent tip configurations |
| **Gasless Tips (ERC-4337)** | Zero-gas-fee tipping via Account Abstraction with paymaster/bundler support |
| **USDT ERC-20 Transfers** | ERC-20 USDT token transfers via WDK `transfer()` method |
| **Tip Links** | Create shareable pre-filled tip URLs -- recipients open the link and the form is pre-populated |
| **Transaction Retry** | Automatic retry logic for failed transactions with configurable attempts |
| **Tip Receipts** | Generate structured receipts for completed tips (receipt ID, block number, fees) |

### Multi-Chain & Wallet

| Feature | Description |
|---------|-------------|
| **Multi-Chain Support** | Ethereum Sepolia + TON Testnet with intelligent chain selection |
| **HD Wallet Derivation** | Multiple derived wallets from a single seed phrase with index-based selection |
| **Wallet Switcher** | Switch between derived wallet addresses for sending |
| **On-Chain Verification** | Polls for transaction receipts -- confirms block number and gas used |
| **Real-Time Gas Monitoring** | Live gas prices across all chains with low/medium/high status indicators |
| **Gas Speed Selector** | Choose slow/normal/fast transaction speed with estimated fees and confirmation times |
| **Fee Optimization** | Cross-chain fee comparison to automatically select the cheapest route |
| **QR Code Wallet Receive** | Generate QR codes for your wallet addresses to receive funds |
| **Wallet Backup** | View and securely copy seed phrase with transaction count tracking |
| **Network Health Monitor** | Real-time RPC connectivity checks with latency measurement and block number display |
| **Seed Phrase Management** | Persistent seed with WDK -- wallet state survives restarts |

### Analytics & Gamification

| Feature | Description |
|---------|-------------|
| **Real-Time Stats Dashboard** | Live stats with chain distribution, tip totals, and daily trend charts |
| **Advanced Analytics Dashboard** | SVG bar charts, cumulative volume, hourly heatmap, top recipients, token/chain distribution |
| **Tip Streaks** | Track current and longest consecutive tipping day streaks |
| **Trend Detection** | Automatic up/down/stable trend analysis comparing weekly activity |
| **Leaderboard** | Top tip recipients ranked by total tips received and volume |
| **Achievements** | Unlock badges for milestones: first tip, batch tips, multi-chain usage, NLP, fee optimizer, and more |
| **Transaction Timeline** | Visual timeline of all transactions with status indicators |

### Notifications & Integrations

| Feature | Description |
|---------|-------------|
| **In-App Toast Notifications** | Success/error/info toast messages with auto-dismiss |
| **Notification Center** | Persistent notification inbox with mark-read, mark-all-read, and clear-all |
| **Notification Sounds** | Audio feedback on tip success/failure/notification with toggle control |
| **Browser Notifications** | Native browser push notifications for tip events |
| **Webhook System** | Register webhook URLs to receive HTTP callbacks for tip.sent, tip.failed, tip.scheduled, condition.triggered |
| **Webhook Testing** | Send test events to all registered webhooks |
| **Telegram Bot** | Telegram bot integration for receiving tip notifications |
| **SSE Activity Feed** | Real-time Server-Sent Events stream for live pipeline and activity updates |

### Security & Reliability

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Transaction-level rate limiting to prevent abuse |
| **Input Validation** | Express middleware for tip, batch tip, and chat input sanitization |
| **Audit Logging** | All API requests logged with structured Winston logging |
| **Security Status Panel** | Dashboard component showing security feature status |
| **Self-Custodial** | All keys stay local -- no third-party custody |
| **Auto-Confirm Threshold** | Configurable threshold below which tips auto-confirm without prompt |

### UX & UI

| Feature | Description |
|---------|-------------|
| **Dark / Light Theme** | Toggle with localStorage persistence and Tailwind CSS 4 |
| **Custom Theme System** | Settings panel with theme, sound, and notification preferences |
| **Mobile Responsive** | Full functionality on any screen size with mobile navigation |
| **PWA Support** | Progressive Web App with install prompt for home screen |
| **Keyboard Shortcuts** | Power-user shortcuts: submit tips, toggle modes, switch themes, show help |
| **Guided Onboarding Tour** | First-visit interactive walkthrough highlighting key features |
| **Loading Skeletons** | Shimmer loading states for all async data |
| **Empty States** | Friendly empty state illustrations when no data exists |
| **Skip to Content** | Accessibility-first with skip-to-main-content link |
| **Share Card** | Social sharing overlay after successful tips |

### Export & Data

| Feature | Description |
|---------|-------------|
| **CSV Export** | Export full tip history as CSV |
| **JSON Export** | Export tip history as structured JSON |
| **Markdown Export** | Export tip history as formatted Markdown table |
| **Summary Export** | Generate a plain-text summary report of all tipping activity |
| **History Filtering** | Filter tip history by search, chain, status, and date range |
| **Currency Converter** | Convert between ETH, TON, and USD with approximate price data |

### DevOps & API

| Feature | Description |
|---------|-------------|
| **OpenAPI 3.0 Spec** | Auto-generated API documentation at `/api/docs` |
| **In-App API Docs** | Interactive API documentation component in the dashboard |
| **Docker Support** | Multi-stage Dockerfile + docker-compose for one-command startup |
| **System Info Panel** | Runtime info: uptime, Node.js version, WDK version, memory usage, endpoint count |
| **Tech Stack Display** | Visual tech stack component showing all technologies used |
| **Footer** | Branded footer with hackathon attribution |

---

## Architecture

```
+----------------------------------------------------+
|                React Dashboard                      |
|            (React 19 + Vite 8 + Tailwind CSS 4)    |
|                                                    |
|  45 Components:                                    |
|  Wallet View . Tip Form . NLP Chat . Voice Input   |
|  Batch Tips . Split Tips . Scheduler . Templates   |
|  Gas Monitor . Speed Selector . Converter . QR     |
|  Leaderboard . Achievements . Activity Feed        |
|  Decision Tree . Analytics Dashboard . Timeline    |
|  Settings . Webhook Manager . Conditional Tips     |
|  Network Health . Telegram Status . Wallet Backup  |
|  Tip Links . Share Card . Export Panel . API Docs  |
|  Security Status . System Info . Tech Stack        |
|  Install Prompt (PWA) . Onboarding Tour            |
+------------------------+---------------------------+
                         | REST API (61 endpoints) + SSE
+------------------------+---------------------------+
|           Node.js Agent Server                     |
|                                                    |
|   +------------------------------------------+    |
|   |       TipFlow Agent Pipeline             |    |
|   |                                          |    |
|   |  1. INTAKE   --> Validate + Sanitize     |    |
|   |  2. ANALYZE  --> Balances + Fees + Gas   |    |
|   |  3. REASON   --> AI / Rules + Scoring    |    |
|   |  4. EXECUTE  --> WDK Send + Retry        |    |
|   |  5. VERIFY   --> On-chain Confirmation   |    |
|   |  6. REPORT   --> Dashboard + Webhooks    |    |
|   +------------------------------------------+    |
|     |          |           |          |           |
|  +--+---+  +--+----+  +---+------+  +-+------+  |
|  |Ollama|  |Tether |  |Scheduler |  |Webhook |  |
|  |(LLM) |  | WDK   |  |+ Conds.  |  |+ Tgram |  |
|  +------+  +--+----+  +----------+  +--------+  |
|               |                                   |
|  Services: Contacts, Templates, Export,           |
|  Personality, Webhooks, Rate Limit, Validation    |
+---------------+-----------------------------------+
                |
   +------------+---------------+
   |            |               |
+--+------+ +--+-----+ +------+------+
|Ethereum | | TON    | | ERC-4337   |
|(Sepolia)| |(Testnet)| | (Gasless)  |
+---------+ +--------+ +-----------+
```

---

## WDK Integration

TipFlow uses the Tether WDK as its core wallet infrastructure. Every transaction flows through WDK -- no mocked calls.

| WDK Feature | Package | Method(s) | Where Used |
|-------------|---------|-----------|------------|
| Seed phrase generation | `@tetherto/wdk` | `WDK.getRandomSeedPhrase()` | `wallet.service.ts` -- first-run wallet creation |
| Wallet orchestration | `@tetherto/wdk` | `new WDK(seed)`, `registerWallet()` | `wallet.service.ts` -- multi-chain wallet setup |
| EVM wallet | `@tetherto/wdk-wallet-evm` | `getAccount()`, `getAddress()` | `wallet.service.ts` -- Ethereum operations |
| TON wallet | `@tetherto/wdk-wallet-ton` | `getAccount()`, `getAddress()` | `wallet.service.ts` -- TON operations |
| Balance queries | Both wallet modules | `getBalance()`, `getTokenBalance()` | Chain analysis + dashboard display |
| Fee estimation | Both wallet modules | `quoteSendTransaction()` | Agent ANALYZE step -- cross-chain fee comparison |
| Native transfers | Both wallet modules | `sendTransaction()` | Agent EXECUTE step -- ETH/TON sends |
| USDT transfers | `@tetherto/wdk-wallet-evm` | `transfer()` | Agent EXECUTE step -- ERC-20 token sends |
| Fee rate queries | `@tetherto/wdk` | `getFeeRates()` | Real-time gas price monitoring |
| HD derivation | `@tetherto/wdk-wallet-evm` | Derivation path indexing | Multi-wallet support |
| Gasless (ERC-4337) | `@tetherto/wdk-wallet-evm-erc-4337` | Account abstraction | Zero-fee tipping |
| TON gasless | `@tetherto/wdk-wallet-ton-gasless` | Gasless sends | Zero-fee TON tipping |
| Resource cleanup | `@tetherto/wdk` | `dispose()` | Graceful shutdown |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Lucide Icons, Custom SVG Charts |
| **Backend** | Node.js 22+, Express 5, TypeScript 5.9 |
| **Wallet SDK** | `@tetherto/wdk`, `wdk-wallet-evm`, `wdk-wallet-ton`, `wdk-wallet-evm-erc-4337`, `wdk-wallet-ton-gasless` |
| **AI Engine** | Ollama (local LLM -- phi3:mini) with rule-based regex fallback |
| **Blockchains** | Ethereum Sepolia, TON Testnet |
| **Real-Time** | Server-Sent Events (SSE) -- dual streams for agent pipeline + activity feed |
| **Voice** | Web Speech API (SpeechRecognition) |
| **Audio** | Web Audio API (oscillator-based notification sounds) |
| **PWA** | Service worker + manifest for installable app |
| **Containerization** | Docker multi-stage build + docker-compose |
| **Logging** | Winston structured logging with audit trail |
| **Security** | express-rate-limit, input validation middleware, audit logging |

---

## Quick Start

### Prerequisites

- **Node.js 22+** -- [download](https://nodejs.org/)
- **Ollama** (optional) -- [download](https://ollama.ai/) for AI-powered chain reasoning

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

Open **http://localhost:3001** -- the agent serves the dashboard and API together.

### Getting Testnet Funds

1. Copy your wallet addresses from the TipFlow dashboard
2. **Sepolia ETH** -- Use a Sepolia faucet (Google Cloud, Alchemy, etc.)
3. **TON Testnet** -- Visit [testnet.toncenter.com](https://testnet.toncenter.com)
4. Send real tips once funded

---

## API Reference (61 Endpoints)

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check (agent status, AI mode, chains) |
| `GET` | `/api/docs` | OpenAPI 3.0 specification |
| `GET` | `/api/chains` | Supported chain configurations |
| `GET` | `/api/gas` | Real-time gas prices across all chains |
| `GET` | `/api/gas/speeds` | Gas speed options (slow/normal/fast) with estimated fees and times |
| `GET` | `/api/prices` | Approximate crypto prices for currency conversion |
| `GET` | `/api/network/health` | RPC connectivity check with latency and block numbers |
| `GET` | `/api/system/info` | Runtime info: uptime, Node.js version, WDK version, memory, endpoints |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wallet/addresses` | All wallet addresses across chains |
| `GET` | `/api/wallet/balances` | Native + USDT balances for all wallets |
| `GET` | `/api/wallet/receive` | Wallet addresses with QR code URLs and explorer links |
| `GET` | `/api/wallet/seed` | Seed phrase (for demo/setup display) |
| `GET` | `/api/wallets` | List multiple derived HD wallets for a chain |
| `GET` | `/api/wallets/:index` | Get wallet at a specific derivation index |
| `POST` | `/api/wallets/active` | Set the active wallet index for sending |

### Tips

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip` | Execute a single tip (native or USDT) |
| `POST` | `/api/tip/batch` | Batch tip up to 10 recipients |
| `POST` | `/api/tip/split` | Split tip among up to 5 recipients by percentage |
| `POST` | `/api/tip/parse` | Parse natural language into structured tip data |
| `GET` | `/api/tip/estimate` | Estimate fees across all chains |
| `GET` | `/api/tip/:id/receipt` | Generate a structured receipt for a completed tip |
| `GET` | `/api/fees/compare` | Cross-chain fee comparison with savings recommendation |

### Gasless (ERC-4337)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gasless/status` | Check gasless availability and configuration |
| `POST` | `/api/tip/gasless` | Send a gasless tip (zero gas fees via Account Abstraction) |

### Scheduling

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip/schedule` | Schedule a future tip (one-time or recurring daily/weekly/monthly) |
| `GET` | `/api/tip/scheduled` | List all scheduled tips |
| `DELETE` | `/api/tip/schedule/:id` | Cancel a scheduled tip |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agent/state` | Current agent pipeline state |
| `GET` | `/api/agent/events` | SSE stream -- real-time agent pipeline updates |
| `GET` | `/api/agent/history` | Tip history with search, chain, status, and date filtering |
| `GET` | `/api/agent/history/export` | Export history as CSV, JSON, Markdown, or Summary |
| `GET` | `/api/agent/stats` | Analytics (totals, chain distribution, daily trends) |
| `GET` | `/api/agent/analytics` | Advanced analytics: heatmap, streaks, trends, cumulative data, top recipients |
| `GET` | `/api/tx/:hash/status` | On-chain transaction confirmation status |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity` | Recent activity log |
| `GET` | `/api/activity/stream` | SSE stream -- real-time activity events |

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

### Conditional Tips

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conditions` | List all conditions |
| `POST` | `/api/conditions` | Create a condition (gas_below, balance_above, time_of_day, price_change) |
| `DELETE` | `/api/conditions/:id` | Cancel a condition |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/webhooks` | List registered webhooks |
| `POST` | `/api/webhooks` | Register a new webhook (tip.sent, tip.failed, tip.scheduled, condition.triggered) |
| `DELETE` | `/api/webhooks/:id` | Unregister a webhook |
| `POST` | `/api/webhooks/test` | Send a test event to all webhooks |

### Tip Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tiplinks` | Create a shareable tip link |
| `GET` | `/api/tiplinks` | List all tip links |
| `GET` | `/api/tiplinks/:id` | Get a single tip link by ID |
| `DELETE` | `/api/tiplinks/:id` | Delete a tip link |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leaderboard` | Top tip recipients leaderboard |
| `GET` | `/api/achievements` | Achievement progress and unlocked badges |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Conversational chat -- send tips, check balances, compare fees via natural language |

### Settings & Personality

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get current agent settings |
| `PUT` | `/api/settings` | Update settings (personality, default chain/token, auto-confirm, notifications) |
| `GET` | `/api/personality` | Get available personalities and active one |
| `PUT` | `/api/personality` | Set the active personality |

### Telegram

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/telegram/status` | Telegram bot connection status |

---

## Project Structure

```
tipflow/
├── agent/                          # Node.js agent server
│   └── src/
│       ├── core/agent.ts           # 6-step agent pipeline + scheduler + conditions + leaderboard + achievements
│       ├── services/
│       │   ├── wallet.service.ts   # WDK wallet operations + fee comparison + HD derivation + gasless
│       │   ├── ai.service.ts       # Ollama LLM + regex fallback + intent detection
│       │   ├── contacts.service.ts # Address book persistence
│       │   ├── templates.service.ts# Tip templates persistence
│       │   ├── webhooks.service.ts # Webhook registration and event firing
│       │   ├── personality.service.ts # Agent personality system (5 personalities)
│       │   └── export.service.ts   # CSV, JSON, Markdown, Summary export
│       ├── middleware/
│       │   ├── rateLimit.ts        # Transaction rate limiting
│       │   └── validate.ts         # Input validation + audit logging
│       ├── routes/
│       │   ├── api.ts              # 61 REST + SSE endpoints
│       │   └── openapi.ts          # OpenAPI 3.0 spec generator
│       ├── types/index.ts          # Shared TypeScript types (40+ interfaces)
│       ├── utils/logger.ts         # Winston structured logging
│       └── index.ts                # Entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/             # 45 React components
│       │   ├── TipForm.tsx         # NLP input + manual form + contacts + templates + voice
│       │   ├── BatchTipForm.tsx    # Multi-recipient batch tips
│       │   ├── SplitTipForm.tsx    # Percentage-based split tipping
│       │   ├── AgentPanel.tsx      # Real-time pipeline visualization
│       │   ├── WalletCard.tsx      # Balance display with copy
│       │   ├── WalletSwitcher.tsx  # HD wallet index switching
│       │   ├── WalletBackup.tsx    # Seed phrase backup display
│       │   ├── TipHistory.tsx      # Transaction log with explorer links + filtering
│       │   ├── StatsPanel.tsx      # Analytics charts
│       │   ├── AnalyticsDashboard.tsx # Advanced analytics: SVG charts, heatmap, trends, streaks
│       │   ├── TransactionTimeline.tsx # Visual transaction timeline
│       │   ├── GasMonitor.tsx      # Live gas prices across chains
│       │   ├── SpeedSelector.tsx   # Slow/Normal/Fast gas speed picker
│       │   ├── CurrencyConverter.tsx # ETH/TON/USD converter
│       │   ├── Leaderboard.tsx     # Top recipients ranking
│       │   ├── Achievements.tsx    # Milestone badges
│       │   ├── ActivityFeed.tsx    # SSE-powered live activity stream
│       │   ├── QRReceive.tsx       # QR codes for receiving funds
│       │   ├── DecisionTree.tsx    # Agent decision visualization
│       │   ├── TipTemplates.tsx    # Save/reuse tip templates
│       │   ├── TipLinkCreator.tsx  # Create shareable tip links
│       │   ├── TipReceipt.tsx      # Structured tip receipts
│       │   ├── ShareCard.tsx       # Social sharing overlay
│       │   ├── ChatInterface.tsx   # Conversational chat with the agent
│       │   ├── VoiceButton.tsx     # Microphone voice input (Web Speech API)
│       │   ├── ConditionalTips.tsx # Gas/balance/time condition management
│       │   ├── WebhookManager.tsx  # Webhook registration UI
│       │   ├── GaslessToggle.tsx   # ERC-4337 gasless toggle
│       │   ├── NetworkHealth.tsx   # RPC connectivity monitor
│       │   ├── SecurityStatus.tsx  # Security feature status display
│       │   ├── TelegramStatus.tsx  # Telegram bot connection status
│       │   ├── NotificationCenter.tsx # Persistent notification inbox
│       │   ├── ExportPanel.tsx     # Multi-format export controls
│       │   ├── SettingsPanel.tsx   # Theme, sound, notification settings
│       │   ├── ApiDocs.tsx         # Interactive API documentation
│       │   ├── SystemInfo.tsx      # Runtime system information
│       │   ├── TechStack.tsx       # Technology stack display
│       │   ├── InstallPrompt.tsx   # PWA install banner
│       │   ├── OnboardingOverlay.tsx # Guided first-visit tour
│       │   ├── KeyboardShortcutsModal.tsx # Shortcut reference
│       │   ├── Header.tsx          # Status bar, theme toggle, sound toggle, notifications
│       │   ├── Footer.tsx          # Branded footer
│       │   ├── Toast.tsx           # Notification system
│       │   ├── Skeleton.tsx        # Loading skeletons
│       │   └── EmptyState.tsx      # Empty state illustrations
│       ├── hooks/
│       │   ├── useApi.ts           # API polling hooks (health, balances, state, history, stats)
│       │   ├── useKeyboardShortcuts.ts # Keyboard shortcut bindings
│       │   └── useVoiceCommand.ts  # Web Speech API hook
│       ├── lib/
│       │   ├── api.ts              # API client with typed methods
│       │   ├── sounds.ts           # Web Audio API sound effects
│       │   ├── utils.ts            # Formatting utilities
│       │   └── i18n.ts             # Internationalization support
│       └── types/index.ts          # Frontend TypeScript types (60+ interfaces)
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command startup
├── package.json                    # Root orchestrator (concurrently)
├── LICENSE                         # Apache 2.0
└── README.md
```

---

## Screenshots

> Screenshots will be added before submission. The dashboard features:

| View | Description |
|------|-------------|
| **Main Dashboard** | Wallet cards, gas monitor, tip form, agent panel, and activity feed |
| **Chat Interface** | Floating chat bubble with conversational AI agent |
| **Analytics** | SVG bar charts, hourly heatmap, cumulative volume, trend indicators |
| **Batch & Split** | Multi-recipient tipping with percentage allocation |
| **Settings** | Personality selector, theme toggle, notification preferences |
| **Mobile View** | Responsive layout on phone-sized screens |

---

## Hackathon Track: Tipping Bot

TipFlow targets the **Tipping Bot** track. Here is how every feature maps to the 7 judging criteria:

### 1. Agent Intelligence

- 6-step autonomous decision pipeline (INTAKE, ANALYZE, REASON, EXECUTE, VERIFY, REPORT)
- LLM-powered chain reasoning with Ollama (phi3:mini) + regex fallback
- Intent detection system (tip, balance, fees, address, help, history)
- Conversational chat interface that understands context and executes actions
- Voice command input via Web Speech API
- 5-personality system (Professional, Friendly, Pirate, Emoji, Minimal)
- Decision tree visualization showing transparent agent reasoning
- NLP parsing with confidence scoring

### 2. WDK Wallet Integration

- Deep use of Tether WDK across 13+ methods
- Seed generation, multi-chain wallet management, HD derivation
- Balance queries, fee estimation, native transfers, ERC-20 USDT transfers
- Gasless ERC-4337 Account Abstraction support
- TON gasless tipping support
- Fee rate queries for real-time gas monitoring
- On-chain transaction verification with block confirmation
- Graceful resource cleanup with `dispose()`
- Persistent seed phrase across restarts

### 3. Technical Execution

- Full-stack TypeScript with 100+ typed interfaces
- 61 REST/SSE API endpoints
- 45 React components
- Real testnet transactions on Ethereum Sepolia and TON Testnet
- Dual SSE streams (agent pipeline + activity feed)
- OpenAPI 3.0 auto-generated specification
- Express 5 with middleware: rate limiting, validation, audit logging
- Winston structured logging
- Docker multi-stage build with docker-compose
- PWA with service worker and install prompt

### 4. Agentic Payment Design

- Autonomous pipeline that analyzes, reasons, executes, and verifies without human intervention
- Scheduled tips (daily/weekly/monthly) run in the background
- Conditional tips auto-execute when gas, balance, time, or price conditions are met
- Batch tipping orchestrates up to 10 transactions
- Split tipping divides amounts by percentage across recipients
- Cross-chain fee optimizer automatically selects the cheapest route
- Transaction retry with configurable attempts
- Webhook notifications to external systems on every tip event
- Tip links allow one-click pre-filled tipping via shareable URLs

### 5. Originality

- Voice-to-tip via Web Speech API
- Conditional tipping engine (gas_below, balance_above, time_of_day, price_change)
- Split tipping with percentage allocation
- Tip links (shareable pre-filled tip URLs)
- Agent personality system with 5 distinct response styles
- SVG-based analytics with hourly heatmap and tip streaks
- Share card for social sharing after tips
- Tip receipts with receipt IDs and block numbers
- HD wallet switcher for multi-address management

### 6. Polish & Ship-ability

- Dark/light theme with smooth transitions
- Mobile responsive with touch-friendly controls
- PWA installable to home screen
- Toast notifications with sounds (Web Audio API oscillator)
- Browser push notifications
- Keyboard shortcuts for power users
- Loading skeletons and empty states
- Guided onboarding tour for first-time users
- Error handling with friendly messages throughout
- One-command Docker startup
- CSV/JSON/Markdown/Summary export
- QR code generation for receiving funds
- Network health monitoring with latency display

### 7. Presentation & Demo

- 45 polished React components
- Transparent decision tree for every tip
- Real-time activity feed showing agent's thinking
- Interactive API documentation built into the dashboard
- System info panel showing runtime details
- Tech stack display component
- Comprehensive README with architecture diagram

---

## Zero Budget

No paid APIs. No cloud services. Everything runs locally.

- **AI**: Local Ollama LLM with rule-based fallback
- **QR Codes**: Free API (qrserver.com)
- **RPC**: Public endpoints (publicnode.com, toncenter.com)
- **Hosting**: Runs on localhost or any machine
- **Analytics**: Custom SVG charts (no charting library needed for analytics dashboard)
- **Sounds**: Web Audio API oscillator (no audio files)
- **Voice**: Web Speech API (built into browsers)

---

## License

[Apache 2.0](./LICENSE)

---

<p align="center">
  Built with <a href="https://wdk.tether.io">Tether WDK</a> for Tether Hackathon Galactica: WDK Edition 1
</p>
