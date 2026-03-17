<p align="center">
  <h1 align="center">⚡ TipFlow</h1>
  <p align="center"><strong>AI-Powered Multi-Chain Tipping Agent</strong></p>
  <p align="center"><em>Built for <a href="https://dorahacks.io/hackathon/tether-wdk-hackathon">Tether Hackathon Galactica: WDK Edition 1</a></em></p>
  <p align="center">
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
    <img src="https://img.shields.io/badge/Tether-WDK-009393?logo=tether&logoColor=white" alt="Tether WDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Track-Tipping%20Bot-ff6b6b" alt="Track: Tipping Bot" />
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Endpoints-86-blueviolet" alt="86 API Endpoints" />
    <img src="https://img.shields.io/badge/Components-69-orange" alt="69 React Components" />
    <img src="https://img.shields.io/badge/Services-15-green" alt="15 Agent Services" />
    <img src="https://img.shields.io/badge/Budget-%240-red" alt="$0 Budget" />
  </p>
</p>

---

## What is TipFlow?

TipFlow is an **autonomous AI agent** that makes sending crypto tips across blockchains as simple as typing a sentence. Say **"send 0.01 ETH to 0xabc..."** — the agent parses your intent, analyzes chains, compares fees, executes the transaction via **Tether WDK**, verifies it on-chain, and reports back. All through a polished dashboard with 69 components.

**Key highlights:**
- 🧠 **6-step AI pipeline** — INTAKE → ANALYZE → REASON → EXECUTE → VERIFY → REPORT
- ⛓️ **Multi-chain** — Ethereum Sepolia + TON Testnet with intelligent chain selection
- 🎤 **Voice commands** — Speak your tips via Web Speech API
- 💬 **Chat interface** — Conversational AI that understands tip intents, balance queries, and fee comparisons
- 📊 **86 API endpoints** — Full REST + SSE real-time streaming
- 🎮 **Gamification** — Achievements, leaderboard, challenges, tip goals, streaks
- 🤖 **Autonomous tipping** — Scheduled, recurring, conditional, batch, and split tips
- 🌍 **5 languages** — EN/ES/FR/AR/ZH with RTL support
- 🐳 **One-command startup** — `docker-compose up` and you're running
- 💰 **$0 budget** — Zero paid APIs, everything runs locally

[▶️ Watch Demo Video](https://youtube.com/watch?v=YOUR_DEMO_ID)

---

## Quick Start

### Prerequisites

- **Node.js 22+** — [download](https://nodejs.org/)
- **Ollama** (optional, for AI reasoning) — [download](https://ollama.ai/)

### Option 1: Local Development

```bash
# Clone the repo
git clone https://github.com/agdanish/tipflow.git
cd tipflow

# Install dependencies
cd agent && npm install && cd ../dashboard && npm install && cd ..

# (Optional) Pull the AI model
ollama pull phi3:mini

# Configure environment
cp agent/.env.example agent/.env

# Start everything (agent + dashboard)
npm run dev
```

- Dashboard: **http://localhost:5173**
- Agent API: **http://localhost:3001**

### Option 2: Docker (One Command)

```bash
docker-compose up
```

Open **http://localhost:3001** — serves both the dashboard and API.

### Getting Testnet Funds

1. Copy your wallet address from the TipFlow dashboard (or the Demo Banner)
2. **Sepolia ETH** — [Chainlink Faucet](https://faucets.chain.link/sepolia) or [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
3. **TON Testnet** — [TON Faucet](https://testnet.toncenter.com)
4. Start tipping!

---

## Architecture

```
+------------------------------------------------------------+
|                    React Dashboard (69 Components)          |
|              React 19 + Vite 8 + Tailwind CSS 4            |
|                                                            |
|  Tipping: Single · Batch · Split · Scheduled · Conditional |
|  AI Chat: NLP · Voice · Decision Tree · Personality        |
|  Analytics: SVG Charts · Heatmap · Streaks · Leaderboard   |
|  Wallet: Multi-chain · HD Derivation · QR · Backup         |
|  UX: Onboarding · i18n (5 langs) · PWA · Keyboard · Touch  |
|  Data: Export (CSV/JSON/MD) · Templates · Contacts · Tags  |
+----------------------------+-------------------------------+
                             | REST API (86 endpoints) + SSE
+----------------------------+-------------------------------+
|              Node.js Agent Server (15 Services)            |
|                                                            |
|   +--------------------------------------------------+    |
|   |           TipFlow Agent Pipeline                  |    |
|   |                                                   |    |
|   |  1. INTAKE   → Validate + Sanitize input          |    |
|   |  2. ANALYZE  → Balances + Fees + Gas comparison   |    |
|   |  3. REASON   → AI (Ollama) / Rules + Scoring      |    |
|   |  4. EXECUTE  → WDK Send + Retry + Gasless         |    |
|   |  5. VERIFY   → On-chain confirmation polling      |    |
|   |  6. REPORT   → Dashboard + Webhooks + Telegram    |    |
|   +--------------------------------------------------+    |
|                                                            |
|  Services: Wallet · AI · ENS · Contacts · Templates       |
|  Conditions · Challenges · Goals · Limits · Personality    |
|  Export · Retry · Tags · Telegram · Webhooks               |
|                                                            |
|  Middleware: Rate Limiting · Validation · Audit Logging    |
+----------------------------+-------------------------------+
                             |
           +-----------------+------------------+
           |                 |                  |
     +-----+------+   +-----+-----+   +-------+------+
     | Ethereum   |   | TON       |   | ERC-4337     |
     | (Sepolia)  |   | (Testnet) |   | (Gasless)    |
     +------------+   +-----------+   +--------------+
```

---

## WDK Integration

TipFlow deeply integrates Tether WDK as its core wallet infrastructure. **Every transaction flows through WDK — zero mocked calls.**

| WDK Feature | Package | Method(s) | Where Used |
|-------------|---------|-----------|------------|
| Seed generation | `@tetherto/wdk` | `WDK.getRandomSeedPhrase()` | First-run wallet creation |
| Wallet orchestration | `@tetherto/wdk` | `new WDK(seed)`, `registerWallet()` | Multi-chain wallet setup |
| EVM wallet | `@tetherto/wdk-wallet-evm` | `getAccount()`, `getAddress()` | Ethereum operations |
| TON wallet | `@tetherto/wdk-wallet-ton` | `getAccount()`, `getAddress()` | TON operations |
| Balance queries | Both wallet modules | `getBalance()`, `getTokenBalance()` | Chain analysis + dashboard |
| Fee estimation | Both wallet modules | `quoteSendTransaction()` | Cross-chain fee comparison |
| Native transfers | Both wallet modules | `sendTransaction()` | ETH/TON tip execution |
| USDT transfers | `@tetherto/wdk-wallet-evm` | `transfer()` | ERC-20 token sends |
| Fee rate queries | `@tetherto/wdk` | `getFeeRates()` | Real-time gas monitoring |
| HD derivation | `@tetherto/wdk-wallet-evm` | Derivation path indexing | Multi-wallet support |
| Gasless (ERC-4337) | `@tetherto/wdk-wallet-evm-erc-4337` | Account abstraction | Zero-fee tipping |
| TON gasless | `@tetherto/wdk-wallet-ton-gasless` | Gasless sends | Zero-fee TON tipping |
| Resource cleanup | `@tetherto/wdk` | `dispose()` | Graceful shutdown |

---

## Features (70+)

### 🧠 Agent Intelligence

| Feature | Description |
|---------|-------------|
| **6-Step Decision Pipeline** | Autonomous: INTAKE → ANALYZE → REASON → EXECUTE → VERIFY → REPORT |
| **Natural Language Processing** | Type "send 0.01 ETH to 0x..." — the agent parses and executes |
| **Conversational Chat** | Chat with the agent about balances, fees, history, or execute tips |
| **Intent Detection** | Detects: tip, balance, fees, address, help, history intents |
| **Decision Tree Visualization** | Interactive SVG visualization of agent reasoning |
| **5 Personalities** | Professional, Friendly, Pirate, Emoji, Minimal — each with unique responses |
| **LLM + Fallback** | Ollama (phi3:mini) when available, regex NLP when not |
| **Voice Commands** | Microphone input via Web Speech API with live transcript |

### 💸 Tipping Capabilities

| Feature | Description |
|---------|-------------|
| **Single Tips** | Send ETH/TON or USDT to any address |
| **Batch Tipping** | Tip up to 10 recipients in one operation |
| **Split Tipping** | Divide amount among up to 5 recipients by percentage |
| **Scheduled Tips** | Schedule one-time or recurring (daily/weekly/monthly) tips |
| **Conditional Tips** | Auto-tip when gas_below, balance_above, or time_of_day conditions are met |
| **Tip Templates** | Save and reuse frequently-sent configurations |
| **Gasless Tips (ERC-4337)** | Zero gas fees via Account Abstraction |
| **USDT ERC-20 Transfers** | Token transfers via WDK `transfer()` |
| **Tip Links** | Shareable pre-filled tip URLs |
| **Transaction Retry** | Automatic retry with exponential backoff |
| **Tip Receipts** | Structured receipts with receipt ID, block number, fees |
| **Spending Limits** | Configurable daily/weekly/per-tip spending limits |

### ⛓️ Multi-Chain & Wallet

| Feature | Description |
|---------|-------------|
| **Multi-Chain** | Ethereum Sepolia + TON Testnet with intelligent chain selection |
| **HD Wallet Derivation** | Multiple wallets from a single seed phrase |
| **Wallet Switcher** | Switch between derived addresses for sending |
| **On-Chain Verification** | Polls for transaction receipts with block confirmation |
| **Real-Time Gas** | Live gas prices with low/medium/high indicators |
| **Gas Speed Selector** | Slow/normal/fast with estimated fees and times |
| **Fee Optimization** | Cross-chain comparison to find cheapest route |
| **QR Receive** | QR codes for wallet addresses |
| **Wallet Backup** | View and copy seed phrase securely |
| **Network Health** | Real-time RPC connectivity with latency |
| **ENS Resolution** | Resolve .eth names to addresses with caching |

### 🎮 Analytics & Gamification

| Feature | Description |
|---------|-------------|
| **Stats Dashboard** | Chain distribution, totals, daily trends |
| **Advanced Analytics** | SVG bar charts, cumulative volume, hourly heatmap, top recipients |
| **Tip Streaks** | Current and longest consecutive tipping day streaks |
| **Trend Detection** | Up/down/stable trend analysis |
| **Leaderboard** | Top recipients ranked by volume |
| **Achievements** | Unlock badges for milestones |
| **Daily Challenges** | Gamified daily/weekly tipping challenges |
| **Tip Goals** | Fundraising goals with progress tracking |
| **Tip Calendar** | Heatmap calendar of tipping activity |
| **Chain Comparison** | Side-by-side chain analytics |
| **Tip Reports** | Generated summary reports |

### 🔔 Notifications & Integrations

| Feature | Description |
|---------|-------------|
| **Toast Notifications** | Success/error/info with auto-dismiss |
| **Notification Center** | Persistent inbox with mark-read/clear-all |
| **Notification Sounds** | Web Audio API oscillator sounds |
| **Browser Notifications** | Native push notifications |
| **Webhooks** | HTTP callbacks for tip events |
| **Telegram Bot** | 7 bot commands for tip notifications |
| **SSE Activity Feed** | Real-time dual streams (pipeline + activity) |

### 🔒 Security & Reliability

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Per-endpoint rate limiting |
| **Input Validation** | Sanitization middleware on all inputs |
| **Audit Logging** | Winston structured logging |
| **Security Status** | Dashboard security indicator |
| **Self-Custodial** | All keys stay local |
| **Address Tags** | Color-coded address tagging |

### 🎨 UX & UI

| Feature | Description |
|---------|-------------|
| **Dark/Light Theme** | Toggle with persistence |
| **Custom Theme Colors** | Accent color picker |
| **Mobile Responsive** | Full mobile layout with navigation |
| **PWA** | Installable Progressive Web App |
| **Keyboard Shortcuts** | Power-user shortcuts |
| **Guided Onboarding** | Interactive first-visit tour |
| **Loading Skeletons** | Shimmer loading states |
| **Empty States** | Friendly empty illustrations |
| **i18n (5 Languages)** | EN/ES/FR/AR/ZH with RTL support |
| **Touch Gestures** | Swipe navigation on mobile |
| **Clipboard Paste** | Paste addresses from clipboard |
| **QR Scanner** | Camera-based QR code scanning |
| **Demo Banner** | Testnet info + faucet links for judges |

### 📦 Export & Data

| Feature | Description |
|---------|-------------|
| **CSV/JSON/Markdown/Summary Export** | Multi-format tip history export |
| **History Filtering** | Search, chain, status, date range filters |
| **Currency Converter** | ETH/TON/USD conversion with live prices |
| **Contacts Manager** | Address book with groups + import/export |
| **Batch Import** | CSV batch import for contacts |

### 🛠️ DevOps & API

| Feature | Description |
|---------|-------------|
| **OpenAPI 3.0** | Auto-generated API spec at `/api/docs` |
| **In-App API Docs** | Interactive API documentation component |
| **Docker** | Multi-stage build + docker-compose |
| **System Info** | Runtime: uptime, Node version, WDK version, memory |
| **Tech Stack Display** | Visual technology showcase |
| **Error Boundary** | Graceful error recovery |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Lucide Icons, Custom SVG Charts |
| **Backend** | Node.js 22+, Express 5, TypeScript 5.9 |
| **Wallet SDK** | `@tetherto/wdk`, `wdk-wallet-evm`, `wdk-wallet-ton`, `wdk-wallet-evm-erc-4337`, `wdk-wallet-ton-gasless` |
| **AI** | Ollama (local LLM — phi3:mini) with rule-based regex fallback |
| **Blockchains** | Ethereum Sepolia, TON Testnet |
| **Real-Time** | Server-Sent Events (SSE) — dual streams |
| **Voice** | Web Speech API (SpeechRecognition) |
| **Audio** | Web Audio API (oscillator-based sounds) |
| **PWA** | Service Worker + Web App Manifest |
| **Containerization** | Docker multi-stage build + docker-compose |
| **Logging** | Winston structured logging with audit trail |
| **Security** | Rate limiting, input validation, audit logging |
| **Prices** | CoinGecko free API (no key needed) with static fallback |
| **ENS** | ethers.js for .eth name resolution |

---

## API Reference (86 Endpoints)

<details>
<summary><strong>System (8 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/docs` | OpenAPI 3.0 specification |
| `GET` | `/api/chains` | Supported chain configurations |
| `GET` | `/api/gas` | Real-time gas prices |
| `GET` | `/api/gas/speeds` | Gas speed options (slow/normal/fast) |
| `GET` | `/api/prices` | Live crypto prices (CoinGecko) |
| `GET` | `/api/network/health` | RPC connectivity check |
| `GET` | `/api/system/info` | Runtime system information |

</details>

<details>
<summary><strong>Wallet (7 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wallet/addresses` | All wallet addresses |
| `GET` | `/api/wallet/balances` | Native + USDT balances |
| `GET` | `/api/wallet/receive` | Wallet QR codes + explorer links |
| `GET` | `/api/wallet/seed` | Seed phrase display |
| `GET` | `/api/wallets` | List derived HD wallets |
| `GET` | `/api/wallets/:index` | Get wallet at derivation index |
| `POST` | `/api/wallets/active` | Set active wallet index |

</details>

<details>
<summary><strong>Tips (8 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip` | Execute a single tip |
| `POST` | `/api/tip/batch` | Batch tip up to 10 recipients |
| `POST` | `/api/tip/split` | Split tip by percentage |
| `POST` | `/api/tip/import` | Import and execute tips from bulk data |
| `POST` | `/api/tip/parse` | Parse NLP into structured tip data |
| `GET` | `/api/tip/estimate` | Estimate fees across chains |
| `GET` | `/api/tip/:id/receipt` | Generate structured receipt |
| `GET` | `/api/fees/compare` | Cross-chain fee comparison |

</details>

<details>
<summary><strong>Gasless ERC-4337 (2 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gasless/status` | Gasless availability check |
| `POST` | `/api/tip/gasless` | Send a zero-gas-fee tip |

</details>

<details>
<summary><strong>Scheduling (3 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tip/schedule` | Schedule a future/recurring tip |
| `GET` | `/api/tip/scheduled` | List scheduled tips |
| `DELETE` | `/api/tip/schedule/:id` | Cancel a scheduled tip |

</details>

<details>
<summary><strong>Agent (7 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agent/state` | Current pipeline state |
| `GET` | `/api/agent/events` | SSE real-time pipeline stream |
| `GET` | `/api/agent/history` | Tip history with filtering |
| `GET` | `/api/agent/history/export` | Export as CSV/JSON/MD/Summary |
| `GET` | `/api/agent/stats` | Analytics and statistics |
| `GET` | `/api/agent/analytics` | Advanced analytics |
| `GET` | `/api/tx/:hash/status` | On-chain confirmation status |

</details>

<details>
<summary><strong>Activity, Contacts, Templates, Conditions, Webhooks, Tip Links, Gamification, Chat, Settings, Telegram, ENS, Tags, Calendar, Goals, Limits, Audit, Demo (51 endpoints)</strong></summary>

See the full OpenAPI 3.0 spec at `/api/docs` when the server is running, or the in-app API documentation component.

</details>

---

## Judging Criteria Alignment

### 1. Agent Intelligence ⭐

- 6-step autonomous decision pipeline
- LLM reasoning with Ollama + robust regex fallback
- Intent detection (tip, balance, fees, address, help, history)
- Conversational chat that understands context
- Voice commands via Web Speech API
- 5-personality system with unique response styles
- Decision tree visualization for transparent reasoning
- NLP parsing with confidence scoring

### 2. WDK Wallet Integration ⭐

- 13+ WDK methods used across the full API surface
- Seed generation, multi-chain management, HD derivation
- Balance queries, fee estimation, native + USDT transfers
- ERC-4337 Account Abstraction (gasless tipping)
- TON gasless support
- Real-time fee rate queries for gas monitoring
- On-chain verification with block confirmation
- Graceful `dispose()` on shutdown

### 3. Technical Execution ⭐

- Full-stack TypeScript with 100+ typed interfaces
- 86 REST/SSE API endpoints across 14 categories
- 69 React components, 15 backend services, 5 custom hooks
- Real testnet transactions (Ethereum Sepolia + TON Testnet)
- Dual SSE streams for real-time updates
- OpenAPI 3.0 specification
- Express 5 + rate limiting + validation + audit logging
- Docker multi-stage build + docker-compose
- PWA with service worker and offline support
- 55 automated tests (validation, agent, API)

### 4. Agentic Payment Design ⭐

- Fully autonomous pipeline: analyze → reason → execute → verify
- Scheduled tips run without human intervention
- Conditional tips auto-trigger on gas/balance/time conditions
- Batch orchestrates up to 10 transactions
- Split divides amounts by percentage
- Cross-chain fee optimizer selects cheapest route
- Transaction retry with exponential backoff
- Webhook notifications to external systems
- Tip links for one-click pre-filled tipping
- Spending limits with daily/weekly/per-tip enforcement

### 5. Originality ⭐

- Voice-to-tip via Web Speech API
- Conditional tipping engine (gas_below, balance_above, time_of_day)
- Split tipping with percentage allocation
- Shareable tip links
- Agent personality system (5 styles)
- SVG analytics with hourly heatmap and tip streaks
- Daily/weekly gamified challenges
- Fundraising tip goals with progress bars
- ENS resolution for human-readable addresses
- Internationalization (5 languages, RTL)

### 6. Polish & Ship-ability ⭐

- Dark/light theme with custom accent colors
- Mobile responsive with touch gestures
- PWA installable to home screen
- Audio notifications (Web Audio API oscillator)
- Keyboard shortcuts for power users
- Guided onboarding tour
- Loading skeletons and empty states
- Demo banner with faucet links for easy judge setup
- One-command Docker startup
- Multi-format export (CSV/JSON/MD/Summary)
- QR codes for receiving funds
- Network health monitoring

### 7. Presentation & Demo ⭐

- 69 polished React components
- Transparent decision tree for every tip
- Real-time SSE activity feed
- Interactive API documentation built into dashboard
- System info and tech stack panels
- Comprehensive README with architecture diagram

---

## Zero Budget

No paid APIs. No cloud services. Everything runs locally.

| Need | Solution | Cost |
|------|----------|------|
| AI | Local Ollama LLM + regex fallback | $0 |
| Prices | CoinGecko free API (no key) | $0 |
| RPC | Public endpoints (publicnode.com, toncenter.com) | $0 |
| QR Codes | qrserver.com API | $0 |
| Charts | Custom SVG (no charting library) | $0 |
| Sounds | Web Audio API oscillator | $0 |
| Voice | Web Speech API (built into browsers) | $0 |
| Hosting | Runs on localhost or Docker | $0 |

---

## Project Structure

```
tipflow/
├── agent/                          # Node.js agent server
│   └── src/
│       ├── core/agent.ts           # 6-step pipeline + scheduler + conditions
│       ├── services/               # 15 services
│       │   ├── wallet.service.ts   # WDK operations + HD derivation + gasless
│       │   ├── ai.service.ts       # Ollama LLM + NLP + intent detection
│       │   ├── ens.service.ts      # ENS resolution with caching
│       │   ├── telegram.service.ts # Telegram bot (7 commands)
│       │   ├── conditions.service.ts # Conditional tip engine
│       │   ├── challenges.service.ts # Daily/weekly challenges
│       │   ├── goals.service.ts    # Fundraising tip goals
│       │   ├── limits.service.ts   # Spending limits enforcement
│       │   ├── contacts.service.ts # Address book management
│       │   ├── templates.service.ts # Tip template persistence
│       │   ├── webhooks.service.ts # Webhook event system
│       │   ├── personality.service.ts # 5 agent personalities
│       │   ├── export.service.ts   # Multi-format export
│       │   ├── retry.service.ts    # Transaction retry logic
│       │   └── tags.service.ts     # Address tagging
│       ├── middleware/
│       │   ├── rateLimit.ts        # Rate limiting
│       │   └── validate.ts         # Input validation + audit
│       ├── routes/
│       │   ├── api.ts              # 86 REST + SSE endpoints
│       │   └── openapi.ts          # OpenAPI 3.0 spec
│       ├── __tests__/              # 51 automated tests
│       └── index.ts                # Express 5 entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/             # 69 React components
│       ├── hooks/                  # 5 custom hooks
│       ├── lib/                    # API client, i18n, sounds, utils
│       └── types/                  # 60+ TypeScript interfaces
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # One-command startup
├── package.json                    # Root orchestrator
├── LICENSE                         # Apache 2.0
└── README.md
```

---

## Environment Variables

```bash
# Required
SEED_PHRASE=your twelve word seed phrase here

# Optional
OLLAMA_URL=http://localhost:11434          # AI reasoning
TELEGRAM_BOT_TOKEN=your_token             # Telegram bot
ERC4337_BUNDLER_URL=https://...           # Gasless (Pimlico)
ERC4337_PAYMASTER_URL=https://...         # Gasless (Pimlico)
ETH_MAINNET_RPC=https://cloudflare-eth.com  # ENS resolution
```

See `agent/.env.example` for the full template.

---

## Tests

```bash
cd agent && npm test
```

55 tests across 3 test suites: validation (31), agent (15), API (9).

---

## License

[Apache 2.0](./LICENSE) — Copyright 2026 Danish A

---

<p align="center">
  Built with ❤️ and <a href="https://wdk.tether.io">Tether WDK</a> for <a href="https://dorahacks.io/hackathon/tether-wdk-hackathon">Tether Hackathon Galactica: WDK Edition 1</a>
</p>
