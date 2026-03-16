# CLAUDE.md — Tether WDK Hackathon Project

## Mission
Build a winning submission for Tether Hackathon Galactica: WDK Edition 1.
Target: Tipping Bot track (0 competitors) + Overall prizes.
Deadline: March 22, 2026 23:59 UTC.

## Project: TipFlow — AI-Powered Multi-Chain Tipping Agent
- Node.js agent backend using WDK SDK
- React + Vite + Tailwind web dashboard
- Track: Tipping Bot
- License: Apache 2.0

## Confirmed Constraints
- ZERO budget — no paid APIs, servers, or services
- Solo developer with AI assistance
- WDK integration is mandatory (JS/TS)
- Must submit: GitHub repo + YouTube demo video (≤5 min)
- Must be easy for judges to run (one-command startup)
- Node.js 22+ required for WDK

## Anti-Hallucination Rules
- Never invent WDK API methods — check docs
- Never fake transaction flows — use real testnet
- Never claim features work without testing
- Pin exact package versions
- GitHub org is `tetherto` (NOT `nicetytether`)

## Code Principles
- TypeScript throughout
- Clean, readable code over clever code
- Every feature must work end-to-end
- Error handling on all wallet operations
- No mocked WDK calls in production code
- Env vars for secrets (seed phrase, API keys)
- Apache 2.0 license header

## Quality Bar
- `npm install && npm run dev` must work
- No broken buttons or fake features
- Clean loading and error states
- Real testnet transactions
- Clear README with setup instructions

## WDK Packages
- @tetherto/wdk (core)
- @tetherto/wdk-wallet-evm (Ethereum/EVM)
- @tetherto/wdk-wallet-ton (TON)
- Stretch: wdk-wallet-evm-erc-4337, wdk-wallet-ton-gasless

## Judging Criteria (7 categories)
1. Agent Intelligence
2. WDK Wallet Integration
3. Technical Execution
4. Agentic Payment Design
5. Originality
6. Polish & Ship-ability
7. Presentation & Demo

## Build Gate
Do not start coding until user explicitly approves the strategy.
