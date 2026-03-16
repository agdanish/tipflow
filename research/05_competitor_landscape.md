# Competitor Landscape

## Current Submissions (8 BUIDLs as of Mar 16)

### Track: Agent Wallets (5 submissions)
1. **AMP (Agent Market Protocol)** — AI agents post tasks, lock USDT escrow, validate, settle. Uses Aave V3 + Claude + WDK. Team of 3. *Risk: complex escrow logic may be fragile.*
2. **Axiom** — Treasury + payout agent. Manages idle funds, calculates gas-vs-yield for lending, triggers payouts on GitHub PR merges. Uses Aave, WDK, Openclaw, MCP. Multi-chain (ETH, ARB, OP, BASE, POLY). *Risk: very ambitious scope.*
3. **Tsentry** — AI treasury agent. DEX aggregation, lending, bridging, gasless ERC-4337, x402 micropayments. Multi-chain. Team of 3. *Risk: scope creep, many moving parts.*
4. **peaq** — DePIN Layer-1. Unclear WDK integration depth.
5. **Ajo-Agent** — Autonomous savings pool agent. Team of 2. *Simpler scope, could be polished.*

### Track: Lending Bot (1 submission)
6. **LendGuard** — Aave V3 position manager, protects from liquidation, maximizes yield. Base Sepolia. *Focused but single-chain.*

### Track: Autonomous DeFi Agent (2 submissions)
7. **PayMind AI** — DeFi agent with WDK wallet, scans yields, pays for AI compute, auto-deposits Aave V3 every 30 min. *Interesting concept.*
8. **SafeAgent** — On-chain risk parameters that AI reads but can't modify. Uses Safe + Uniswap on BNB Chain. *Novel approach.*

### Track: Tipping Bot (0 submissions)
**ZERO competitors. This is the golden opportunity.**

## Common Patterns

- Heavy use of Aave V3 (at least 4 submissions)
- Focus on treasury/DeFi management
- Multi-chain is common but may lead to complexity
- Most competitors are in Agent Wallets track (crowded)
- Several teams of 2-3 (we're solo but AI-assisted)

## Likely Overbuilt Patterns
- Complex escrow systems (AMP)
- Multi-protocol treasury management (Axiom, Tsentry)
- Cross-chain bridging as a core feature

## Likely Underbuilt Areas
- **Tipping Bot track is EMPTY** — no one is building here
- Social interaction / user-facing flows
- Clean UX for non-technical users
- Demo video quality (most hackathon teams neglect this)

## Our Competitive Edge
1. **Zero competition in Tipping Bot** — any working submission wins
2. Can also compete for Overall prizes simultaneously
3. Solo + AI can move faster than teams with coordination overhead
4. React/TS/Tailwind experience = web dashboard speed
5. Prior DoraHacks submission experience
