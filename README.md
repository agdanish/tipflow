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
    <img src="https://img.shields.io/badge/Endpoints-160+-blueviolet" alt="160+ API Endpoints" />
    <img src="https://img.shields.io/badge/Components-77-orange" alt="77 React Components" />
    <img src="https://img.shields.io/badge/Services-24-green" alt="24 Agent Services" />
    <img src="https://img.shields.io/badge/Budget-%240-red" alt="$0 Budget" />
  </p>
</p>

---

## What is TipFlow?

**Track: Tipping Bot — Building AI-powered tipping enhancement for Rumble's WDK-based creator tipping wallet**

In January 2026, [Rumble](https://rumble.com) launched its crypto wallet powered by Tether WDK, enabling viewers to tip creators directly with USDT, USAT (USA₮), XAU₮, and BTC. TipFlow extends that foundation with an **autonomous AI agent** that makes tipping smarter, automatic, and community-driven.

TipFlow watches your viewing habits, learns your preferences, and autonomously manages tips to your favorite Rumble creators. Say **"tip my top 3 creators this week"** — the agent identifies them, calculates fair amounts based on watch time, executes transactions via **Tether WDK**, verifies on-chain, and reports back. All through a polished dashboard with 77 components.

**Key highlights:**
- **Rumble-native** — Creator profiles, channel management, watch-time tracking, event-triggered tipping
- **6-step AI pipeline** — INTAKE > ANALYZE > REASON > EXECUTE > VERIFY > REPORT
- **Autonomous intelligence** — Pattern learning, smart recommendations, policy engine, decision logging
- **Multi-chain** — Ethereum Sepolia + TON Testnet + TRON Nile with intelligent chain selection
- **Voice commands** — Speak your tips via Web Speech API
- **Chat interface** — Conversational AI that understands tip intents, balance queries, and fee comparisons
- **160+ API endpoints** — Full REST + SSE real-time streaming
- **Tip Streaming Protocol** — Continuous micro-tipping per second (like Superfluid without smart contracts)
- **Cryptographic Tip Receipts** — WDK-signed Proof-of-Tip using `account.sign()` / `account.verify()`
- **Social Reputation Engine** — AI-driven creator scoring with time-decay and tier system
- **True agent autonomy** — Policy-driven auto-execution with tiered approval (small tips auto, large tips human OK)
- **HD Multi-Account** — BIP-44 derivation paths, account switching, wallet recovery
- **Gamification** — Achievements, creator leaderboard, challenges, tip goals, streaks
- **Community tipping pools** — Collaborative fundraising with goals for creators
- **5 languages** — EN/ES/FR/AR/ZH with RTL support
- **One-command startup** — `docker-compose up` and you're running
- **$0 budget** — Zero paid APIs, everything runs locally

<!-- Demo video link will be added after recording -->

---

## Rumble Integration

Rumble is one of the first major video platforms to integrate Tether WDK for native crypto tipping. TipFlow is **not a standalone payments app** — it is an extension layer that builds on top of Rumble's existing WDK-based tipping wallet, enhancing it with autonomous AI intelligence.

**Same wallet, same keys, same funds.** TipFlow uses the same WDK wallet primitives as Rumble's native wallet. A creator's Rumble wallet address IS their TipFlow address — same seed phrase, same HD derivation paths, same keys, same on-chain funds. If a creator already has a Rumble wallet, TipFlow connects to it seamlessly. There is no separate wallet to manage.

**How it works:** Rumble's wallet handles core USDT/USAT custody and transfer infrastructure via WDK. TipFlow connects to Rumble creator profiles and viewing data to provide intelligent tipping automation — watch-time analysis, community pools, event triggers, and autonomous recommendations. The agent operates the same WDK wallet primitives that Rumble uses, extending them with decision-making intelligence. Because both Rumble and TipFlow derive wallets from the same WDK seed phrase using identical HD paths, any tip sent through TipFlow arrives at the same address the creator uses on Rumble.

**Rumble-specific capabilities:**
- **Creator profiles** — Pull channel info, subscriber counts, content metadata
- **Watch-time auto-tipping** — Watch 80%+ of a video and the agent auto-tips the creator
- **Community tipping pools** — Viewers pool USDT/USAT toward a shared creator goal
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
|                    React Dashboard (74 Components)          |
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
                             | REST API (130 endpoints) + SSE
+----------------------------+-------------------------------+
|              Node.js Agent Server (21 Services)            |
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
| TRON wallet | `@tetherto/wdk-wallet-tron` | `getAccount()`, `getAddress()` | TRON Nile operations |
| Balance queries | All wallet modules | `getBalance()`, `getTokenBalance()` | Chain analysis + dashboard |
| Fee estimation | All wallet modules | `quoteSendTransaction()` | Cross-chain fee comparison |
| Native transfers | All wallet modules | `sendTransaction()` | ETH/TON/TRX tip execution |
| USDT/USAT transfers | `@tetherto/wdk-wallet-evm` | `transfer()` | ERC-20 token sends |
| Fee rate queries | `@tetherto/wdk` | `getFeeRates()` | Real-time gas monitoring |
| HD derivation | `@tetherto/wdk-wallet-evm` | Derivation path indexing | Multi-wallet support |
| Gasless (ERC-4337) | `@tetherto/wdk-wallet-evm-erc-4337` | Account abstraction | Zero-fee tipping |
| TON gasless | `@tetherto/wdk-wallet-ton-gasless` | Gasless sends | Zero-fee TON tipping |
| USDT0 Bridge | `@tetherto/wdk-protocol-bridge-usdt0-evm` | Cross-chain bridge (LayerZero) | Cross-chain USDT0 transfers |
| Aave V3 Lending | `@tetherto/wdk-protocol-lending-aave-evm` | Supply/withdraw | Treasury yield generation |
| WDK Indexer API | REST API (not npm) | `/balances`, `/transfers` | Unified cross-chain data |
| Resource cleanup | `@tetherto/wdk` | `dispose()` | Graceful shutdown |

---

## Features (90+)

### Rumble Creator Integration

| Feature | Description |
|---------|-------------|
| **Creator Profiles** | Channel info, subscriber counts, content catalog, tip history per creator |
| **Channel Management** | Follow/unfollow creators, organize by category, set per-creator tip preferences |
| **Watch-Time Auto-Tipping** | Watch 80%+ of a video and the agent auto-tips the creator based on your policy |
| **Community Tipping Pools** | Viewers pool USDT/USAT toward a shared goal for a creator (e.g., equipment fund) |
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
| **Single Tips** | Send ETH/TON or USDT/USAT to any address |
| **Batch Tipping** | Tip up to 10 recipients in one operation |
| **Split Tipping** | Divide amount among up to 5 recipients by percentage |
| **Scheduled Tips** | Schedule one-time or recurring (daily/weekly/monthly) tips |
| **Conditional Tips** | Auto-tip when gas_below, balance_above, or time_of_day conditions are met |
| **Tip Templates** | Save and reuse frequently-sent configurations |
| **Gasless Tips (ERC-4337)** | Zero gas fees via Account Abstraction |
| **USDT/USAT ERC-20 Transfers** | Token transfers via WDK `transfer()` |
| **Tip Links** | Shareable pre-filled tip URLs |
| **Transaction Retry** | Automatic retry with exponential backoff |
| **Tip Receipts** | Structured receipts with receipt ID, block number, fees |
| **Spending Limits** | Configurable daily/weekly/per-tip spending limits |

### Multi-Chain & Wallet

| Feature | Description |
|---------|-------------|
| **Multi-Chain** | Ethereum Sepolia + TON Testnet + TRON Nile with intelligent chain selection |
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

**Token Support:** TipFlow supports all Rumble-supported tipping tokens: USDT (ERC-20 on Ethereum, TRC-20 on TRON), USAT/USA₮ (Tether's US dollar-backed stablecoin), and native chain currencies (ETH, TON, TRX). The USDT0 bridge (via `wdk-protocol-bridge-usdt0-evm` and LayerZero) enables cross-chain USDT transfers. XAU₮ and BTC support is architecturally ready via WDK's modular wallet system (`wdk-wallet-btc` package exists in the WDK ecosystem).

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
| **Wallet SDK** | `@tetherto/wdk`, `wdk-wallet-evm`, `wdk-wallet-ton`, `wdk-wallet-tron`, `wdk-wallet-evm-erc-4337`, `wdk-wallet-ton-gasless`, `wdk-protocol-bridge-usdt0-evm`, `wdk-protocol-lending-aave-evm` (8 packages) |
| **AI** | Ollama (local LLM — phi3:mini) with rule-based regex fallback |
| **Blockchains** | Ethereum Sepolia, TON Testnet, TRON Nile Testnet |
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

## Third-Party Services & Disclosures

All external services used in TipFlow are free and require no paid subscriptions.

| Service | Purpose | Cost | URL |
|---------|---------|------|-----|
| **Tether WDK** (8 packages) | Core wallet SDK — `@tetherto/wdk`, `wdk-wallet-evm`, `wdk-wallet-ton`, `wdk-wallet-tron`, `wdk-wallet-evm-erc-4337`, `wdk-wallet-ton-gasless`, `wdk-protocol-bridge-usdt0-evm`, `wdk-protocol-lending-aave-evm`. Apache 2.0. | Free | [github.com/tetherto](https://github.com/tetherto) |
| **Ollama** | Local LLM inference (phi3:mini model). Runs entirely locally, no data leaves the machine. | Free | [ollama.ai](https://ollama.ai) |
| **Bitfinex Public API** | Real-time cryptocurrency pricing (ETH, TON, TRX, USDT). No API key required. | Free | [api-pub.bitfinex.com](https://api-pub.bitfinex.com) |
| **DeFi Llama API** | DeFi yield rates (Aave V3, lending pools) for treasury optimization. No API key required. | Free | [yields.llama.fi](https://yields.llama.fi) |
| **WDK Indexer API** | Unified cross-chain balance and transfer data. REST API (not an npm package). | Free | [wdk-api.tether.io](https://wdk-api.tether.io) |
| **Ethereum Sepolia RPC** | publicnode.com free public RPC endpoint. No API key required. | Free | publicnode.com |
| **TON Testnet RPC** | toncenter.com free testnet API. | Free | toncenter.com |
| **TRON Nile RPC** | nile.trongrid.io free testnet endpoint. No API key required. | Free | nile.trongrid.io |
| **QR Code API** | api.qrserver.com for QR code generation. | Free | api.qrserver.com |
| **ethers.js** | ENS name resolution via Cloudflare ETH gateway. | Free | [ethers.org](https://ethers.org) |
| **Web Speech API** | Browser-native voice recognition. No external service — runs in the browser. | Free | Browser built-in |
| **Web Audio API** | Browser-native notification sounds. No external service — runs in the browser. | Free | Browser built-in |

---

## API Reference (130 Endpoints)

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
| `GET` | `/api/wallet/balances` | Native + USDT/USAT balances |
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
<summary><strong>Rumble Integration, Autonomy, Activity, Contacts, Templates, Conditions, Webhooks, Tip Links, Gamification, Chat, Settings, Telegram, ENS, Tags, Calendar, Goals, Limits, Audit, Demo (95 endpoints)</strong></summary>

See the full OpenAPI 3.0 spec at `/api/docs` when the server is running, or the in-app API documentation component.

</details>

---

## Judging Criteria Alignment

### 1. Agent Intelligence

- 6-step autonomous decision pipeline: INTAKE > ANALYZE > REASON > EXECUTE > VERIFY > REPORT
- LLM reasoning with Ollama (phi3:mini) + robust regex NLP fallback
- Natural language processing — type or speak tip commands conversationally
- Intent detection: tip, balance, fees, address, help, history
- Tip pattern analysis and learning from user behavior
- Smart recommendations with confidence scores (0-100)
- 5 agent personalities (Professional, Friendly, Pirate, Emoji, Minimal)
- Voice commands via Web Speech API with live transcript

### 2. WDK Wallet Integration

- 8 WDK packages integrated: core, EVM, TON, TRON, ERC-4337 gasless, TON gasless, USDT0 bridge, Aave lending
- WDK Indexer API for unified cross-chain balance and transfer data
- Full-stack TypeScript with 100+ typed interfaces
- 160+ REST/SSE API endpoints across 20 categories
- Clean WDK integration — 15+ methods including `sign()`, `verify()`, `keyPair`, zero mocked calls
- Real testnet transactions (Ethereum Sepolia + TON Testnet + TRON Nile)
- HD wallet derivation with multi-account support (BIP-44 paths, account switching)
- Resource cleanup with `dispose()` for graceful shutdown

### 3. Technical Execution

- 77 React components, 24 backend services, 5 custom hooks
- Dual SSE streams for real-time updates
- OpenAPI 3.0 specification
- Express 5 + rate limiting + validation + audit logging
- Docker multi-stage build + docker-compose
- PWA with service worker and offline support
- 24 automated tests across 6 test suites
- Cross-chain fee comparison and optimization

### 4. Agentic Payment Design

- Stablecoin-first design (USDT/USAT) — stable value tipping, no volatile surprises
- Spending limits with daily/weekly/per-tip enforcement
- Cross-chain fee optimizer selects cheapest route
- Gasless tipping via ERC-4337 reduces barrier to entry
- USDT0 bridge for cross-chain USDT transfers via LayerZero
- Aave V3 treasury yield for idle fund optimization
- Scheduled and conditional tips run without human intervention
- Watch-time auto-tipping (80%+ threshold triggers autonomous tip)
- **Tip Streaming Protocol** — continuous micro-tipping at intervals (pay-per-second)
- **Tiered approval** — small tips auto-execute, large tips need human confirmation
- **Autonomous decision loop** — agent proposes, evaluates, and executes tips on its own every 60s
- Transaction retry with exponential backoff prevents wasted gas
- $0 infrastructure — no paid APIs, runs entirely locally

### 5. Originality

- Extends (not replaces) Rumble's existing WDK-based tipping wallet — same seed, same keys, same addresses
- Community tipping pools — collaborative fundraising with goals for creators
- Creator collab splits — multi-creator videos automatically split tips
- Event-triggered tips (new video, milestones, live streams) drive creator engagement
- Gamification — achievements, daily challenges, streaks, leaderboard
- Policy engine with configurable budget limits, recipient rules, watch-time thresholds
- Full decision logging with reasoning transparency for every action
- **Cryptographic Tip Receipts (Proof-of-Tip)** — WDK `account.sign()` creates tamper-proof, verifiable receipts
- **Social Reputation Engine** — time-decaying creator scores with bronze→diamond tiers
- **HD Multi-Account Management** — BIP-44 derivation, account switching (no other tipping bot does this)

### 6. Polish & Ship-ability

- One-command Docker startup for easy deployment
- Mobile-responsive PWA installable to home screen
- 5-language support (EN/ES/FR/AR/ZH) with RTL support for global reach
- Guided onboarding tour for first-time users
- Demo mode with testnet faucet links for easy evaluation
- Loading skeletons, empty states, error boundaries for polished UX
- Dark/light theme with custom accent colors

### 7. Presentation & Demo

- Creator leaderboard incentivizes quality content
- Interactive decision tree visualization of agent reasoning
- In-app API documentation component
- System info dashboard (uptime, Node version, WDK version, memory)
- Comprehensive README with architecture diagrams and API reference

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
│       ├── services/               # 24 services
│       │   ├── wallet.service.ts   # WDK operations + HD derivation + multi-account + gasless
│       │   ├── ai.service.ts       # Ollama LLM + NLP + intent detection
│       │   ├── rumble.service.ts   # Rumble creator profiles + watch-time + events
│       │   ├── autonomy.service.ts # Pattern analysis + auto-execution + policy engine
│       │   ├── streaming.service.ts # Tip Streaming Protocol (continuous micro-tips)
│       │   ├── receipt.service.ts  # Cryptographic Proof-of-Tip (WDK sign/verify)
│       │   ├── reputation.service.ts # Social reputation engine with time-decay
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
│       │   ├── tags.service.ts     # Address tagging
│       │   ├── bridge.service.ts   # USDT0 cross-chain bridge
│       │   ├── indexer.service.ts  # WDK Indexer API client
│       │   ├── lending.service.ts  # Aave V3 lending integration
│       │   └── treasury.service.ts # Treasury yield management
│       ├── middleware/
│       │   ├── rateLimit.ts        # Rate limiting
│       │   └── validate.ts         # Input validation + audit
│       ├── routes/
│       │   ├── api.ts              # 160+ REST + SSE endpoints
│       │   └── openapi.ts          # OpenAPI 3.0 spec
│       ├── __tests__/              # 24 automated tests
│       └── index.ts                # Express 5 entry point
├── dashboard/                      # React frontend
│   └── src/
│       ├── components/             # 77 React components
│       │   ├── RumbleIntegration.tsx # Rumble creator dashboard
│       │   ├── AutonomyPanel.tsx   # Autonomous intelligence controls
│       │   ├── StreamingPanel.tsx  # Tip Streaming Protocol UI
│       │   ├── CryptoReceipt.tsx   # Proof-of-Tip verification
│       │   ├── ReputationPanel.tsx # Social reputation leaderboard
│       │   └── ...                 # 72 more components
│       ├── hooks/                  # 5 custom hooks
│       ├── lib/                    # API client, i18n, sounds, utils
│       └── types/                  # 80+ TypeScript interfaces
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
WDK_SEED=your twelve word seed phrase here

# Optional
OLLAMA_HOST=http://localhost:11434         # AI reasoning
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

24 tests across 6 test suites: AI service (4), NLP parsing (7), reasoning (2), leaderboard (1), achievements (1), API (9).

---

## Team

- **Danish A** — Solo developer. GitHub: [@agdanish](https://github.com/agdanish)
- **Location:** Remote
- **Track:** Tipping Bot

---

## Prior Work Disclosure

This project was built entirely during the Tether Hackathon Galactica: WDK Edition 1 (March 9--22, 2026). No prior code, components, or infrastructure existed before the hackathon period. All code is original work created for this submission.

---

## License

[Apache 2.0](./LICENSE) — Copyright 2026 Danish A

---

<p align="center">
  Built with Tether WDK for Rumble creators | <a href="https://dorahacks.io/hackathon/tether-wdk-hackathon">Tether Hackathon Galactica: WDK Edition 1</a>
</p>
