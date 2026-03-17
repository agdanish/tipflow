<p align="center">
  <h1 align="center">TipFlow</h1>
  <p align="center"><strong>AI-Powered Tipping Agent for Rumble Creators</strong></p>
  <p align="center"><em>Built on <a href="https://wdk.tether.io">Tether WDK</a> — extending <a href="https://rumble.com">Rumble's</a> crypto tipping wallet with autonomous AI</em></p>
  <p align="center"><em>Submitted to <a href="https://dorahacks.io/hackathon/tether-wdk-hackathon">Tether Hackathon Galactica: WDK Edition 1</a></em></p>
  <p align="center">
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+" />
    <img src="https://img.shields.io/badge/Tether-WDK-009393?logo=tether&logoColor=white" alt="Tether WDK" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Track-Tipping%20Bot-ff6b6b" alt="Track: Tipping Bot" />
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Endpoints-115-blueviolet" alt="115 API Endpoints" />
    <img src="https://img.shields.io/badge/Components-71-orange" alt="71 React Components" />
    <img src="https://img.shields.io/badge/Services-17-green" alt="17 Agent Services" />
    <img src="https://img.shields.io/badge/Budget-%240-red" alt="$0 Budget" />
  </p>
</p>

---

## What is TipFlow?

**Track: Tipping Bot — Building AI-powered tipping enhancement for Rumble's WDK-based creator tipping wallet**

In January 2026, [Rumble](https://rumble.com) launched its crypto wallet powered by Tether WDK, enabling viewers to tip creators directly with USDT. TipFlow extends that foundation with an **autonomous AI agent** that makes tipping smarter, automatic, and community-driven.

TipFlow watches your viewing habits, learns your preferences, and autonomously manages tips to your favorite Rumble creators. Say **"tip my top 3 creators this week"** — the agent identifies them, calculates fair amounts based on watch time, executes transactions via **Tether WDK**, verifies on-chain, and reports back. All through a polished dashboard with 71 components.

**Key highlights:**
- **Rumble-native** — Creator profiles, channel management, watch-time tracking, event-triggered tipping
- **6-step AI pipeline** — INTAKE > ANALYZE > REASON > EXECUTE > VERIFY > REPORT
- **Autonomous intelligence** — Pattern learning, smart recommendations, policy engine, decision logging
- **Multi-chain** — Ethereum Sepolia + TON Testnet with intelligent chain selection
- **Voice commands** — Speak your tips via Web Speech API
- **Chat interface** — Conversational AI that understands tip intents, balance queries, and fee comparisons
- **115 API endpoints** — Full REST + SSE real-time streaming
- **Gamification** — Achievements, creator leaderboard, challenges, tip goals, streaks
- **Community tipping pools** — Collaborative fundraising with goals for creators
- **5 languages** — EN/ES/FR/AR/ZH with RTL support
- **One-command startup** — `docker-compose up` and you're running
- **$0 budget** — Zero paid APIs, everything runs locally

[Watch Demo Video](https://youtube.com/watch?v=YOUR_DEMO_ID)

---

## Rumble Integration

Rumble is one of the first major video platforms to integrate Tether WDK for native crypto tipping. TipFlow builds on top of this by adding an AI layer that enhances the tipping experience for both viewers and creators.

**How it works:** Rumble's wallet handles the core USDT custody and transfer infrastructure via WDK. TipFlow connects to Rumble creator profiles and viewing data to provide intelligent tipping automation — watch-time analysis, community pools, event triggers, and autonomous recommendations. The agent operates the same WDK wallet primitives that Rumble uses, extending them with decision-making intelligence.

**Rumble-specific capabilities:**
- **Creator profiles** — Pull channel info, subscriber counts, content metadata
- **Watch-time auto-tipping** — Watch 80%+ of a video and the agent auto-tips the creator
- **Community tipping pools** — Viewers pool USDT toward a shared creator goal
- **Event-triggered tips** — Automatically tip when a creator posts a new video, hits a milestone, or goes live
- **Creator leaderboard** — Rank creators by tips received, engagement, and community support
- **Collab splits** — Multi-creator videos automatically split tips by contribution percentage

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
|                    React Dashboard (71 Components)          |
|              React 19 + Vite 8 + Tailwind CSS 4            |
|                                                            |
|  Rumble: Creator Profiles · Watch-Time · Pools · Events    |
|  Autonomy: Patterns · Recommendations · Policy · Logging   |
|  Tipping: Single · Batch · Split · Scheduled · Conditional |
|  AI Chat: NLP · Voice · Decision Tree · Personality        |
|  Analytics: SVG Charts · Heatmap · Streaks · Leaderboard   |
|  Wallet: Multi-chain · HD Derivation · QR · Backup         |
|  UX: Onboarding · i18n (5 langs) · PWA · Keyboard · Touch  |
|  Data: Export (CSV/JSON/MD) · Templates · Contacts · Tags  |
+----------------------------+-------------------------------+
                             | REST API (115 endpoints) + SSE
+----------------------------+-------------------------------+
|              Node.js Agent Server (17 Services)            |
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
|  Services: Wallet · AI · Rumble · Autonomy · ENS           |
|  Contacts · Templates · Conditions · Challenges · Goals    |
|  Limits · Personality · Export · Retry · Tags              |
|  Telegram · Webhooks                                       |
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

## Features (90+)

### Rumble Creator Integration

| Feature | Description |
|---------|-------------|
| **Creator Profiles** | Channel info, subscriber counts, content catalog, tip history per creator |
| **Channel Management** | Follow/unfollow creators, organize by category, set per-creator tip preferences |
| **Watch-Time Auto-Tipping** | Watch 80%+ of a video and the agent auto-tips the creator based on your policy |
| **Community Tipping Pools** | Viewers pool USDT toward a shared goal for a creator (e.g., equipment fund) |
| **Event-Triggered Tips** | Auto-tip on new video upload, subscriber milestone, or live stream start |
| **Creator Leaderboard** | Rank creators by tips received, engagement score, and community support |
| **Collab Splits** | Multi-creator videos automatically split tips by contribution percentage |
| **Live Stream Tipping** | Real-time tip integration during Rumble live streams |

### Autonomous Intelligence

| Feature | Description |
|---------|-------------|
| **Tip Pattern Analysis** | Learns your tipping habits — frequency, amounts, preferred creators, timing |
| **Smart Recommendations** | Suggests creators to tip with confidence scores based on your viewing patterns |
| **Policy Engine** | Configurable rules: budget limits, recipient allowlists, minimum watch-time thresholds |
| **Decision Logging** | Full transparency — every autonomous decision logged with reasoning chain |
| **Autonomous Evaluation** | Self-assessment pipeline that measures decision quality over time |
| **Confidence Scoring** | Each recommendation includes a 0-100 confidence score with explanation |
| **Budget Management** | AI tracks spending against daily/weekly/monthly budgets, adjusts recommendations |
| **Learning Feedback Loop** | User approvals/rejections train the agent to make better future decisions |

### Agent Intelligence

| Feature | Description |
|---------|-------------|
| **6-Step Decision Pipeline** | Autonomous: INTAKE > ANALYZE > REASON > EXECUTE > VERIFY > REPORT |
| **Natural Language Processing** | Type "send 0.01 ETH to 0x..." — the agent parses and executes |
| **Conversational Chat** | Chat with the agent about balances, fees, history, or execute tips |
| **Intent Detection** | Detects: tip, balance, fees, address, help, history intents |
| **Decision Tree Visualization** | Interactive SVG visualization of agent reasoning |
| **5 Personalities** | Professional, Friendly, Pirate, Emoji, Minimal — each with unique responses |
| **LLM + Fallback** | Ollama (phi3:mini) when available, regex NLP when not |
| **Voice Commands** | Microphone input via Web Speech API with live transcript |

### Tipping Capabilities

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

### Multi-Chain & Wallet

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

### Analytics & Gamification

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

### Notifications & Integrations

| Feature | Description |
|---------|-------------|
| **Toast Notifications** | Success/error/info with auto-dismiss |
| **Notification Center** | Persistent inbox with mark-read/clear-all |
| **Notification Sounds** | Web Audio API oscillator sounds |
| **Browser Notifications** | Native push notifications |
| **Webhooks** | HTTP callbacks for tip events |
| **Telegram Bot** | 7 bot commands for tip notifications |
| **SSE Activity Feed** | Real-time dual streams (pipeline + activity) |

### Security & Reliability

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Per-endpoint rate limiting |
| **Input Validation** | Sanitization middleware on all inputs |
| **Audit Logging** | Winston structured logging |
| **Security Status** | Dashboard security indicator |
| **Self-Custodial** | All keys stay local |
| **Address Tags** | Color-coded address tagging |

### UX & UI

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

### Export & Data

| Feature | Description |
|---------|-------------|
| **CSV/JSON/Markdown/Summary Export** | Multi-format tip history export |
| **History Filtering** | Search, chain, status, date range filters |
| **Currency Converter** | ETH/TON/USD conversion with live prices |
| **Contacts Manager** | Address book with groups + import/export |
| **Batch Import** | CSV batch import for contacts |

### DevOps & API

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
| **Prices** | Bitfinex public API (no key needed) with static fallback |
| **ENS** | ethers.js for .eth name resolution |

---

## API Reference (115 Endpoints)

<details>
<summary><strong>System (8 endpoints)</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/docs` | OpenAPI 3.0 specification |
| `GET` | `/api/chains` | Supported chain configurations |
| `GET` | `/api/gas` | Real-time gas prices |
| `GET` | `/api/gas/speeds` | Gas speed options (slow/normal/fast) |
| `GET` | `/api/prices` | Live crypto prices (Bitfinex) |
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
<summary><strong>Rumble Integration, Autonomy, Activity, Contacts, Templates, Conditions, Webhooks, Tip Links, Gamification, Chat, Settings, Telegram, ENS, Tags, Calendar, Goals, Limits, Audit, Demo (80 endpoints)</strong></summary>

See the full OpenAPI 3.0 spec at `/api/docs` when the server is running, or the in-app API documentation component.

</details>

---

## Judging Criteria Alignment

### 1. Technical Correctness

- Full-stack TypeScript with 100+ typed interfaces
- 115 REST/SSE API endpoints across 16 categories
- 71 React components, 17 backend services, 5 custom hooks
- Clean WDK integration — 13+ methods, zero mocked calls
- Real testnet transactions (Ethereum Sepolia + TON Testnet)
- Dual SSE streams for real-time updates
- OpenAPI 3.0 specification
- Express 5 + rate limiting + validation + audit logging
- Docker multi-stage build + docker-compose
- PWA with service worker and offline support
- 55 automated tests (validation, agent, API)

### 2. Agent Autonomy

- 6-step autonomous decision pipeline: INTAKE > ANALYZE > REASON > EXECUTE > VERIFY > REPORT
- Tip pattern analysis and learning from user behavior
- Smart recommendations with confidence scores (0-100)
- Policy engine with configurable budget limits, recipient rules, watch-time thresholds
- Full decision logging with reasoning transparency for every action
- Autonomous evaluation pipeline that measures decision quality
- Scheduled and conditional tips run without human intervention
- Watch-time auto-tipping (80%+ threshold triggers autonomous tip)
- Learning feedback loop — approvals/rejections improve future decisions
- LLM reasoning with Ollama + robust regex fallback

### 3. Economic Soundness

- USDT-first design — stable value tipping, no volatile surprises
- Spending limits with daily/weekly/per-tip enforcement
- Cross-chain fee optimizer selects cheapest route
- Gasless tipping via ERC-4337 reduces barrier to entry
- Community tipping pools distribute costs across viewers
- Budget management AI tracks spending against configurable limits
- Creator collab splits ensure fair distribution
- Transaction retry with exponential backoff prevents wasted gas
- $0 infrastructure — no paid APIs, runs entirely locally

### 4. Real-World Applicability

- Builds directly on Rumble's existing WDK-based tipping wallet
- Creator profiles and channel management for real platform integration
- Watch-time auto-tipping solves the "I forgot to tip" problem
- Community pools enable collective creator support (equipment funds, milestones)
- Event-triggered tips (new video, milestones, live streams) drive creator engagement
- Creator leaderboard incentivizes quality content
- One-command Docker startup for easy deployment
- Mobile-responsive PWA installable to home screen
- 5-language support (EN/ES/FR/AR/ZH) for global reach
- Demo mode with testnet faucet links for easy evaluation

---

## Zero Budget

No paid APIs. No cloud services. Everything runs locally.

| Need | Solution | Cost |
|------|----------|------|
| AI | Local Ollama LLM + regex fallback | $0 |
| Prices | Bitfinex public API (no key) | $0 |
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
│       ├── services/               # 17 services
│       │   ├── wallet.service.ts   # WDK operations + HD derivation + gasless
│       │   ├── ai.service.ts       # Ollama LLM + NLP + intent detection
│       │   ├── rumble.service.ts   # Rumble creator profiles + watch-time + events
│       │   ├── autonomy.service.ts # Pattern analysis + recommendations + policy engine
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
│       │   ├── api.ts              # 115 REST + SSE endpoints
│       │   └── openapi.ts          # OpenAPI 3.0 spec
│       ├── __tests__/              # 51 automated tests
│       └── index.ts                # Express 5 entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/             # 71 React components
│       │   ├── RumbleIntegration.tsx # Rumble creator dashboard
│       │   ├── AutonomyPanel.tsx   # Autonomous intelligence controls
│       │   └── ...                 # 69 more components
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
  Built with Tether WDK for Rumble creators | <a href="https://dorahacks.io/hackathon/tether-wdk-hackathon">Tether Hackathon Galactica: WDK Edition 1</a>
</p>
