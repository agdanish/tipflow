---
name: TipFlow
description: AI-powered tipping agent for Rumble creators using Tether WDK. Send crypto tips, manage wallets, automate tipping based on watch-time, and build community tipping pools.
version: 1.0.0
author: Danish A
license: Apache-2.0
tags:
  - tipping
  - crypto
  - usdt
  - rumble
  - wdk
  - wallet
  - ethereum
  - ton
---

# TipFlow Agent Skill

TipFlow is an AI-powered tipping agent for Rumble video creators. It uses Tether WDK to manage multi-chain wallets (Ethereum Sepolia + TON Testnet) and lets you send USDT and native crypto tips through natural language. TipFlow learns your tipping patterns, makes autonomous recommendations, and supports community tipping pools, watch-time auto-tipping, and event-triggered tips.

**API Base URL:** `http://localhost:3001/api`

All requests use JSON. POST/PUT requests require `Content-Type: application/json`.

---

## Actions

### 1. Send a Tip

Send crypto to a recipient address.

**Endpoint:** `POST /api/tip`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | yes | Wallet address (0x... for Ethereum, UQ/EQ... for TON) |
| `amount` | string | yes | Amount to send (e.g. "0.01") |
| `token` | string | no | `"native"` (ETH/TON) or `"usdt"` (ERC-20). Default: `"native"` |
| `preferredChain` | string | no | `"ethereum-sepolia"` or `"ton-testnet"`. Auto-detected from address if omitted |
| `message` | string | no | Optional tip message/memo |

**Example:**
```json
POST /api/tip
{
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "amount": "0.005",
  "token": "native",
  "message": "Great video!"
}
```

**Response:** Returns `{ result }` with `status` ("confirmed" or "failed"), `txHash`, `chainId`, `fee`, and `blockNumber`.

---

### 2. Send a Batch Tip

Tip up to 10 recipients in one operation.

**Endpoint:** `POST /api/tip/batch`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipients` | array | yes | Array of `{ address, amount }` objects (max 10) |
| `token` | string | no | `"native"` or `"usdt"`. Default: `"native"` |
| `preferredChain` | string | no | Chain to use |

**Example:**
```json
POST /api/tip/batch
{
  "recipients": [
    { "address": "0xabc...123", "amount": "0.003" },
    { "address": "0xdef...456", "amount": "0.005" }
  ],
  "token": "native"
}
```

---

### 3. Send a Split Tip

Divide a total amount among up to 5 recipients by percentage.

**Endpoint:** `POST /api/tip/split`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipients` | array | yes | Array of `{ address, percentage }` objects (max 5) |
| `totalAmount` | string | yes | Total amount to split |
| `token` | string | no | `"native"` or `"usdt"`. Default: `"native"` |
| `chainId` | string | no | Chain to use |

**Example:**
```json
POST /api/tip/split
{
  "recipients": [
    { "address": "0xabc...123", "percentage": 60 },
    { "address": "0xdef...456", "percentage": 40 }
  ],
  "totalAmount": "0.01",
  "token": "native"
}
```

Percentages must sum to 100.

---

### 4. Send a Tip via Natural Language

Parse a natural language command into a structured tip and optionally execute it.

**Endpoint:** `POST /api/tip/parse`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | yes | Natural language tip command |

**Example:**
```json
POST /api/tip/parse
{
  "input": "send 0.01 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
}
```

**Response:** Returns `{ parsed }` with extracted `recipient`, `amount`, `token`, and `confidence` score. Use the parsed result with `POST /api/tip` to execute.

---

### 5. Chat with the Agent

Have a conversation with TipFlow. The agent understands intents like tipping, balance queries, fee comparisons, history lookups, and help requests. It can execute tips directly from chat.

**Endpoint:** `POST /api/chat`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | yes | Your message to the agent |

**Example:**
```json
POST /api/chat
{
  "message": "What are my wallet balances?"
}
```

The agent detects intents: `tip`, `balance`, `fee`, `address`, `history`, `help`.

---

### 6. Check Wallet Balances

Get native and USDT balances across all chains.

**Endpoint:** `GET /api/wallet/balances`

**Response:** Returns `{ balances }` with per-chain native and USDT token balances.

---

### 7. Get Wallet Addresses

**Endpoint:** `GET /api/wallet/addresses`

**Response:** Returns `{ addresses }` mapping chain IDs to wallet addresses.

---

### 8. Estimate Fees

Estimate transaction fees across all chains before sending.

**Endpoint:** `GET /api/tip/estimate?recipient={address}&amount={amount}`

**Example:** `GET /api/tip/estimate?recipient=0xabc...123&amount=0.01`

**Response:** Returns `{ estimates }` array with `chainId` and `fee` for each chain.

---

### 9. Compare Fees Across Chains

**Endpoint:** `GET /api/fees/compare?recipient={address}&amount={amount}`

Returns a fee comparison with a `cheapest` recommendation.

---

### 10. Register a Rumble Creator

Add a creator to TipFlow for tipping and tracking.

**Endpoint:** `POST /api/rumble/creators`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Creator's display name |
| `channelUrl` | string | yes | Rumble channel URL |
| `walletAddress` | string | yes | Creator's wallet address |
| `category` | string | no | Content category |

**Example:**
```json
POST /api/rumble/creators
{
  "name": "TechReviewer",
  "channelUrl": "https://rumble.com/c/TechReviewer",
  "walletAddress": "0xabc...123",
  "category": "technology"
}
```

---

### 11. List Rumble Creators

**Endpoint:** `GET /api/rumble/creators`

Returns all registered creators with their profiles, tip history, and subscriber counts.

---

### 12. Get Creator Details

**Endpoint:** `GET /api/rumble/creators/{id}`

Returns a single creator profile by ID.

---

### 13. Record Watch Time

Record that a user watched a video, used for auto-tipping recommendations.

**Endpoint:** `POST /api/rumble/watch`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | yes | Viewer user ID |
| `creatorId` | string | yes | Creator ID |
| `videoId` | string | yes | Video ID |
| `watchPercentage` | number | yes | Percentage watched (0-100) |
| `durationSeconds` | number | yes | Video duration in seconds |

---

### 14. Set Up Watch-Time Auto-Tipping Rules

Configure rules to automatically tip creators when watch-time thresholds are met.

**Endpoint:** `POST /api/rumble/auto-tip/rules`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | yes | Viewer user ID |
| `minWatchPercentage` | number | yes | Minimum watch % to trigger (e.g. 80) |
| `tipAmount` | string | yes | Amount to tip per trigger |
| `maxDailyTips` | number | yes | Maximum auto-tips per day |
| `enabledCategories` | array | no | Limit to specific content categories |

---

### 15. Get Auto-Tip Recommendations

**Endpoint:** `GET /api/rumble/auto-tip/recommendations/{userId}`

Returns creators recommended for auto-tipping based on watch patterns.

---

### 16. Create a Community Tipping Pool

Create a shared pool where viewers contribute toward a goal for a creator.

**Endpoint:** `POST /api/rumble/pools`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `creatorId` | string | yes | Creator the pool supports |
| `name` | string | yes | Pool name |
| `goalAmount` | string | yes | Funding goal amount |
| `description` | string | no | Pool description |

**Example:**
```json
POST /api/rumble/pools
{
  "creatorId": "creator-1",
  "name": "New Camera Fund",
  "goalAmount": "100",
  "description": "Help TechReviewer upgrade their camera"
}
```

---

### 17. Contribute to a Pool

**Endpoint:** `POST /api/rumble/pools/{id}/contribute`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contributor` | string | yes | Contributor name or ID |
| `amount` | string | yes | Contribution amount |

---

### 18. List All Pools

**Endpoint:** `GET /api/rumble/pools`

---

### 19. Register Event Triggers

Set up automatic tips triggered by creator events.

**Endpoint:** `POST /api/rumble/events/triggers`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `creatorId` | string | yes | Creator ID |
| `eventType` | string | yes | `"new_video"`, `"milestone"`, or `"live_stream"` |
| `tipAmount` | string | yes | Amount to tip when event fires |
| `enabled` | boolean | no | Whether trigger is active |

---

### 20. View Creator Leaderboard

**Endpoint:** `GET /api/rumble/leaderboard?limit={n}`

Returns creators ranked by tips received, engagement, and community support.

---

### 21. Set Up Collab Splits

Define tip splits for multi-creator collaborations.

**Endpoint:** `POST /api/rumble/collab-splits`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videoId` | string | yes | Video ID |
| `splits` | array | yes | Array of `{ creatorId, percentage }` objects |

---

### 22. Set Autonomy Policies

Configure rules for autonomous tipping decisions.

**Endpoint:** `POST /api/autonomy/policies`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Policy name |
| `type` | string | yes | `"budget_limit"`, `"recipient_allowlist"`, `"time_restriction"`, or `"amount_cap"` |
| `rules` | object | yes | Policy-specific rules (e.g. `{ maxDaily: "1.0" }`) |
| `enabled` | boolean | no | Whether policy is active |

**Example:**
```json
POST /api/autonomy/policies
{
  "name": "Daily Budget",
  "type": "budget_limit",
  "rules": { "maxDaily": "0.5", "currency": "ETH" },
  "enabled": true
}
```

---

### 23. List Autonomy Policies

**Endpoint:** `GET /api/autonomy/policies`

---

### 24. View Autonomous Recommendations

**Endpoint:** `GET /api/autonomy/recommendations`

Returns AI-generated tipping recommendations with confidence scores (0-100) and reasoning.

---

### 25. View Autonomy Profile

**Endpoint:** `GET /api/autonomy/profile`

Returns learned tipping patterns, preferences, and behavior analysis.

---

### 26. View Pending Decisions

**Endpoint:** `GET /api/autonomy/decisions`

Returns autonomous decisions awaiting approval or already processed.

---

### 27. Approve an Autonomous Decision

**Endpoint:** `POST /api/autonomy/decisions/{id}/approve`

---

### 28. Reject an Autonomous Decision

**Endpoint:** `POST /api/autonomy/decisions/{id}/reject`

---

### 29. Evaluate Autonomy Performance

**Endpoint:** `POST /api/autonomy/evaluate`

Runs self-assessment on autonomous decision quality.

---

### 30. Check Transaction History

**Endpoint:** `GET /api/agent/history`

**Query Parameters:**
| Param | Description |
|-------|-------------|
| `search` | Search by recipient address or tx hash |
| `chain` | Filter by `"ethereum"` or `"ton"` |
| `status` | Filter by `"confirmed"` or `"failed"` |
| `dateFrom` | ISO date string start |
| `dateTo` | ISO date string end |

---

### 31. Export Tip History

**Endpoint:** `GET /api/agent/history/export?format={format}`

**Formats:** `csv`, `json`, `markdown`, `summary`

Returns tip history in the requested format. Use `summary` for a human-readable report.

---

### 32. Get Statistics

**Endpoint:** `GET /api/agent/stats`

Returns aggregate statistics: total tips, volume, chain distribution, daily trends.

---

### 33. Get Advanced Analytics

**Endpoint:** `GET /api/agent/analytics`

Returns detailed analytics including cumulative volume, hourly heatmap, top recipients, and trends.

---

### 34. Send Gasless Tip (ERC-4337)

Send a tip with zero gas fees using Account Abstraction.

**Endpoint:** `POST /api/tip/gasless`

Same parameters as `POST /api/tip`. Requires ERC-4337 bundler/paymaster configuration.

---

### 35. Schedule a Tip

**Endpoint:** `POST /api/tip/schedule`

Additional parameters beyond standard tip fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduleAt` | string | yes | ISO timestamp for when to execute |
| `recurring` | string | no | `"daily"`, `"weekly"`, or `"monthly"` |

---

### 36. List Scheduled Tips

**Endpoint:** `GET /api/tip/scheduled`

---

### 37. Cancel a Scheduled Tip

**Endpoint:** `DELETE /api/tip/schedule/{id}`

---

### 38. Set Spending Limits

**Endpoint:** `PUT /api/limits`

**Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| `perTip` | string | Maximum per-tip amount |
| `daily` | string | Maximum daily spend |
| `weekly` | string | Maximum weekly spend |
| `enabled` | boolean | Whether limits are enforced |

---

### 39. Get Spending Limits

**Endpoint:** `GET /api/limits`

---

### 40. Health Check

**Endpoint:** `GET /api/health`

Returns service status, AI availability (LLM or rule-based), registered chains, and timestamp.

---

### 41. Get Gas Prices

**Endpoint:** `GET /api/gas`

Returns real-time gas prices for all registered chains.

---

### 42. Get Gas Speed Options

**Endpoint:** `GET /api/gas/speeds`

Returns slow/normal/fast gas options with estimated fees and confirmation times.

---

### 43. Get Live Crypto Prices

**Endpoint:** `GET /api/prices`

Returns ETH, TON, and USDT prices in USD from CoinGecko.

---

### 44. Resolve ENS Name

**Endpoint:** `GET /api/ens/resolve?name={name.eth}`

Resolves a .eth name to a wallet address.

---

### 45. Reverse ENS Lookup

**Endpoint:** `GET /api/ens/reverse?address={0x...}`

Resolves a wallet address to its .eth name.

---

### 46. Agent Settings

**Get:** `GET /api/settings`
**Update:** `PUT /api/settings`

Settings include `personality`, `defaultChain`, `defaultToken`, `autoConfirmEnabled`, `autoConfirmThreshold`, and notification preferences.

---

### 47. Manage Contacts

- **List:** `GET /api/contacts`
- **Add:** `POST /api/contacts` with `{ name, address, chain?, group?, notes? }`
- **Update:** `PUT /api/contacts/{id}`
- **Delete:** `DELETE /api/contacts/{id}`
- **Export:** `GET /api/contacts/export` (JSON) or `GET /api/contacts/export/csv`

---

### 48. Manage Tip Templates

- **List:** `GET /api/templates`
- **Create:** `POST /api/templates` with `{ name, recipient, amount, token?, chain?, message? }`
- **Delete:** `DELETE /api/templates/{id}`

---

### 49. Conditional Tips

Register conditions that auto-trigger tips.

- **List:** `GET /api/conditions`
- **Create:** `POST /api/conditions` with `{ type, threshold, recipient, amount, token? }`
  - Types: `"gas_below"`, `"balance_above"`, `"time_of_day"`
- **Delete:** `DELETE /api/conditions/{id}`

---

### 50. Tip Goals

- **List:** `GET /api/goals`
- **Create:** `POST /api/goals` with `{ name, targetAmount, description? }`
- **Update:** `PUT /api/goals/{id}`
- **Delete:** `DELETE /api/goals/{id}`

---

## Example Conversations

These show how an AI agent uses TipFlow through natural language, translating user requests into API calls.

### Sending a Simple Tip

**User:** "Tip 0.005 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"

**Agent thinking:** User wants to send a tip. I'll parse the natural language first, then execute.

```
1. POST /api/tip/parse { "input": "Tip 0.005 ETH to 0x742d35..." }
   -> { parsed: { recipient: "0x742d35...", amount: "0.005", token: "native", confidence: 0.95 } }

2. POST /api/tip { "recipient": "0x742d35...", "amount": "0.005", "token": "native" }
   -> { result: { status: "confirmed", txHash: "0xabc...", chainId: "ethereum-sepolia" } }
```

**Agent:** "Done! I sent 0.005 ETH to 0x742d...f2bD18 on Ethereum Sepolia. Transaction hash: 0xabc..."

---

### Checking Balances Before Tipping

**User:** "How much do I have in my wallets?"

```
1. GET /api/wallet/balances
   -> { balances: { "ethereum-sepolia": { native: "0.15 ETH", usdt: "10.00 USDT" }, "ton-testnet": { native: "2.5 TON" } } }
```

**Agent:** "Your balances are: Ethereum Sepolia has 0.15 ETH and 10.00 USDT. TON Testnet has 2.5 TON."

---

### Finding the Cheapest Chain

**User:** "I want to tip 0x742d...f2bD18 0.01 ETH. Which chain is cheapest?"

```
1. GET /api/fees/compare?recipient=0x742d...&amount=0.01
   -> { comparison: [...], cheapest: { chainId: "ethereum-sepolia", fee: "0.000021 ETH" } }
```

**Agent:** "Ethereum Sepolia is the cheapest option at 0.000021 ETH in fees. Want me to send the tip?"

---

### Batch Tipping Multiple Creators

**User:** "Tip my top 3 creators: 0xabc 0.01, 0xdef 0.02, 0xghi 0.015"

```
1. POST /api/tip/batch {
     "recipients": [
       { "address": "0xabc...", "amount": "0.01" },
       { "address": "0xdef...", "amount": "0.02" },
       { "address": "0xghi...", "amount": "0.015" }
     ],
     "token": "native"
   }
```

**Agent:** "Batch tip complete. 3/3 tips confirmed totaling 0.045 ETH."

---

### Setting Up Auto-Tipping

**User:** "Auto-tip creators when I watch more than 80% of their videos, 0.002 ETH each, max 5 per day"

```
1. POST /api/rumble/auto-tip/rules {
     "userId": "default",
     "minWatchPercentage": 80,
     "tipAmount": "0.002",
     "maxDailyTips": 5
   }
```

**Agent:** "Auto-tipping is set up. When you watch 80%+ of a video, I'll tip the creator 0.002 ETH, up to 5 times per day."

---

### Creating a Community Pool

**User:** "Create a pool called 'New Camera Fund' for creator TechReviewer with a 50 USDT goal"

```
1. GET /api/rumble/creators -> find TechReviewer's ID
2. POST /api/rumble/pools {
     "creatorId": "creator-xyz",
     "name": "New Camera Fund",
     "goalAmount": "50",
     "description": "Help TechReviewer upgrade their camera equipment"
   }
```

**Agent:** "Pool created. Share the pool ID with other viewers so they can contribute."

---

### Setting a Budget Policy

**User:** "Don't let me spend more than 0.1 ETH per day on tips"

```
1. POST /api/autonomy/policies {
     "name": "Daily ETH Budget",
     "type": "budget_limit",
     "rules": { "maxDaily": "0.1", "currency": "ETH" },
     "enabled": true
   }
```

**Agent:** "Budget policy set. I'll enforce a maximum of 0.1 ETH in daily tips."

---

### Reviewing Autonomous Recommendations

**User:** "What tips do you recommend?"

```
1. GET /api/autonomy/recommendations
   -> [
     { id: "rec-1", creator: "TechReviewer", amount: "0.005", confidence: 87, reason: "Watched 12 videos this week" },
     { id: "rec-2", creator: "CookingPro", amount: "0.003", confidence: 72, reason: "Consistent viewer for 3 weeks" }
   ]
```

**Agent:** "I have 2 recommendations: Tip TechReviewer 0.005 ETH (87% confidence, you watched 12 videos this week) and CookingPro 0.003 ETH (72% confidence, consistent viewer). Shall I approve either?"

---

### Exporting Tip History

**User:** "Export my tip history as CSV"

```
1. GET /api/agent/history/export?format=csv
   -> CSV content with all tip transactions
```

**Agent:** "Here's your tip history exported as CSV with all transactions."

---

### Using Chat Interface

**User:** "Tell me about my tipping stats"

```
1. POST /api/chat { "message": "Tell me about my tipping stats" }
   -> Agent processes intent, queries stats internally, returns formatted response
```

This endpoint handles the full conversation loop internally, including intent detection and response generation.

---

## Chain Reference

| Chain ID | Name | Currency | Address Format |
|----------|------|----------|----------------|
| `ethereum-sepolia` | Ethereum Sepolia | ETH | `0x` prefixed, 42 chars |
| `ton-testnet` | TON Testnet | TON | `UQ` or `EQ` prefixed |
| `ethereum-sepolia-gasless` | Ethereum Sepolia (Gasless) | ETH | `0x` prefixed, 42 chars |
| `ton-testnet-gasless` | TON Testnet (Gasless) | TON | `UQ` or `EQ` prefixed |

## Token Reference

| Token | Description |
|-------|-------------|
| `native` | Chain's native currency (ETH or TON) |
| `usdt` | Tether USDT (ERC-20 on Ethereum) |

## Error Handling

All endpoints return errors as `{ "error": "description" }` with appropriate HTTP status codes:
- `400` — Invalid input (missing fields, bad values)
- `404` — Resource not found
- `429` — Rate limited
- `500` — Server error

## Rate Limits

Transaction endpoints (`/api/tip`, `/api/tip/batch`, `/api/tip/split`, `/api/tip/gasless`, `/api/chat`) are rate-limited to prevent abuse.
