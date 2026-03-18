"""Generate TipFlow COMPLETE Information Architecture PDF — Frontend + Backend."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

doc = SimpleDocTemplate("INFORMATION_ARCHITECTURE.pdf", pagesize=A4,
    rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle('H1x', parent=styles['Heading1'], fontSize=18, spaceAfter=10, textColor=HexColor('#22c55e')))
styles.add(ParagraphStyle('H2x', parent=styles['Heading2'], fontSize=13, spaceAfter=6, textColor=HexColor('#3b82f6')))
styles.add(ParagraphStyle('H3x', parent=styles['Heading3'], fontSize=10, spaceAfter=4, textColor=HexColor('#a855f7')))
styles.add(ParagraphStyle('B', parent=styles['Normal'], fontSize=8, spaceAfter=3, leading=11))
styles.add(ParagraphStyle('Sm', parent=styles['Normal'], fontSize=7, spaceAfter=2, leading=9, textColor=HexColor('#555555')))

story = []

def tbl(data, widths, header_color='#22c55e'):
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor(header_color)),
        ('TEXTCOLOR', (0,0), (-1,0), HexColor('#ffffff')),
        ('FONTSIZE', (0,0), (-1,-1), 6.5),
        ('GRID', (0,0), (-1,-1), 0.4, HexColor('#cccccc')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#f9f9f9'), HexColor('#ffffff')]),
    ]))
    return t

# ═══ COVER ═══
story.append(Spacer(1, 60))
story.append(Paragraph("TipFlow — Complete Information Architecture", styles['H1x']))
story.append(Paragraph("Frontend (118 components) + Backend (43 services, 238 endpoints)", styles['H2x']))
story.append(Spacer(1, 12))
story.append(Paragraph("AI-Powered Multi-Chain Tipping Agent for Rumble Creators<br/>Built with Tether WDK | Hackathon Galactica: WDK Edition 1", styles['B']))
story.append(Spacer(1, 12))

story.append(tbl([
    ['Category', 'Count', 'Details'],
    ['Backend Services', '43', 'wallet, ai, streaming, escrow, dca, bridge, lending, swap, treasury, rumble, reputation, orchestrator, predictor, risk, x402, memory, queue, identity, discovery, propagation, PoE, smoothing, policies, etc.'],
    ['API Endpoints', '238', 'REST + SSE. Rate-limited: general 30/min, transactions 5/min'],
    ['Dashboard Components', '118', 'React 19 + Tailwind CSS v4 + Lucide icons'],
    ['WDK Packages', '12', 'wdk, wallet-evm/ton/tron/btc/solana, erc-4337, ton-gasless, bridge-usdt0-evm, lending-aave-evm, swap-velora-evm, mcp-toolkit'],
    ['Blockchain Chains', '9', 'ethereum-sepolia, ton-testnet, tron-nile, btc-testnet, solana-devnet, plasma, stable + 2 gasless variants'],
    ['AI Capabilities', '7', 'NLP parse, chain reasoning, intent detection, tip messages, risk explanations, decision explanations, activity summary'],
    ['Pipeline Steps', '11', 'INTAKE > LIMIT > ANALYZE > FEE_OPT > ECONOMIC > RISK > REASON > CONSENSUS > EXECUTE > VERIFY > REPORT'],
    ['Innovations', '12', 'Engagement scoring, TipPolicy DSL, x402, PoE, revenue smoothing, discovery, propagation, multi-agent, MCP, identity, risk engine, decision engine'],
    ['Tests', '20', '5 test suites: TipPolicy, X402, TipQueue, PlatformAdapter, AgentIdentity'],
    ['Demo Data', '70+', '15 creators, 50 tips, 25 activities, 6 policies, 3 DCA, 3 goals, 2 pools, 5 memories, predictions'],
], [60, 35, 465], '#1a1b24'))
story.append(PageBreak())

# ═══ BACKEND SERVICES ═══
story.append(Paragraph("1. Backend Services — Real vs Simulated", styles['H1x']))
story.append(Paragraph("Services marked REAL execute actual WDK blockchain transactions on testnet.", styles['B']))

story.append(tbl([
    ['Service', 'WDK?', 'Persistence', 'Key Methods', 'Purpose'],
    ['wallet.service', 'REAL', '.seed', 'initialize(), transferNative(), transferToken(), estimateGas(), pollTransaction(), getWdkAccount()', 'Multi-chain wallet via WDK SDK (9 chains)'],
    ['ai.service', 'No', 'None', 'parseNaturalLanguageTip(), generateReasoning(), detectIntent(), generateTipMessage(), generateRiskExplanation()', 'LLM reasoning (Ollama phi3:mini + rule-based fallback)'],
    ['swap.service', 'REAL', 'None', 'getQuote(), executeSwap(), getHistory()', 'Velora DEX token swaps via wdk-protocol-swap-velora-evm'],
    ['bridge.service', 'REAL', 'None', 'getQuote(), executeBridge(), getRoutes()', 'USDT0 cross-chain via wdk-protocol-bridge-usdt0-evm'],
    ['lending.service', 'REAL', 'None', 'supply(), withdraw(), getRates(), getPosition()', 'Aave V3 via wdk-protocol-lending-aave-evm'],
    ['streaming.service', 'REAL', 'None', 'startStream(), pauseStream(), stopStream()', 'Tip streaming — periodic micro-transactions via WDK'],
    ['escrow.service', 'REAL', '.escrow.json', 'createEscrow(), releaseEscrow(), disputeEscrow()', 'Hold funds, release on condition (uses WDK transfer)'],
    ['dca.service', 'REAL', 'None', 'createPlan(), pausePlan(), cancelPlan()', 'Dollar-cost averaging — periodic installments via WDK'],
    ['receipt.service', 'No', '.receipts.json', 'generateReceipt(), verifyReceipt()', 'ECDSA-signed Proof-of-Tip receipts'],
    ['rumble.service', 'No*', '.rumble.json', 'registerCreator(), recordWatchTime(), setAutoTipRules(), createTipPool()', 'Rumble creator ecosystem (* auto-tips execute via agent)'],
    ['autonomy.service', 'No*', '.autonomy-*.json', 'analyzeTipHistory(), evaluateAndPropose(), setPolicies()', 'Autonomous decisions (* approved tips execute via WDK)'],
    ['orchestrator.service', 'No*', 'None', 'propose() — 3 agents vote: TipExecutor, Guardian, TreasuryOptimizer', 'Multi-agent consensus (* approved tips execute)'],
    ['risk-engine.service', 'No', 'None', 'assessRisk() — 8 factors: address, amount, frequency, chain, time, reputation, pattern, velocity', 'Transaction risk scoring (low/medium/high/critical)'],
    ['treasury.service', 'REAL*', '.treasury.json', 'evaluateRebalance(), getAllocation(), getYieldOpportunities()', 'Capital management (* uses lending service for yield)'],
    ['predictor.service', 'No', 'None', 'learnFromHistory(), generatePredictions(), acceptPrediction()', 'Predict next tip recipient/amount from patterns'],
    ['fee-arbitrage.service', 'REAL', 'None', 'compareFees(), getOptimalTiming(), getCurrentFees()', 'Real-time gas fee comparison across chains'],
    ['tip-policy.service', 'REAL*', 'None', 'createPolicy(), evaluatePolicy(), executePolicy()', 'Programmable money DSL (* triggered policies execute via WDK)'],
    ['x402.service', 'REAL', 'None', 'createPaymentRequirement(), executePayment()', 'HTTP 402 agent-to-agent micropayments'],
    ['agent-identity.service', 'No', 'None', 'initialize(), sign(), verify(), createChallenge()', 'Cryptographic agent identity from WDK keys'],
    ['memory.service', 'No', '.agent-memory.json', 'remember(), recall(), search(), getAllMemories()', 'Persistent agent memory (preferences, facts, context)'],
    ['tip-queue.service', 'REAL*', 'None', 'enqueue(), process()', 'Async tip processing queue (* drains via WDK)'],
    ['proof-of-engagement.service', 'No', 'None', 'attest(), verify()', 'Cryptographic engagement attestations'],
    ['revenue-smoothing.service', 'REAL*', 'None', 'enrollCreator(), evaluateSmoothing()', 'Creator income insurance (* payouts via WDK)'],
    ['creator-discovery.service', 'No', 'None', 'analyzeCreator(), getRecommendations()', 'AI angel investing — find undervalued creators'],
    ['tip-propagation.service', 'REAL*', 'None', 'createWave(), createPool()', 'Viral tipping — tip waves across social graph'],
    ['platform-adapter.service', 'No', 'None', 'adaptCreator(), adaptContent(), adaptEngagement()', 'Multi-platform normalization (Rumble + Webhook)'],
    ['contacts.service', 'No', '.contacts.json', 'addContact(), getContacts(), importContacts()', 'Address book'],
    ['templates.service', 'No', '.templates.json', 'addTemplate(), getTemplates()', 'Saved tip templates'],
    ['tags.service', 'No', '.tags.json', 'addTag(), getTag()', 'Address labels/colors'],
    ['ens.service', 'REAL', 'None', 'resolveENS(), lookupAddress()', 'ENS name resolution (queries Ethereum mainnet)'],
    ['personality.service', 'No', 'None', 'setPersonality(), formatMessage()', 'Agent personality (professional/friendly/pirate/emoji/minimal)'],
    ['webhooks.service', 'No', 'None', 'registerWebhook(), fireWebhook()', 'External event notifications (Slack, Discord)'],
    ['challenges.service', 'No', 'None', 'getActiveChallenges(), progressChallenge()', 'Daily/weekly gamified challenges'],
    ['goals.service', 'No', '.goals.json', 'createGoal(), updateGoalProgress()', 'Fundraising goals with progress tracking'],
    ['limits.service', 'No', 'None', 'setLimit(), checkLimit(), getAuditLog()', 'Spending caps + audit trail'],
    ['export.service', 'No', 'None', 'exportTipHistory() — CSV/JSON/PDF', 'Data export'],
    ['indexer.service', 'REAL', 'None', 'healthCheck(), getBalances(), getTransfers()', 'WDK Indexer API (cross-chain data)'],
    ['demo.service', 'No', 'None', 'getSampleCreators(), getSampleTipHistory()', 'Demo data seeding for judges'],
    ['creator-analytics.service', 'No', '.creator-analytics.json', 'ingestTips(), getCreatorIncome(), getPlatformAnalytics()', 'Creator income analytics'],
    ['reputation.service', 'No', '.reputation.json', 'recordTip(), getReputation(), getLeaderboard()', 'Creator reputation tiers (bronze-diamond)'],
    ['retry.service', 'REAL', 'None', 'retryTransaction() — exponential backoff', 'Failed transaction retry'],
], [75, 25, 60, 170, 230], '#1a1b24'))
story.append(PageBreak())

# ═══ AGENT CORE ═══
story.append(Paragraph("2. Agent Core — 11-Step Autonomous Pipeline", styles['H1x']))
story.append(Paragraph("File: agent/src/core/agent.ts (1100+ lines). The TipFlowAgent class orchestrates the entire system.", styles['B']))

story.append(tbl([
    ['Step', 'Name', 'What Happens', 'Service Used'],
    ['1', 'INTAKE', 'Parse + validate tip request (recipient, amount, token)', 'Input validation'],
    ['2', 'LIMIT_CHECK', 'Enforce daily/weekly/per-tip spending limits', 'limits.service'],
    ['3', 'ANALYZE', 'Query balances + estimate gas fees on ALL chains', 'wallet.service (WDK)'],
    ['4', 'FEE_OPTIMIZE', 'Cross-chain fee comparison, find cheapest route', 'fee-arbitrage.service'],
    ['5', 'ECONOMIC_CHECK', 'Verify fee-to-tip ratio < 50% (reject uneconomic tips)', 'Built-in check'],
    ['6', 'RISK_ASSESS', '8-factor risk scoring: address, amount, frequency, chain, time, reputation, pattern, velocity', 'risk-engine.service'],
    ['7', 'REASON', 'AI chain selection with weighted scoring (cost 40%, speed 20%, balance 15%, reliability 15%, compat 10%)', 'ai.service (LLM)'],
    ['8', 'CONSENSUS', '3-agent vote: TipExecutor (feasibility), Guardian (safety+veto), TreasuryOptimizer (economics)', 'orchestrator.service'],
    ['9', 'EXECUTE', 'WDK sendTransaction() or transfer() with auto-retry (2x exponential backoff: 2s, 4s, 8s)', 'wallet.service (WDK)'],
    ['10', 'VERIFY', 'Poll blockchain for confirmation — returns block number + gas used', 'wallet.service (WDK)'],
    ['11', 'REPORT', 'Generate receipt + fire webhooks + update history/reputation/analytics/challenges', 'receipt, webhooks, reputation, analytics'],
], [25, 80, 250, 205], '#a855f7'))
story.append(Spacer(1, 8))

story.append(Paragraph("Autonomous Loop: Every 60 seconds, the agent runs an autonomous cycle:", styles['B']))
story.append(Paragraph("1. Analyze tip history for patterns (recipients, timing, amounts)<br/>2. Generate autonomous proposals based on policies<br/>3. Check confidence scores — auto-execute if below threshold, propose for review if above<br/>4. Treasury rebalancing — deploy idle funds to Aave V3 for yield<br/>5. DCA installment check — execute due installments<br/>6. Condition monitoring — trigger conditional tips if conditions met", styles['Sm']))
story.append(PageBreak())

# ═══ API ENDPOINTS ═══
story.append(Paragraph("3. API Endpoints — 238 Total (Grouped)", styles['H1x']))

story.append(tbl([
    ['Category', 'Count', 'Key Endpoints'],
    ['Health & System', '8', 'GET /health/full, /health/detailed, /meta, /system/info, /network/health'],
    ['Wallet', '12', 'GET /wallet/addresses, /wallet/balances, /wallet/receive, /wallets, /gasless/status'],
    ['Tips (core)', '8', 'POST /tip, /tip/batch, /tip/split, /tip/parse, /tip/gasless, /tip/import. GET /tip/estimate'],
    ['Scheduled & Conditional', '5', 'POST /tip/schedule. GET /tip/scheduled. POST /conditions. GET /conditions'],
    ['Fees', '7', 'GET /fees/compare, /fees/current, /fees/history, /fees/optimal-timing, /gas, /gas/speeds'],
    ['Agent & History', '8', 'GET /agent/state, /agent/events (SSE), /agent/history, /agent/stats, /agent/identity'],
    ['Contacts', '7', 'GET/POST/PUT/DELETE /contacts. GET /contacts/groups, /contacts/export'],
    ['Templates', '3', 'GET/POST/DELETE /templates'],
    ['Gamification', '5', 'GET /challenges, /achievements, /leaderboard, /calendar. POST /challenges/refresh'],
    ['AI', '4', 'GET /ai/status. POST /ai/tip-message, /ai/risk-explanation, /ai/decision-explanation'],
    ['Chat', '1', 'POST /chat (NLP conversational tipping)'],
    ['ENS', '2', 'GET /ens/resolve, /ens/reverse'],
    ['Tip Links', '4', 'POST/GET/DELETE /tiplinks'],
    ['Settings', '4', 'GET/PUT /settings, /personality'],
    ['Webhooks', '4', 'GET/POST/DELETE /webhooks. POST /webhooks/test'],
    ['Autonomy', '7', 'GET/POST/DELETE /autonomy/policies. GET /autonomy/profile, /decisions. POST /autonomy/evaluate'],
    ['Treasury', '8', 'GET /treasury/status, /analytics, /report, /strategy, /allocation, /yields. POST /treasury/strategy, /allocation'],
    ['Bridge', '4', 'GET /bridge/routes, /bridge/history. POST /bridge/quote, /bridge/execute'],
    ['Lending', '4', 'GET /lending/rates, /lending/position. POST /lending/supply, /lending/withdraw'],
    ['Streaming', '6', 'GET /stream/active, /stream/history. POST /stream/start, /:id/pause, /:id/resume, /:id/stop'],
    ['Swaps', '4', 'GET /swap/status, /swap/history. POST /swap/quote, /swap/execute'],
    ['DCA', '8', 'GET/POST /dca. GET /dca/active, /dca/:id, /dca/stats. POST /dca/:id/cancel, /pause, /resume'],
    ['Escrow', '8', 'GET /escrow, /escrow/active, /:id, /escrow/stats. POST /escrow, /:id/release, /dispute, /refund'],
    ['Queue', '4', 'GET /queue, /queue/stats, /queue/dlq. POST /queue/enqueue'],
    ['Receipts', '3', 'GET /receipt/:tipId, /receipts. POST /receipt/verify'],
    ['PoE', '3', 'GET /poe, /poe/verify/:id. POST /poe/attest'],
    ['Predictions', '7', 'GET /predictions, /all, /stats. POST /predictions/learn, /generate, /:id/accept, /dismiss'],
    ['Reputation', '6', 'GET /reputation/:addr, /leaderboard, /config, /recommendations. PUT /reputation/config'],
    ['Rumble', '16', 'GET/POST /rumble/creators, /leaderboard, /watch, /engagement, /auto-tip, /pools, /events'],
    ['Propagation', '3', 'GET /propagation/waves, /pools. POST /propagation/wave'],
    ['Revenue Smoothing', '5', 'GET /smoothing/profiles, /reserve, /history. POST /smoothing/enroll, /evaluate'],
    ['Discovery', '3', 'GET /discovery/signals. POST /discovery/record, /analyze'],
    ['Memory', '6', 'GET /memory, /memory/stats, /conversations. POST /memory, /memory/search. DELETE /memory/:id'],
    ['Goals', '4', 'GET/POST/PUT/DELETE /goals'],
    ['Orchestrator', '6', 'GET /orchestrator/stats, /history, /:id. POST /orchestrator/propose, /config, /:id/result'],
    ['Policies', '5', 'GET/POST /policies. PUT /policies/:id/toggle. POST /policies/evaluate'],
    ['Indexer', '5', 'GET /indexer/health, /chains, /balances/:b/:t/:a, /transfers/:b/:t/:a. POST /indexer/batch/balances'],
    ['X402', '3', 'GET /x402/endpoints, /x402/stats. POST /x402/pay'],
    ['Platforms', '3', 'GET /platforms, /platforms/creators. POST /platforms/:platform/event'],
    ['Limits & Audit', '3', 'GET/PUT /limits. GET /audit'],
], [80, 25, 455], '#3b82f6'))
story.append(PageBreak())

# ═══ FRONTEND TAB LAYOUT ═══
story.append(Paragraph("4. Dashboard Tab Structure (6 Tabs)", styles['H1x']))

story.append(tbl([
    ['Tab', 'Hash Route', 'Components (top to bottom)', 'Data Sources'],
    ['Dashboard', '#dashboard', 'Header(sticky), PriceTicker, DemoBanner, LiveMetrics, DemoScenarios, InnovationShowcase, ProtocolOverview, WalletCard(x3), StatsPanel(4 cards), SmartSuggestions, TipForm(3 modes: Single/Batch/Split), AgentPanel(6-step viz), FeeOptimizer, StreamingPanel, GasMonitor, CurrencyConverter, TipGoals, TipCalendar, AgentActivityFeed, ConditionalTips, TipTemplates, ReputationPanel, NetworkHealth, Footer', 'useHealth(5s), useBalances(10s), useAgentState(SSE), useStats(), GET /api/prices, /gas, /goals, /calendar, /conditions, /templates, /reputation/leaderboard, /network/health'],
    ['Analytics', '#analytics', 'AnalyticsDashboard(bar charts), EconomicsDashboard(sparklines), StatsPanel, ChainComparison, Leaderboard, Achievements(progress bars), Challenges(countdown), ActivityHeatmap(calendar grid), TechStack', 'GET /api/agent/analytics, /analytics/chains, /leaderboard, /achievements, /challenges, /calendar'],
    ['History', '#history', 'TipHistory(searchable list + filters: chain/status/date), ExportPanel(CSV/JSON/Markdown), TransactionTimeline', 'useHistory(filters), GET /api/agent/history/export'],
    ['Rumble', '#rumble', 'RumbleIntegration — single mega-component with sections: Creator Registration, Auto-Tip Rules, Community Pools, Event Triggers, Creator Leaderboard, Watch Sessions', 'GET /api/rumble/creators, /leaderboard, /pools, /auto-tip/rules/:userId'],
    ['AI', '#ai', 'AgentCapabilities(11-step viz), OrchestratorPanel(3-agent voting), PredictorPanel, DcaPanel, EscrowPanel, MemoryPanel, FeeArbitragePanel, CreatorAnalyticsPanel, RiskDashboard, EngagementPanel, CreatorDiscoveryPanel, TipPropagationPanel, ProofOfEngagementPanel', 'POST /api/orchestrator/propose. GET /api/predictions, /dca, /escrow/active, /memory, /fees/compare'],
    ['Settings', '#settings', 'SettingsPanel(theme/sound/personality), WalletBackup, BridgePanel, LendingPanel, WebhookManager, AuditLog, ApiDocs, DeveloperHub(4 integration paths), PluginRegistry, ApiExplorer(230+ endpoints), IndexerPanel, WdkCapabilities', 'GET /api/settings, /bridge/routes, /lending/rates, /webhooks, /audit, /indexer/health'],
], [50, 55, 250, 205], '#22c55e'))
story.append(PageBreak())

# ═══ DESIGN SYSTEM ═══
story.append(Paragraph("5. Design System — Colors, Typography, CSS Classes", styles['H1x']))

story.append(Paragraph("Color Tokens (Dark Theme — Default):", styles['H2x']))
story.append(tbl([
    ['Token', 'Value', 'Usage'],
    ['--color-surface', '#0a0b0f', 'Page background'],
    ['--color-surface-1', '#12131a', 'Card backgrounds (92% opacity glass)'],
    ['--color-surface-2', '#1a1b24', 'Input backgrounds'],
    ['--color-surface-3', '#22232e', 'Hover states, tertiary'],
    ['--color-border', '#2a2b38', 'Card borders'],
    ['--color-text-primary', '#f0f0f5', 'Headings, body text'],
    ['--color-text-secondary', '#8a8b9e', 'Labels, descriptions'],
    ['--color-text-muted', '#5c5d72', 'Placeholders, hints'],
    ['--color-accent', '#22c55e', 'Primary green — buttons, links, active'],
    ['--color-warning', '#f59e0b', 'Warning amber'],
    ['--color-error', '#ef4444', 'Error red'],
    ['--color-info', '#3b82f6', 'Info blue'],
], [110, 65, 385], '#1a1b24'))
story.append(Spacer(1, 8))

story.append(Paragraph("CSS Utility Classes:", styles['H2x']))
story.append(tbl([
    ['Class', 'Effect'],
    ['glass-card', 'bg rgba(18,19,26,0.88), backdrop-blur(12px), border white/8%, rounded-2xl, shadow'],
    ['glass-elevated', 'bg rgba(18,19,26,0.95), backdrop-blur(16px), border white/10% — header/primary'],
    ['animated-border', 'Rotating conic-gradient border (green-blue-purple) via @property --border-angle'],
    ['glow-hover', 'On hover: box-shadow 0 0 20px accent/10%'],
    ['spotlight-card', 'Cursor-following radial gradient glow (via useSpotlight hook)'],
    ['tilt-card', '3D perspective tilt on hover: rotateX(2deg) rotateY(-2deg)'],
    ['shadow-depth', 'Layered depth shadows (3 layers) for Vercel/Stripe-like depth'],
    ['btn-press', 'Spring button: scale(0.97) active, scale(1.02) overshoot release'],
    ['animate-list-item-in', 'Staggered list entrance: fade + slide-up'],
    ['gradient-text-animated', 'Animated gradient text sweep (green-blue-purple, 6s)'],
    ['scroll-reveal', 'Scroll-driven reveal: opacity 0 + translateY(20px) on view()'],
    ['tabular-nums', 'Fixed-width digits for financial numbers'],
    ['value-glow-accent', 'Green text-shadow glow on numbers'],
    ['risk-low/medium/high/critical', 'Color-coded risk: green/amber/orange/red + badge variants'],
    ['score-ring', 'Conic-gradient circular progress (use --score-pct CSS var)'],
    ['wave-indicator', 'Expanding ring animation for tip propagation'],
    ['verified-glow', 'Pulsing box-shadow for verification badges'],
    ['panel-enter', 'Spring-curve slide-up entrance for tab switching'],
    ['border-pulse', 'Border color pulse green ↔ blue on hover'],
    ['value-flash', 'Glow + scale(1.05) flash on number change'],
    ['status-live', 'Green pulsing dot at top-right via ::after'],
], [110, 450], '#a855f7'))
story.append(PageBreak())

# ═══ 12 INNOVATIONS ═══
story.append(Paragraph("6. 12 Patent-Level Innovations", styles['H1x']))

story.append(tbl([
    ['#', 'Innovation', 'Backend Service', 'API Endpoints', 'Dashboard Panel'],
    ['1', 'Engagement Score (5-factor: watch 40%, rewatch 20%, frequency 15%, loyalty 15%, category 10%)', 'rumble.service + proof-of-engagement.service', 'GET /rumble/engagement/:userId/:creatorId', 'EngagementPanel.tsx'],
    ['2', 'TipPolicy DSL (declarative JSON: WHEN condition THEN action USING chain)', 'tip-policy.service', 'GET/POST /policies, POST /policies/evaluate', 'ConditionalTips.tsx'],
    ['3', 'x402 Protocol (HTTP 402 agent-to-agent micropayments)', 'x402.service', 'GET /x402/endpoints, POST /x402/pay', 'DeveloperHub.tsx'],
    ['4', 'Proof-of-Engagement (WDK-signed attestation of viewer watch behavior)', 'proof-of-engagement.service', 'GET /poe, POST /poe/attest, GET /poe/verify/:id', 'ProofOfEngagementPanel.tsx'],
    ['5', 'Revenue Smoothing (creator income insurance from reserve fund)', 'revenue-smoothing.service', 'GET /smoothing/profiles, POST /smoothing/enroll', 'RiskDashboard.tsx (partial)'],
    ['6', 'Creator Discovery (AI angel investing — find undervalued creators)', 'creator-discovery.service', 'POST /discovery/analyze, GET /discovery/signals', 'CreatorDiscoveryPanel.tsx'],
    ['7', 'Tip Propagation (viral tipping — waves spread through social graph)', 'tip-propagation.service', 'GET /propagation/waves, POST /propagation/wave', 'TipPropagationPanel.tsx'],
    ['8', 'Multi-Agent Consensus (3 agents vote: Executor, Guardian veto, Treasury)', 'orchestrator.service', 'POST /orchestrator/propose, GET /orchestrator/stats', 'OrchestratorPanel.tsx'],
    ['9', 'MCP Server (35 wallet tools via Model Context Protocol)', 'mcp-server.ts', 'stdio transport (not HTTP)', 'AgentCapabilities.tsx'],
    ['10', 'Agent Identity (DID-like fingerprint from WDK seed)', 'agent-identity.service', 'GET /agent/identity, POST /agent/verify', 'Header.tsx (agent ID)'],
    ['11', '8-Factor Risk Engine (address, amount, frequency, chain, time, rep, pattern, velocity)', 'risk-engine.service', 'POST /risk/assess', 'RiskDashboard.tsx'],
    ['12', 'Multi-Criteria Decision (weighted: cost 40%, speed 20%, balance 15%, reliability 15%, compat 10%)', 'ai.service + agent.ts', 'POST /ai/decision-explanation', 'AgentPanel.tsx'],
], [15, 120, 90, 120, 215], '#22c55e'))
story.append(PageBreak())

# ═══ DATA PERSISTENCE ═══
story.append(Paragraph("7. Data Persistence (JSON Files on Disk)", styles['H1x']))

story.append(tbl([
    ['File', 'Service', 'What It Stores'],
    ['.seed', 'wallet.service', 'BIP-39 seed phrase (CRITICAL — never commit to git)'],
    ['.contacts.json', 'contacts.service', 'Address book entries (name, address, group, tipCount)'],
    ['.templates.json', 'templates.service', 'Saved tip templates'],
    ['.tags.json', 'tags.service', 'Address labels and colors'],
    ['.rumble-creators.json', 'rumble.service', 'Registered creators, pools, triggers, watch sessions'],
    ['.autonomy-policies.json', 'autonomy.service', 'User-defined autonomy policies'],
    ['.autonomy-decisions.json', 'autonomy.service', 'Historical autonomous decisions'],
    ['.goals.json', 'goals.service', 'Fundraising goals with progress'],
    ['.agent-memory.json', 'memory.service', 'Agent preferences, facts, context, corrections'],
    ['.receipts.json', 'receipt.service', 'Cryptographic tip receipts (ECDSA signed)'],
    ['.escrow.json', 'escrow.service', 'Active escrow holds'],
    ['.creator-analytics.json', 'creator-analytics.service', 'Creator income time-series data'],
    ['.reputation.json', 'reputation.service', 'Creator reputation scores + tiers'],
    ['.treasury.json', 'treasury.service', 'Treasury allocation config'],
    ['.tip-policies.json', 'tip-policy.service', 'Programmable tipping rules'],
], [120, 100, 340], '#3b82f6'))
story.append(Spacer(1, 12))

# ═══ RESPONSIVE ═══
story.append(Paragraph("8. Responsive Breakpoints", styles['H2x']))
story.append(tbl([
    ['Breakpoint', 'Width', 'Layout'],
    ['Mobile (default)', '< 640px', 'Single column, MobileNav bottom bar (4 tabs), full-width cards'],
    ['sm', '>= 640px', 'Wider padding, 2-col grids start'],
    ['md', '>= 768px', 'Desktop DashboardTabs, 2-3 col grids, side-by-side layout'],
    ['lg', '>= 1024px', 'Full 3-col grids, max-w-7xl container'],
], [80, 60, 420], '#a855f7'))
story.append(Spacer(1, 12))

# ═══ KNOWN ISSUES ═══
story.append(Paragraph("9. Known UI Issues", styles['H2x']))
for issue in [
    "1. Dashboard tab has 24+ components stacked vertically — too much scrolling. Consider collapsing into accordion sections.",
    "2. On wide screens (>1280px), right half is empty (max-w-7xl constraint). Consider full-width or sidebar layout.",
    "3. Some components (ProtocolOverview, InnovationShowcase) have text cut off on left edge — padding issue.",
    "4. Light theme (html.light toggle) exists but is undertested.",
    "5. Without backend running, dashboard shows 'Offline' + empty panels. Backend MUST be running for demo.",
    "6. DemoBanner + SmartSuggestions push main content down significantly on first load.",
]:
    story.append(Paragraph(issue, styles['B']))

doc.build(story)
print("PDF generated: INFORMATION_ARCHITECTURE.pdf (Complete — Frontend + Backend)")
