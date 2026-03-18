# TipFlow — Critical Gaps Fix Plan

## HACKATHON EVALUATION CRITERIA
Projects are assessed on:
1. **Correctness** — Does it actually work? Real transactions?
2. **Autonomy** — Does the agent operate independently?
3. **Real-world viability** — Would this work in production?

## CRITICAL FINDING: FAKE SERVICES USING REAL WDK PACKAGES

We have `@tetherto/wdk-protocol-bridge-usdt0-evm` and `@tetherto/wdk-protocol-lending-aave-evm` INSTALLED but our bridge.service.ts and lending.service.ts don't use them. They just log intent. This is the #1 thing judges will catch.

## PLAN: 5 High-Impact Changes (2 days)

### 1. REAL Bridge Service — Use WDK Bridge Protocol (HIGH PRIORITY)
**File:** `agent/src/services/bridge.service.ts`
- Import `Usdt0ProtocolEvm` from `@tetherto/wdk-protocol-bridge-usdt0-evm`
- Register bridge protocol with WDK in wallet.service.ts
- Replace fake `executeBridge()` with real `bridgeProtocol.bridge()` call
- Add `quoteBridge()` using real `bridgeProtocol.quoteBridge()`
- Track real tx hashes from bridge execution
- Graceful fallback if testnet contracts unavailable

### 2. REAL Lending Service — Use WDK Aave Protocol (HIGH PRIORITY)
**File:** `agent/src/services/lending.service.ts`
- Import `AaveProtocolEvm` from `@tetherto/wdk-protocol-lending-aave-evm`
- Register Aave protocol with WDK
- Replace fake `supply()` with real `aave.supply()` call
- Replace fake `withdraw()` with real `aave.withdraw()` call
- Add real `getAccountData()` for health factor, collateral info
- Add `quoteSupply()` and `quoteWithdraw()` for fee estimates
- Graceful fallback if Aave not available on testnet

### 3. Add Missing WDK Packages — Broader Chain Support
- Install `@tetherto/wdk-wallet-tron-gasfree` — Tron gasless (free USDT transfers!)
- Install `@tetherto/wdk-mcp-toolkit` — MCP integration for AI agents
- Register Tron gasfree in wallet.service.ts
- This shows judges we deeply integrated the WDK ecosystem

### 4. MCP Server Integration — True AI Agent Infrastructure
- Use `@tetherto/wdk-mcp-toolkit` to expose wallet operations as MCP tools
- This is EXACTLY what the hackathon asks: "agents as economic infrastructure"
- Create `src/mcp-server.ts` that exposes tip/bridge/lend as MCP tools
- Any AI agent (Claude, GPT, etc.) can then use our tipping infrastructure

### 5. Fix All Non-Functional Buttons & Placeholders
- Fix `tip-templates-section` missing ID (scroll target broken)
- Remove hardcoded test address in OrchestratorPanel
- Fix any "Loading..." text without skeleton states
- Verify every button actually calls an API
- Add proper error states for all async operations

## FILES TO MODIFY:
1. `agent/src/services/wallet.service.ts` — Register bridge + lending protocols
2. `agent/src/services/bridge.service.ts` — REWRITE with real WDK bridge
3. `agent/src/services/lending.service.ts` — REWRITE with real WDK lending
4. `agent/package.json` — Add tron-gasfree, mcp-toolkit
5. `agent/src/mcp-server.ts` — NEW: MCP server for AI agent integration
6. `agent/src/index.ts` — Register MCP server startup
7. `dashboard/src/App.tsx` — Fix tip-templates-section ID
8. `dashboard/src/components/OrchestratorPanel.tsx` — Fix hardcoded address

## WHY THIS WINS:
- **Correctness**: Bridge and lending actually execute onchain via WDK
- **Autonomy**: Agent auto-bridges to cheapest chain, auto-supplies idle funds to Aave
- **Real-world viability**: MCP integration means ANY AI agent can use our infrastructure
- **WDK Integration**: We use MORE WDK packages than any other competitor
- **Originality**: MCP-based tipping infrastructure is unique — no competitor has this
