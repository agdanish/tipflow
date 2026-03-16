# Master Brief — Tether WDK Hackathon Strategy

## Executive Summary

The Tether Hackathon Galactica has 324 registrants but only 8 submissions across 4 tracks. The **Tipping Bot track has ZERO submissions**. We recommend building an AI-powered multi-chain tipping agent with a web dashboard, targeting the Tipping Bot track for a near-guaranteed $3,000-$5,000 track prize, while also competing for Overall prizes ($6,000/$3,000/$1,000).

## Recommended Strategy

**Build: "TipFlow" — AI-Powered Multi-Chain Tipping Agent**

- **Track:** Tipping Bot (0 competitors)
- **Architecture:** Node.js agent backend (WDK SDK) + React/Vite/Tailwind web dashboard
- **WDK Modules:** wallet-evm, wallet-ton, core SDK
- **Agent Intelligence:** Rule-based autonomous decision engine (chain selection, fee optimization) + optional Ollama LLM integration
- **Chains:** Ethereum Sepolia (testnet) + TON Testnet
- **Cost:** $0 (all free/open-source tools)

## Strongest Evidence Supporting This Strategy

1. **Zero competitors in Tipping Bot track** — confirmed from DoraHacks buidl page
2. **Tipping Bot 1st place = $3,000** + eligible for Overall prizes up to $6,000
3. **Judging rewards agent autonomy** — our agent makes real decisions (chain selection, fee optimization)
4. **WDK is designed for exactly this** — multi-chain wallets + programmable payments
5. **Tech stack aligns with user's skills** — React, TypeScript, Tailwind, Vite
6. **6-day timeline is feasible** — focused scope, no over-engineering
7. **Rules say "strong architecture matters more than surface UI"** — favors solid agent + clean dashboard over flashy but broken features

## Critical Unknowns

1. Whether WDK npm packages install cleanly on user's Windows machine
2. Whether user has Node.js 22+ installed
3. Whether local LLM (Ollama) is feasible on user's hardware
4. WDK Indexer API key registration speed/availability
5. Free EVM RPC provider reliability for Sepolia testnet

## Top Reasons This Strategy Can Win

1. Zero competition in track = floor prize of $3,000
2. Clean, working demo beats complex, broken competitors
3. Multi-chain tipping is novel and practical
4. Agent autonomy is demonstrable (chain selection, fee optimization)
5. Real WDK integration (not mocked)
6. Professional web dashboard for compelling demo video

## Top Reasons This Strategy Can Fail

1. WDK SDK doesn't install/work on Windows (critical gate — test Day 1)
2. Agent Intelligence score too low without real LLM (mitigate: clear decision logic + explanations)
3. Testnet instability during demo recording
4. Scope creep eating into polish time
5. Demo video quality insufficient
