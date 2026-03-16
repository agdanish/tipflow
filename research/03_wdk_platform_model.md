# WDK Platform Model

## Architecture

- **Core:** `@tetherto/wdk` — orchestrator, modular plugin framework
- **Design:** Self-custodial, stateless, cross-platform
- **Version:** v1.0.0-beta.6
- **License:** Apache 2.0, free to use
- **Runtime:** Node.js 22+, React Native, Bare runtime

## Module System

### Wallet Modules
| Chain | Package | Key Features |
|-------|---------|-------------|
| Bitcoin | wdk-wallet-btc | BIP-84 SegWit |
| Ethereum/EVM | wdk-wallet-evm | BIP-44, EIP-1559, all EVM chains |
| EVM ERC-4337 | wdk-wallet-evm-erc-4337 | Account abstraction, gasless |
| TON | wdk-wallet-ton | V5R1 contracts |
| TON Gasless | wdk-wallet-ton-gasless | Gasless Jetton transfers |
| TRON | wdk-wallet-tron | BIP-44 |
| TRON Gasfree | wdk-wallet-tron-gasfree | Gas-free TRC20 |
| Solana | wdk-wallet-solana | BIP-44 |
| Spark | wdk-wallet-spark | Lightning Network |

### DeFi Protocol Modules
| Protocol | Package | Capability |
|----------|---------|-----------|
| Velora Swap | wdk-protocol-swap-velora-evm | DEX aggregation |
| USDT0 Bridge EVM | wdk-protocol-bridge-usdt0-evm | Cross-chain via LayerZero |
| USDT0 Bridge TON | wdk-protocol-bridge-usdt0-ton | TON bridge |
| Aave Lending | wdk-protocol-lending-aave-evm | Supply/borrow/repay/withdraw |

## Core API

```typescript
// Initialize
const wdk = new WDK(seedPhrase)
  .registerWallet('ethereum', WalletManagerEvm, { provider: rpcUrl })
  .registerProtocol('swap-velora-evm', SwapveloraEvm)

// Wallet operations
const account = wdk.getAccount('ethereum', 0)
await account.getAddress()
await account.getBalance()
await account.getTokenBalance(tokenAddress)
await account.sendTransaction({ to, value, data })
await account.estimateTransaction(params)
await account.getTransactionHistory()

// DeFi operations
const swap = account.getSwapProtocol('swap-velora-evm')
const bridge = account.getBridgeProtocol('bridge-usdt0-evm')
const lending = account.getLendingProtocol('lending-aave-evm')
```

## AI Agent Integration

### Agent Skills (SKILL.md files)
- Install: `npx skills add tetherto/wdk-agent-skills`
- Platforms: OpenClaw, Claude, Cursor, Windsurf, MCP-compatible
- Capabilities: wallet CRUD, transfers, swaps, bridges, lending, gasless tx

### MCP Toolkit (`@tetherto/wdk-mcp-toolkit`)
- MCP server wrapping WDK for AI agents
- Tool categories: WALLET, PRICING, INDEXER, SWAP, BRIDGE, LENDING, FIAT
- Write operations require human confirmation (elicitations)
- Custom tool registration supported

## Required Config

| Item | How to Get | Cost |
|------|-----------|------|
| WDK Indexer API Key | wdk-api.tether.io/register | Free |
| EVM RPC URLs | Alchemy/Tenderly/dRPC free tier | Free |
| Seed phrase | WDK.getRandomSeedPhrase() | N/A |

## Key Limitations

1. Beta software — APIs may change
2. No built-in persistence (stateless)
3. Must supply own RPC provider URLs per chain
4. React Native has ~40 polyfill peer deps
5. Node.js 22+ required
6. TON derivation path breaking change in beta.6
7. MCP write ops need elicitations support
