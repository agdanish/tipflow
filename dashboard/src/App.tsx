// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Rumble Creator Tipping Agent

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Zap, Send, Users, Star, Clock, Eye, Target, GitBranch, Layers,
  Copy, Check, Wallet, Radio, TrendingUp, Play, Trophy,
  CheckCircle2, Loader2, Brain, ArrowUpRight, Plus, X
} from 'lucide-react';

// Lazy-load Advanced Mode (the full dashboard)
const AdvancedDashboard = lazy(() => import('./AdvancedMode'));

// ─── Types ───────────────────────────────────────────────
interface WalletBalance { chainId: string; address: string; nativeBalance: string; nativeCurrency: string; usdtBalance: string; }
interface Creator { id: string; name: string; channelUrl: string; walletAddress: string; categories: string[]; totalTips: number; totalAmount: number; }
interface AgentState { status: string; currentStep?: string; reasoning?: string; progress?: number; }
interface ActivityEvent { id: string; type: string; message: string; timestamp: string; detail?: string; }
interface TipResult { status: string; txHash: string; amount: string; recipient: string; chainId: string; fee?: string; reasoning?: string; }
interface AutoTipRule { userId: string; minWatchPercent: number; tipAmount: number; maxTipsPerDay: number; enabledCategories: string[]; }
interface TipPool { id: string; creatorId: string; title: string; goalAmount: number; currentAmount: number; contributors: number; }
interface LeaderboardEntry { address: string; totalTips: number; totalAmount: number; rank: number; }

const API = 'http://localhost:3001/api';
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── App ─────────────────────────────────────────────────
export default function App() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [agentState, setAgentState] = useState<AgentState>({ status: 'idle' });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [tipResult, setTipResult] = useState<TipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<TipPool[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [autoTipRules, setAutoTipRules] = useState<AutoTipRule[]>([]);
  const [activeTab, setActiveTab] = useState<'tip' | 'autotip' | 'pools' | 'events'>('tip');
  const [advancedMode, setAdvancedMode] = useState(false);

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'native' | 'usdt' | 'xaut' | 'btc'>('native');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Auto-tip form
  const [atMinWatch, setAtMinWatch] = useState('70');
  const [atAmount, setAtAmount] = useState('0.001');
  const [atMaxDay, setAtMaxDay] = useState('5');
  const [atSaving, setAtSaving] = useState(false);

  // Pool form
  const [poolCreator, setPoolCreator] = useState('');
  const [poolTitle, setPoolTitle] = useState('');
  const [poolGoal, setPoolGoal] = useState('');
  const [poolSaving, setPoolSaving] = useState(false);

  // Event trigger form
  const [evtCreator, setEvtCreator] = useState('');
  const [evtType, setEvtType] = useState<'new_video' | 'milestone' | 'live_start' | 'anniversary'>('new_video');
  const [evtAmount, setEvtAmount] = useState('0.001');
  const [evtSaving, setEvtSaving] = useState(false);
  const [evtSuccess, setEvtSuccess] = useState('');

  // Split form
  const [splitRecipients, setSplitRecipients] = useState<string[]>(['', '']);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitSending, setSplitSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [b, c, a, p, l, r] = await Promise.all([
        fetchJson<{ balances: WalletBalance[] }>(`${API}/wallet/balances`),
        fetchJson<{ creators: Creator[] }>(`${API}/rumble/creators`),
        fetchJson<{ activity: ActivityEvent[] }>(`${API}/activity`),
        fetchJson<{ pools: TipPool[] }>(`${API}/rumble/pools`).catch(() => ({ pools: [] })),
        fetchJson<{ leaderboard: LeaderboardEntry[] }>(`${API}/rumble/leaderboard`).catch(() => ({ leaderboard: [] })),
        fetchJson<{ rules: AutoTipRule[] }>(`${API}/rumble/auto-tip/rules/default-user`).catch(() => ({ rules: [] })),
      ]);
      setBalances(b.balances || []);
      setCreators(c.creators || []);
      setActivity((a.activity || []).slice(0, 8));
      setPools(p.pools || []);
      setLeaderboard((l.leaderboard || []).slice(0, 5));
      setAutoTipRules(r.rules || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // SSE
  useEffect(() => {
    const es = new EventSource(`${API}/agent/events`);
    es.onmessage = (e) => { try { const d = JSON.parse(e.data); if (d.type === 'state') setAgentState(d); } catch {} };
    return () => es.close();
  }, []);

  // Poll
  useEffect(() => {
    const iv = setInterval(async () => {
      try { const a = await fetchJson<{ activity: ActivityEvent[] }>(`${API}/activity`); setActivity((a.activity || []).slice(0, 8)); } catch {}
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const handleSendTip = async () => {
    if (!recipient || !amount) return;
    setSending(true); setError(null); setTipResult(null);
    try {
      const result = await fetchJson<TipResult>(`${API}/tip`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, amount, token, message: message || undefined }),
      });
      setTipResult(result); setRecipient(''); setAmount(''); setMessage(''); loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send tip'); }
    finally { setSending(false); }
  };

  const handleSaveAutoTip = async () => {
    setAtSaving(true);
    try {
      await fetchJson(`${API}/rumble/auto-tip/rules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user', rules: [{ minWatchPercent: parseInt(atMinWatch), tipAmount: parseFloat(atAmount), maxTipsPerDay: parseInt(atMaxDay), enabledCategories: ['all'] }] }),
      });
      loadData();
    } catch {} finally { setAtSaving(false); }
  };

  const handleCreatePool = async () => {
    if (!poolCreator || !poolTitle || !poolGoal) return;
    setPoolSaving(true);
    try {
      await fetchJson(`${API}/rumble/pools`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: poolCreator, title: poolTitle, goalAmount: parseFloat(poolGoal) }),
      });
      setPoolTitle(''); setPoolGoal(''); loadData();
    } catch {} finally { setPoolSaving(false); }
  };

  const handleEventTrigger = async () => {
    if (!evtCreator) return;
    setEvtSaving(true); setEvtSuccess('');
    try {
      await fetchJson(`${API}/rumble/events/triggers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: evtCreator, event: evtType, tipAmount: parseFloat(evtAmount) }),
      });
      setEvtSuccess(`Trigger set: auto-tip on ${evtType}`);
      setTimeout(() => setEvtSuccess(''), 3000);
    } catch {} finally { setEvtSaving(false); }
  };

  const handleSplitTip = async () => {
    const recipients = splitRecipients.filter(r => r.trim());
    if (recipients.length < 2 || !splitAmount) return;
    setSplitSending(true);
    try {
      await fetchJson(`${API}/tip/split`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, totalAmount: splitAmount, token: 'native' }),
      });
      setSplitRecipients(['', '']); setSplitAmount(''); loadData();
    } catch {} finally { setSplitSending(false); }
  };

  const handleCopy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); } catch {}
  };

  const totalUsdt = balances.reduce((s, b) => s + (parseFloat(b.usdtBalance) || 0), 0);

  return (
    <div className="min-h-screen bg-[#050507] text-[#f0f0f5]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#2a2a35] bg-[#050507]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">TipFlow</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-400/10 text-teal-300 border border-teal-400/20 font-medium">Rumble Tipping Agent</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8888a0]">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${agentState.status !== 'idle' ? 'bg-teal-400 animate-pulse' : 'bg-teal-400'}`} />
              Agent {agentState.status}
            </span>
            <span className="hidden sm:inline">{balances.length} chains</span>
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                advancedMode
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-[#141418] text-[#8888a0] border border-[#2a2a35] hover:text-[#f0f0f5] hover:border-[#3a3a48]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {advancedMode ? 'Simple' : 'Advanced'}
            </button>
          </div>
        </div>
      </header>

      {/* ADVANCED MODE — full dashboard with all 43 services */}
      {advancedMode && (
        <Suspense fallback={<div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-[#8888a0]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />Loading Advanced Mode...</div>}>
          <AdvancedDashboard />
        </Suspense>
      )}

      {/* SIMPLE MODE — focused Rumble tipping */}
      {!advancedMode && <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ━━━ 1. WALLETS ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold tracking-tight">Wallets</h2>
            <span className="text-xs text-[#55556a] ml-auto">${totalUsdt.toFixed(2)} USDT total</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {balances.map((b) => {
              const label = b.chainId.includes('ethereum') ? 'ETH' : b.chainId.includes('ton') ? 'TON' : b.chainId.includes('tron') ? 'TRX' : b.chainId.includes('bitcoin') ? 'BTC' : 'SOL';
              const color = b.chainId.includes('ethereum') ? '#627eea' : b.chainId.includes('ton') ? '#0098ea' : b.chainId.includes('tron') ? '#eb0029' : '#f7931a';
              return (
                <div key={b.chainId} className="flex-shrink-0 w-52 rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-4 hover:border-[#3a3a48] transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: color }}>{label}</div>
                    <span className="text-sm font-semibold">{label}</span>
                    <button onClick={() => handleCopy(b.address, b.chainId)} className="ml-auto text-[#55556a] hover:text-[#8888a0]">
                      {copied === b.chainId ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{parseFloat(b.nativeBalance).toFixed(4)} <span className="text-xs text-[#8888a0]">{b.nativeCurrency}</span></p>
                  {parseFloat(b.usdtBalance) > 0 && <p className="text-sm text-teal-400 tabular-nums mt-1">{parseFloat(b.usdtBalance).toFixed(2)} USDT</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ━━━ 2. RUMBLE CREATORS + LEADERBOARD ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold tracking-tight">Rumble Creators</h2>
            <span className="text-xs text-[#55556a] ml-auto">{creators.length} registered</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-2">
              {creators.length === 0 ? (
                <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-8 text-center">
                  <Users className="w-8 h-8 text-[#55556a] mx-auto mb-3" />
                  <p className="text-sm text-[#8888a0]">No creators yet — start agent with DEMO=true</p>
                </div>
              ) : creators.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-[#2a2a35] bg-[#0c0c10] px-4 py-3 hover:border-[#3a3a48] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-400">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-[#55556a] truncate">{c.channelUrl}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-[#8888a0]">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {c.totalTips}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {(c.totalAmount ?? 0).toFixed(4)}</span>
                  </div>
                  <button onClick={() => { setRecipient(c.walletAddress); setAmount('0.001'); setActiveTab('tip'); document.getElementById('tip-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/10 border border-teal-400/20 text-teal-300 text-xs font-medium hover:bg-teal-400/20 transition-colors">
                    <Send className="w-3 h-3" /> Tip
                  </button>
                </div>
              ))}
            </div>
            {/* Leaderboard sidebar */}
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-amber-400" /> Top Creators</h3>
              {leaderboard.length === 0 ? <p className="text-xs text-[#55556a]">No tips yet</p> : (
                <div className="space-y-2">
                  {leaderboard.map((e, i) => (
                    <div key={e.address} className="flex items-center gap-2 text-xs">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-zinc-400/20 text-zinc-300' : i === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-[#141418] text-[#8888a0]'}`}>{i + 1}</span>
                      <span className="text-[#8888a0] font-mono truncate flex-1">{e.address.slice(0, 8)}...{e.address.slice(-4)}</span>
                      <span className="text-[#f0f0f5] font-medium">{e.totalTips} tips</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ━━━ 3. TIPPING ACTIONS (tabbed: Tip / Auto-Tip / Pools / Events) ━━━ */}
        <section id="tip-section">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold tracking-tight">Tipping Actions</h2>
          </div>
          {/* Sub-tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-[#0c0c10] border border-[#2a2a35] mb-5">
            {([
              { id: 'tip' as const, label: 'Send Tip', icon: Send },
              { id: 'autotip' as const, label: 'Auto-Tip', icon: Eye },
              { id: 'pools' as const, label: 'Pools', icon: Target },
              { id: 'events' as const, label: 'Events', icon: Play },
            ]).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-[#1c1c22] text-white' : 'text-[#55556a] hover:text-[#8888a0]'}`}>
                <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* TAB: Send Tip */}
          {activeTab === 'tip' && (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Recipient</label>
                  <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x... or UQ... address"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] focus:border-teal-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Amount & Token</label>
                  <div className="flex gap-2">
                    <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.001"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] focus:border-teal-400 outline-none tabular-nums" />
                    <select value={token} onChange={(e) => setToken(e.target.value as typeof token)}
                      className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none">
                      <option value="native">Native</option>
                      <option value="usdt">USDT</option>
                      <option value="xaut">XAUT</option>
                      <option value="btc">BTC</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Message</label>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Great video!"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] focus:border-teal-400 outline-none" />
              </div>
              {/* Smart Splits */}
              <details className="mb-4 group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#8888a0] hover:text-[#f0f0f5] transition-colors">
                  <GitBranch className="w-3.5 h-3.5" /> Smart Split (tip multiple creators)
                  <span className="ml-auto text-[#55556a] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  {splitRecipients.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={r} onChange={(e) => { const n = [...splitRecipients]; n[i] = e.target.value; setSplitRecipients(n); }} placeholder={`Recipient ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#141418] border border-[#2a2a35] text-xs placeholder:text-[#55556a] focus:border-teal-400 outline-none font-mono" />
                      {i >= 2 && <button onClick={() => setSplitRecipients(splitRecipients.filter((_, j) => j !== i))} className="text-[#55556a] hover:text-red-400"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setSplitRecipients([...splitRecipients, ''])} className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                    <input type="text" value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)} placeholder="Total amount"
                      className="w-32 px-3 py-1.5 rounded-lg bg-[#141418] border border-[#2a2a35] text-xs placeholder:text-[#55556a] outline-none" />
                    <button onClick={handleSplitTip} disabled={splitSending} className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/30 disabled:opacity-50">
                      {splitSending ? 'Splitting...' : 'Split Tip'}
                    </button>
                  </div>
                </div>
              </details>
              {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
              {tipResult && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-teal-400/10 border border-teal-400/20">
                  <div className="flex items-center gap-2 text-sm text-teal-300 font-medium mb-1"><CheckCircle2 className="w-4 h-4" /> Tip {tipResult.status}!</div>
                  <p className="text-xs text-[#8888a0]">{tipResult.amount} → {tipResult.recipient.slice(0, 10)}... on {tipResult.chainId}</p>
                  {tipResult.reasoning && <p className="text-xs text-[#55556a] mt-1 flex items-center gap-1"><Brain className="w-3 h-3" /> {tipResult.reasoning}</p>}
                </div>
              )}
              <button onClick={handleSendTip} disabled={sending || !recipient || !amount}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-all disabled:opacity-50 active:scale-[0.98]">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Agent processing...</> : <><Zap className="w-4 h-4" /> Send Tip <ArrowUpRight className="w-4 h-4 opacity-60" /></>}
              </button>
              <p className="text-xs text-[#55556a] text-center mt-2">AI agent selects cheapest chain · Supports USDT, XAUT, BTC</p>
            </div>
          )}

          {/* TAB: Auto-Tip (watch-time based) */}
          {activeTab === 'autotip' && (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-6">
              <h3 className="text-sm font-semibold mb-1">Watch-Time Auto-Tipping</h3>
              <p className="text-xs text-[#55556a] mb-4">Automatically tip creators when you watch their Rumble videos past a threshold</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Min Watch %</label>
                  <input type="number" value={atMinWatch} onChange={(e) => setAtMinWatch(e.target.value)} min="10" max="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Tip Amount</label>
                  <input type="text" value={atAmount} onChange={(e) => setAtAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none tabular-nums" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Max Tips/Day</label>
                  <input type="number" value={atMaxDay} onChange={(e) => setAtMaxDay(e.target.value)} min="1" max="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none" />
                </div>
              </div>
              {autoTipRules.length > 0 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-[#141418] border border-[#2a2a35]">
                  <p className="text-xs text-teal-300 font-medium mb-1">Active Rules</p>
                  {autoTipRules.map((r, i) => (
                    <p key={i} className="text-xs text-[#8888a0]">Watch ≥{r.minWatchPercent}% → tip {r.tipAmount} (max {r.maxTipsPerDay}/day)</p>
                  ))}
                </div>
              )}
              <button onClick={handleSaveAutoTip} disabled={atSaving}
                className="w-full py-2.5 rounded-xl bg-teal-500/20 text-teal-300 font-medium text-sm hover:bg-teal-500/30 transition-colors disabled:opacity-50">
                {atSaving ? 'Saving...' : 'Save Auto-Tip Rules'}
              </button>
            </div>
          )}

          {/* TAB: Community Pools */}
          {activeTab === 'pools' && (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-6">
              <h3 className="text-sm font-semibold mb-1">Community Tipping Pools</h3>
              <p className="text-xs text-[#55556a] mb-4">Create pools for fans to collectively tip their favorite creators</p>
              {pools.length > 0 && (
                <div className="space-y-2 mb-4">
                  {pools.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#141418] border border-[#2a2a35]">
                      <Target className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#2a2a35] overflow-hidden">
                            <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.min(100, p.goalAmount ? ((p.currentAmount ?? 0) / p.goalAmount) * 100 : 0)}%` }} />
                          </div>
                          <span className="text-xs text-[#8888a0] tabular-nums">{p.goalAmount ? (((p.currentAmount ?? 0) / p.goalAmount) * 100).toFixed(0) : 0}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#55556a]">{p.contributors} fans</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <select value={poolCreator} onChange={(e) => setPoolCreator(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none">
                  <option value="">Select creator</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" value={poolTitle} onChange={(e) => setPoolTitle(e.target.value)} placeholder="Pool title"
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] outline-none" />
                <input type="text" value={poolGoal} onChange={(e) => setPoolGoal(e.target.value)} placeholder="Goal amount"
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] outline-none tabular-nums" />
              </div>
              <button onClick={handleCreatePool} disabled={poolSaving || !poolCreator || !poolTitle || !poolGoal}
                className="w-full py-2.5 rounded-xl bg-purple-500/20 text-purple-300 font-medium text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50">
                {poolSaving ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          )}

          {/* TAB: Event-Triggered Tipping */}
          {activeTab === 'events' && (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-6">
              <h3 className="text-sm font-semibold mb-1">Event-Triggered Tipping</h3>
              <p className="text-xs text-[#55556a] mb-4">Auto-tip when creators hit milestones, go live, or post new videos</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <select value={evtCreator} onChange={(e) => setEvtCreator(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm focus:border-teal-400 outline-none">
                  <option value="">Select creator</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={evtType} onChange={(e) => setEvtType(e.target.value as typeof evtType)}
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm outline-none">
                  <option value="new_video">New Video</option>
                  <option value="milestone">Milestone</option>
                  <option value="live_start">Goes Live</option>
                  <option value="anniversary">Anniversary</option>
                </select>
                <input type="text" value={evtAmount} onChange={(e) => setEvtAmount(e.target.value)} placeholder="Tip amount"
                  className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm placeholder:text-[#55556a] outline-none tabular-nums" />
              </div>
              {evtSuccess && <div className="mb-4 px-4 py-2 rounded-xl bg-teal-400/10 border border-teal-400/20 text-xs text-teal-300">{evtSuccess}</div>}
              <button onClick={handleEventTrigger} disabled={evtSaving || !evtCreator}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-medium text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                {evtSaving ? 'Setting...' : 'Set Event Trigger'}
              </button>
            </div>
          )}
        </section>

        {/* ━━━ 4. AGENT PIPELINE ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold tracking-tight">Agent Pipeline</h2>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${agentState.status === 'idle' ? 'bg-[#141418] text-[#8888a0]' : 'bg-teal-400/10 text-teal-300 animate-pulse'}`}>
              {agentState.status}
            </span>
          </div>
          <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-5">
            {agentState.status === 'idle' ? (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-[#2a2a35] mx-auto mb-3" />
                <p className="text-sm text-[#8888a0]">Agent ready — 11-step decision pipeline</p>
                <p className="text-xs text-[#55556a]">INTAKE → ANALYZE → REASON → CONSENSUS → EXECUTE → VERIFY</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Brain className="w-4 h-4 text-violet-400" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{agentState.currentStep || agentState.status}</p>
                    {agentState.reasoning && <p className="text-xs text-[#8888a0] mt-0.5">{agentState.reasoning}</p>}
                  </div>
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                </div>
                {agentState.progress !== undefined && (
                  <div className="h-1.5 rounded-full bg-[#141418] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-violet-400 transition-all duration-500" style={{ width: `${agentState.progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ━━━ 5. RECENT ACTIVITY ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-8 text-center">
              <Clock className="w-8 h-8 text-[#2a2a35] mx-auto mb-3" />
              <p className="text-sm text-[#8888a0]">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activity.map((event, i) => (
                <div key={event.id || i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-[#0c0c10] transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${event.type.includes('sent') || event.type.includes('success') ? 'bg-teal-400' : event.type.includes('fail') ? 'bg-red-400' : 'bg-[#55556a]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.message}</p>
                    {event.detail && <p className="text-xs text-[#55556a] mt-0.5 truncate">{event.detail}</p>}
                  </div>
                  <span className="text-xs text-[#55556a] shrink-0">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>}

      <footer className="border-t border-[#2a2a35]/40 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-[#55556a]">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> TipFlow — Powered by Tether WDK</div>
          <span>Hackathon Galactica 2026</span>
        </div>
      </footer>
    </div>
  );
}
