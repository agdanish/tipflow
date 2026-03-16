# Build Strategy

## Implementation Path Analysis

### Path 1: React Native Mobile Wallet
- Speed: SLOW (40 peer deps, Android SDK, iOS setup, Expo config)
- Risk: HIGH (RN polyfill hell, device testing)
- WDK depth: HIGH
- Demo impact: MEDIUM (hard to screen-record mobile)
- Judging: MEDIUM (not agent-focused enough)
- Zero-cost: YES
- Solo feasibility: LOW
- **VERDICT: REJECT** — too much setup overhead for 6 days solo

### Path 2: Node.js AI Agent (CLI/backend only)
- Speed: FAST (Node.js 22, npm install, go)
- Risk: LOW-MEDIUM
- WDK depth: HIGH (direct SDK usage)
- Demo impact: LOW (CLI output is not compelling)
- Judging: HIGH on autonomy, LOW on polish/UX
- Zero-cost: YES
- Solo feasibility: HIGH
- **VERDICT: PARTIAL** — great backend, needs frontend for demo

### Path 3: Web Dashboard (React + Vite + Tailwind)
- Speed: FAST (user's existing skillset)
- Risk: LOW
- WDK depth: LOW (WDK is Node.js/RN, not browser-native)
- Demo impact: HIGH (visual, screen-recordable)
- Judging: MEDIUM (less agent autonomy if just dashboard)
- Zero-cost: YES
- Solo feasibility: HIGH
- **VERDICT: PARTIAL** — great frontend, needs agent backend

### Path 4: Hybrid — Node.js AI Agent + Web Dashboard
- Speed: MEDIUM-FAST (both parts are in our wheelhouse)
- Risk: MEDIUM (two systems to coordinate)
- WDK depth: HIGH (backend uses WDK directly)
- Demo impact: HIGH (visual dashboard + autonomous agent)
- Judging: HIGH (autonomy + polish + WDK depth)
- Zero-cost: YES
- Solo feasibility: MEDIUM-HIGH
- **VERDICT: RECOMMENDED** ✓

## RECOMMENDED STRATEGY

### Build: AI-Powered Tipping Bot with Web Dashboard

**Track: Tipping Bot** (0 competitors = guaranteed track prize)

**Concept:** An autonomous AI tipping agent that:
1. Manages multi-chain USDT wallets via WDK (EVM + TON)
2. Accepts tip commands via a web interface
3. AI agent decides optimal chain for lowest fees
4. Executes gasless transfers when available
5. Shows real-time wallet balances, transaction history
6. Agent autonomously handles chain selection, fee optimization, and execution

**Architecture:**
```
[Web Dashboard (React+Vite+Tailwind)]
        ↕ REST API / WebSocket
[Node.js Agent Server]
        ↕ WDK SDK
[Multiple Chains: EVM (Sepolia), TON Testnet]
```

**WDK Modules to Use:**
- `@tetherto/wdk` (core)
- `@tetherto/wdk-wallet-evm` (Ethereum/EVM wallets)
- `@tetherto/wdk-wallet-ton` (TON wallets)
- `@tetherto/wdk-wallet-evm-erc-4337` (gasless EVM — stretch goal)
- `@tetherto/wdk-wallet-ton-gasless` (gasless TON — stretch goal)

**AI Agent Intelligence:**
- Use a local/free LLM for decision-making (Ollama with a small model, OR rule-based "AI" with clear decision logic)
- Agent decides: which chain to tip on, fee optimization, retry logic
- Fallback: deterministic decision engine with clear rules (still autonomous, still "agent")
- NOTE: Zero-cost constraint means no OpenAI/Claude API. Options:
  - Ollama (local, free) if user's machine supports it
  - Rule-based autonomous agent with clear decision trees
  - Free tier of Groq/Together (limited but functional)

## Feature Prioritization (MoSCoW)

### Must Have (Days 1-3)
- [ ] WDK wallet creation (seed phrase generation)
- [ ] EVM wallet: balance check, send USDT on Sepolia
- [ ] TON wallet: balance check, send on testnet
- [ ] Tip command processing (web form → agent → execute)
- [ ] Transaction history display
- [ ] Basic web dashboard with wallet overview
- [ ] Agent decision logic (chain selection based on fees)

### Should Have (Days 4-5)
- [ ] Multi-recipient tipping (batch tips)
- [ ] Tip analytics (who tipped whom, amounts, chains)
- [ ] Real-time balance updates
- [ ] Error handling and retry logic
- [ ] Clean loading/error states in UI

### Could Have (Day 5-6)
- [ ] Gasless transactions (ERC-4337 or TON gasless)
- [ ] Tip templates (preset amounts for common scenarios)
- [ ] Export tip history

### Won't Have (too risky)
- Cross-chain bridging
- DeFi yield optimization
- Mobile app
- Production mainnet deployment

## Day-by-Day Build Plan

### Day 1 (Mar 16): Foundation
- Set up repo structure (monorepo: /agent + /dashboard)
- Initialize Node.js agent with WDK SDK
- WDK wallet creation + EVM wallet basic operations
- Basic Express API server

### Day 2 (Mar 17): Core Agent
- TON wallet integration
- Tip processing engine (receive tip command → execute)
- Agent decision logic (chain selection, fee estimation)
- API endpoints for dashboard

### Day 3 (Mar 18): Dashboard
- React+Vite+Tailwind dashboard setup
- Wallet overview page (balances, addresses)
- Tip form (recipient, amount, optional chain preference)
- Transaction history view

### Day 4 (Mar 19): Integration & Polish
- Connect dashboard to agent API
- Real-time updates (polling or WebSocket)
- Error handling throughout
- Loading states, empty states

### Day 5 (Mar 20): Testing & Stretch
- End-to-end testing on testnets
- Attempt gasless transactions (stretch goal)
- UI polish, responsive design
- README documentation

### Day 6 (Mar 21): Package & Submit
- Final bug fixes
- Record demo video (OBS Studio, 3-5 min)
- Upload to YouTube (unlisted)
- Clean repo, verify one-command startup
- Submit on DoraHacks

### Day 7 (Mar 22): Buffer
- Emergency fixes only
- Submit before 23:59 UTC

## Demo Video Plan

1. **Intro (30s):** What is TipBot? AI-powered multi-chain tipping agent
2. **Wallet Demo (60s):** Show wallet creation, multi-chain balances, addresses
3. **Tip Flow (90s):** Send a tip → agent decides chain → executes → confirmation
4. **Agent Intelligence (30s):** Show agent reasoning (why it chose this chain)
5. **Transaction History (30s):** Show completed tips, chain distribution
6. **Closing (30s):** Real-world use cases, deployment potential

## Submission Checklist

- [ ] Product name and description
- [ ] Track: Tipping Bot
- [ ] Team member: [user's name + background]
- [ ] Location
- [ ] Public GitHub repo (Apache 2.0)
- [ ] YouTube video (unlisted, ≤5 min)
- [ ] Clear README with setup instructions
- [ ] `npm install && npm run dev` works
- [ ] No fake features — every button works
- [ ] Real WDK integration (not mocked)
- [ ] Testnet transactions work
