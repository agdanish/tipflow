# TipFlow Demo Video Script (5 minutes)

## Pre-Recording Setup
1. Start the agent: `cd agent && npm start`
2. Start the dashboard: `cd dashboard && npm run dev`
3. Open browser to `http://localhost:5173`
4. Ensure testnet has funds (ETH Sepolia faucet + TON testnet faucet)
5. Pre-send 2-3 tips so dashboard has data
6. Screen: 1920x1080, browser full-screen, dark mode

## Pre-Recording Checklist
- [ ] Agent backend running
- [ ] Dashboard running
- [ ] 2-3 existing tips in history
- [ ] Testnet ETH funded
- [ ] Ollama running OR rule-based mode
- [ ] 1080p screen recording
- [ ] Microphone tested
- [ ] No notifications/popups visible

---

## INTRO (0:00 - 0:30) — "What is TipFlow?"

**Show:** Dashboard homepage with Innovation Showcase carousel

**Say:**
> "TipFlow is an AI-powered tipping agent for Rumble creators, built on Tether WDK. It extends Rumble's existing crypto wallet with autonomous intelligence — the agent watches your behavior, learns your preferences, and autonomously manages tips across Ethereum, TON, and TRON. Same wallet, same keys, same addresses as Rumble's native wallet."

**Action:** Scroll the Innovation Showcase carousel to show all 10 patent-worthy innovations.

---

## DEMO 1 (0:30 - 1:30) — "AI Agent Pipeline — Real Transaction"

**Show:** Tip Form with NLP input

**Say:**
> "Let me send a real tip with a natural language command."

**Action:**
1. Type in NLP: `send 0.001 ETH to [your address]`
2. Click "Parse" — show AI parsing with confidence %
3. Click "Send Tip"
4. **KEY MOMENT:** Show 6-step Agent Pipeline: INTAKE → ANALYZE → REASON → EXECUTE → VERIFY → REPORT
5. Show AI Decision panel — chain scores, fee comparison, reasoning
6. Show Transaction Tracker: Submitted → Propagating → Confirming → Confirmed
7. Show confetti + toast

**Say:**
> "The agent analyzed fees across all chains, selected the optimal one, executed the transaction, verified on-chain, and generated a cryptographic receipt — all autonomously. The AI decided which chain, not me."

---

## DEMO 2 (1:30 - 2:15) — "Multi-Agent Consensus"

**Show:** AI tab → Orchestrator Panel

**Say:**
> "Every tip goes through multi-agent consensus. Three independent AI agents vote."

**Action:**
1. Click "Test Vote"
2. Watch 3 agents vote sequentially:
   - TipExecutor: validates feasibility
   - Guardian: enforces safety (has VETO power)
   - TreasuryOptimizer: optimizes economics
3. Show confidence bars and reasoning bullets
4. Show consensus result

**Say:**
> "The Guardian has veto power. This is responsible autonomy — every decision logged with full reasoning chain."

---

## DEMO 3 (2:15 - 2:50) — "Autonomous Intelligence"

**Show:** Agent Autonomous Activity feed + Predictor Panel

**Say:**
> "The agent thinks autonomously every 60 seconds."

**Action:**
1. Show AgentActivityFeed with AUTO-tagged events
2. Navigate to Predictor → click "Generate"
3. Expand a prediction to show reasoning, category, confidence breakdown
4. Show autonomous auto-tip proposal

**Say:**
> "The agent detected I tip this creator every Tuesday. It proactively suggests a tip with confidence scoring. That's real agent intelligence — it learns, it predicts, it acts."

---

## DEMO 4 (2:50 - 3:30) — "Advanced Payment Flows"

**Show:** Streaming + Escrow + DCA panels

**Action:**
1. StreamingPanel: select "Micro-tip" preset → show rate preview → start stream
2. EscrowPanel: click "New Escrow" → select "Creator Confirm" → create
3. DcaPanel: create plan → show payout schedule preview

**Say:**
> "Tip streams send real on-chain transactions every 30 seconds. Escrow holds tips until conditions are met. DCA spreads tips over time for consistent creator income. All execute real blockchain transactions."

---

## DEMO 5 (3:30 - 4:15) — "WDK Integration Depth"

**Show:** Settings → WDK Capabilities + Indexer + Economics

**Action:**
1. Expand WDK Capabilities — show 8 packages
2. Show HD derivation paths + ERC-4337 status
3. Query Indexer for a balance
4. Show Economics Dashboard — fees saved, gas efficiency
5. Show Cryptographic Receipt verification

**Say:**
> "8 WDK packages. Every transaction cryptographically signed. The Economics Dashboard shows the agent saved real fees through intelligent chain selection."

---

## DEMO 6 (4:15 - 4:45) — "Rumble Creator Economy"

**Show:** Rumble tab + Reputation Engine

**Action:**
1. Show creators, pools, auto-tip rules
2. Search a creator in Reputation Engine
3. Show tier system (Bronze → Diamond)

**Say:**
> "Creators register channels. Viewers set auto-tip rules. Community pools crowdfund creator goals. The reputation engine scores creators with time-decaying scores."

---

## CLOSING (4:45 - 5:00)

**Say:**
> "TipFlow: autonomous AI tipping for Rumble creators. 8 WDK packages, 3 chains, multi-agent consensus, predictive intelligence, cryptographic receipts, tip streaming, escrow, DCA. All real testnets, zero mocked calls. Built for Hackathon Galactica. Thank you."

**Action:** Press Cmd+K to show Command Palette as closing flourish.
