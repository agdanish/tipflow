# TipFlow Demo Video Script (3-5 minutes)

## Pre-Recording Setup
1. Start the agent: `cd agent && npm run dev`
2. Start the dashboard: `cd dashboard && npm run dev`
3. Open browser to `http://localhost:5173`
4. Make sure Sepolia testnet has some ETH (use faucet if needed)
5. Use OBS Studio or Windows Game Bar (Win+G) to record

---

## INTRO (0:00 - 0:30)

**[Show TipFlow dashboard landing page]**

> "Hi, I'm Danish, and this is TipFlow — an AI-powered multi-chain tipping agent built for Rumble creators, using Tether's Wallet Development Kit."
>
> "TipFlow lets creators receive automated, intelligent tips based on watch time, community pools, and event triggers — all powered by real blockchain transactions on Ethereum and TON."

---

## SECTION 1: Wallet & WDK Integration (0:30 - 1:15)

**[Show wallet cards on dashboard]**

> "TipFlow uses WDK to create deterministic HD wallets from a single seed phrase. Here you can see our EVM and TON wallet addresses with real balances."

**[Click on wallet — show balances loading]**

> "Balances are fetched in real-time. We also have live gas monitoring and a currency converter powered by Bitfinex's public API — that's Tether's own exchange."

**[Show Gas Monitor widget]**

---

## SECTION 2: Send a Real Tip (1:15 - 2:00)

**[Navigate to the Demo Scenarios section]**

> "Let me send a real testnet transaction. I'll use our one-click demo to send a self-tip on Ethereum Sepolia."

**[Click "Quick Tip" demo button — wait for transaction]**

> "That just sent 0.0001 ETH through our full 6-step agent pipeline: Intake, Analyze, Reason, Execute, Verify, Report."

**[Show the Agent Panel with pipeline steps]**

> "Every transaction goes through the agent's reasoning engine. You can see the full decision tree right here."

**[Show Transaction History with the new tip]**

---

## SECTION 3: NLP & AI Agent (2:00 - 2:30)

**[Click on Chat tab]**

> "TipFlow understands natural language. Watch this..."

**[Type: "send 0.0001 ETH to 0x742d35Cc..." in chat]**

> "The agent parses natural language commands, extracts recipient, amount, and chain — then executes the transaction autonomously."

**[Show the NLP parsing result]**

---

## SECTION 4: Rumble Creator Integration (2:30 - 3:15)

**[Click Rumble tab]**

> "This is our Rumble integration — the core of the Tipping Bot track. Creators register their channels, and fans can set up automated tipping rules."

**[Show Creator registration form — add a creator]**

> "Watch-time auto-tipping: when a fan watches 80% or more of a video, the agent automatically tips the creator. No manual action needed."

**[Show Auto-Tip rules configuration]**

> "Community pools let fans collectively fund creator goals. Event triggers automatically tip when a creator publishes a new video or hits a subscriber milestone."

**[Show Community Pools and Events tabs]**

---

## SECTION 5: Autonomous Intelligence (3:15 - 3:45)

**[Show Autonomy Panel on dashboard]**

> "What makes TipFlow truly agentic is autonomous intelligence. The agent learns tipping patterns, recommends who to tip and when, and explains every decision with full reasoning transparency."

**[Show decision log with reasoning chains]**

> "Users set high-level policies — like budget caps and preferred chains — and the agent operates independently within those guardrails."

---

## SECTION 6: Features Showcase (3:45 - 4:15)

**[Quick scroll through features — 3-5 seconds each]**

> "TipFlow also includes:"

- Batch tips and split tips
- Spending limits and audit logs
- Telegram bot integration
- Multi-language support (5 languages including RTL Arabic)
- Keyboard shortcuts and voice commands
- CSV export and import
- ENS name resolution
- PWA support with offline mode
- Docker one-command deployment

---

## CLOSING (4:15 - 4:45)

**[Show the full dashboard one more time]**

> "TipFlow is 71 React components, 115 API endpoints, 17 backend services, and 55 automated tests — all built with TypeScript, real WDK integration, and zero budget."
>
> "Check out the GitHub repo in the description. Thank you!"

**[Show GitHub repo URL on screen]**

---

## Recording Tips
- Speak slowly and clearly
- Pause on each screen for 2-3 seconds so viewers can read
- If a transaction takes time, narrate what's happening
- Keep the browser window clean (no other tabs)
- Record at 1080p if possible
- Upload as "Unlisted" on YouTube
