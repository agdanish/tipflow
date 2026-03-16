# Evaluation Model & Judge Model

## A. Officially Confirmed Judging Signals

All from DoraHacks Rules page. Confidence: **HIGH** (directly stated).

1. **Agent Intelligence** — LLM use, autonomous agents, decision-making logic driving real actions
2. **WDK Wallet Integration** — Secure, correct, non-custodial, robust transaction handling
3. **Technical Execution** — Architecture quality, code quality, integration reliability
4. **Agentic Payment Design** — Realistic programmable payment flows (conditional, subscriptions, coordination)
5. **Originality** — Innovative use case, creative agent-wallet rethinking
6. **Polish & Ship-ability** — Completeness, UX clarity (especially permissions/transactions), deployment readiness
7. **Presentation & Demo** — Clear explanation, strong live demo

**From detail page (4 higher-level criteria):**
- Technical correctness
- Degree of agent autonomy
- Economic soundness
- Real-world applicability

## B. Highly Plausible Judging Signals (Inferred)

| Signal | Evidence | Confidence |
|--------|----------|-----------|
| Deep WDK usage (multiple modules, not just basic wallet) | Hackathon is WDK-themed; Tether sponsors | High |
| Multi-chain support | WDK's core value prop is multi-chain | Medium-High |
| Real testnet transactions | "Working end-to-end flows expected" | High |
| Agent makes decisions without human input | "Autonomy" criterion explicitly stated | High |
| Economic logic makes sense (not just random transfers) | "Economic soundness" criterion | High |
| Easy to run/evaluate | "Easy for judges to evaluate" in rules | High |
| Apache 2.0 compliance | Required by rules | High |
| Using official WDK packages (not custom reimplementation) | WDK integration is a criterion | High |

## C. Likely Failure Triggers

| Failure Mode | Why Likely | Severity |
|-------------|-----------|----------|
| No working demo video | Required for submission + judging criterion | Fatal |
| Repo doesn't run | Judges can't evaluate | Fatal |
| No real WDK integration (mocked/faked) | Core judging criterion | Fatal |
| No agent autonomy (just manual buttons) | "Autonomy" is key criterion | Critical |
| Broken transaction flows | "Correctness" criterion | Critical |
| Over-engineered, half-working features | Partial implementation scores poorly | High |
| No clear README / setup instructions | Judges need easy evaluation | High |
| No error handling on wallet operations | Looks amateurish, unreliable | Medium |
| Testnet-only with no real-world narrative | "Real-world applicability" criterion | Medium |

## D. Competitive Advantage Opportunities

### Current Competitor Weaknesses (inferred from submissions)

1. **Tipping Bot track has ZERO submissions** — guaranteed 1st place if we submit a working entry
2. **Lending Bot track has 1 submission** — only need to beat LendGuard for 1st
3. Most competitors focus on DeFi/treasury — **tipping is unexplored territory**
4. Several competitors use Aave V3 (commodity approach) — differentiation opportunity
5. Some submissions look complex (multi-chain treasury, escrow protocols) — may be fragile

### Where We Can Outperform

| Area | Strategy |
|------|----------|
| Track selection | Target Tipping Bot (0 competitors) for guaranteed track prize |
| Also compete for Overall | A polished tipping bot can also win overall prizes |
| Polish & Ship-ability | Clean UX, working demo, one-command setup |
| Agent autonomy | Real LLM-driven decision making, not manual triggers |
| WDK depth | Multi-chain tipping (EVM + TON + TRON), gasless transactions |
| Demo quality | Clear, well-narrated 3-min video showing real flows |
| Economic soundness | Tipping has clear real-world economics |
| Originality | Social tipping via AI agent is novel in this field |

## Score-Maximizing Implications

1. **Target Tipping Bot track** — zero competition = guaranteed track prize ($3,000-5,000)
2. Build real agent autonomy — LLM analyzes context and decides tip amounts
3. Use multiple WDK modules — wallet-evm, wallet-ton, gasless variants
4. Show real testnet transactions in demo
5. Make repo clean, well-documented, one-command start
6. Demo video must be clear and compelling
7. Frame as real-world product, not hackathon toy
