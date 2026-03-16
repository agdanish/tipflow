# Risk Register

## Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WDK beta API breaks during build | Low | High | Pin exact package versions. Test early. |
| Node.js 22 requirement conflicts | Low | Medium | Use nvm to manage versions |
| EVM testnet (Sepolia) rate limiting | Medium | Medium | Use multiple free RPC providers (Alchemy, dRPC) |
| TON testnet instability | Medium | Medium | Have fallback to EVM-only if TON fails |
| WDK Indexer API key registration fails | Low | High | Register immediately on Day 1 |
| Gasless transactions don't work (ERC-4337/TON) | Medium | Low | This is a stretch goal; core works without it |
| Polyfill/bundling issues with WDK in Node.js | Medium | Medium | WDK is Node.js native; fewer issues than RN |

## Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Feature creep | High | High | Strict MoSCoW. Must-haves only in Days 1-3 |
| Integration issues between agent and dashboard | Medium | Medium | Define API contract on Day 1 |
| Demo video takes longer than expected | Medium | Medium | Allocate full Day 6. Script in advance |
| WDK learning curve | Medium | Medium | Focus on well-documented modules (EVM, TON) |

## Judging Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Judges don't value tipping bot concept | Low | High | Frame as "agentic commerce infrastructure" not just "tip jar" |
| Rule-based agent scored low on "Agent Intelligence" | Medium | High | Add clear decision-making logic with explanations. Consider free LLM integration |
| Testnet-only seen as not viable | Low | Medium | Explain mainnet path in README and video |
| Solo submission seen as less credible | Low | Low | Quality of output speaks for itself |

## WDK-Specific Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WDK packages not installable (npm issues) | Low | Critical | Test install on Day 1 before committing to strategy |
| Seed phrase management in Node.js server | Medium | Medium | Use env variables, never commit. Clear security docs |
| Transaction failures on testnet | Medium | Medium | Build retry logic. Show error handling in demo |
| TON derivation path breaking change | Low | Low | Use latest beta.6+ packages consistently |

## Zero-Cost Constraint Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| No free LLM available locally | Medium | Medium | Use rule-based decision engine. Still qualifies as "agent" |
| Free RPC providers have low rate limits | Medium | Low | Cache responses. Use multiple providers |
| OBS Studio recording quality | Low | Low | Test recording setup before final day |
| No hosting for live demo | Medium | Low | Project should be "runnable locally" per rules |

## Critical Path

The critical path is:
1. WDK SDK installs and works (Day 1) — **GATE**
2. Can create wallet and send testnet tx (Day 2) — **GATE**
3. Dashboard connects to agent API (Day 4) — **GATE**
4. Demo video recorded and uploaded (Day 6) — **GATE**

If any gate fails, immediately reassess scope. Cut features, not quality.
