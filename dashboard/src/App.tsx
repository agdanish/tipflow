// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Rumble Creator Tipping Agent

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Send, Users, Star, Clock,
  Copy, Check, Wallet, Radio, TrendingUp,
  CheckCircle2, Loader2, Brain, ArrowUpRight
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface WalletBalance {
  chainId: string;
  address: string;
  nativeBalance: string;
  nativeCurrency: string;
  usdtBalance: string;
}

interface Creator {
  id: string;
  name: string;
  channelUrl: string;
  walletAddress: string;
  categories: string[];
  totalTips: number;
  totalAmount: number;
}

interface AgentState {
  status: string;
  currentStep?: string;
  reasoning?: string;
  progress?: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  detail?: string;
}

interface TipResult {
  status: string;
  txHash: string;
  amount: string;
  recipient: string;
  chainId: string;
  fee?: string;
  reasoning?: string;
}

// ─── API helper ──────────────────────────────────────────
const API = 'http://localhost:3001/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── App ─────────────────────────────────────────────────
export default function App() {
  // State
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [agentState, setAgentState] = useState<AgentState>({ status: 'idle' });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [tipResult, setTipResult] = useState<TipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'native' | 'usdt'>('native');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [b, c, a] = await Promise.all([
        fetchJson<{ balances: WalletBalance[] }>(`${API}/wallet/balances`),
        fetchJson<{ creators: Creator[] }>(`${API}/rumble/creators`),
        fetchJson<{ activity: ActivityEvent[] }>(`${API}/activity`),
      ]);
      setBalances(b.balances || []);
      setCreators(c.creators || []);
      setActivity((a.activity || []).slice(0, 10));
    } catch { /* silent on initial load */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // SSE for agent state
  useEffect(() => {
    const es = new EventSource(`${API}/agent/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'state') setAgentState(data);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  // Poll activity every 10s
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const a = await fetchJson<{ activity: ActivityEvent[] }>(`${API}/activity`);
        setActivity((a.activity || []).slice(0, 10));
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  // Send tip
  const handleSendTip = async () => {
    if (!recipient || !amount) return;
    setSending(true);
    setError(null);
    setTipResult(null);
    try {
      const result = await fetchJson<TipResult>(`${API}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, amount, token, message: message || undefined }),
      });
      setTipResult(result);
      setRecipient('');
      setAmount('');
      setMessage('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
    } finally {
      setSending(false);
    }
  };

  // Quick tip a creator
  const handleQuickTip = (creator: Creator) => {
    setRecipient(creator.walletAddress);
    setAmount('0.001');
    document.getElementById('tip-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Copy address
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* silent */ }
  };

  const totalUsdt = balances.reduce((s, b) => s + (parseFloat(b.usdtBalance) || 0), 0);

  return (
    <div className="min-h-screen bg-[#050507] text-[#f0f0f5]">
      {/* ━━━ HEADER ━━━ */}
      <header className="sticky top-0 z-50 border-b border-[#2a2a35] bg-[#050507]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">TipFlow</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-400/10 text-teal-300 border border-teal-400/20 font-medium">
              Rumble Tipping Agent
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8888a0]">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${agentState.status !== 'idle' ? 'bg-teal-400 animate-pulse' : 'bg-teal-400'}`} />
              Agent {agentState.status}
            </span>
            <span className="hidden sm:inline">{balances.length} chains</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ━━━ 1. WALLET SUMMARY ━━━ */}
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
                    <button onClick={() => handleCopy(b.address, b.chainId)} className="ml-auto text-[#55556a] hover:text-[#8888a0] transition-colors">
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

        {/* ━━━ 2. RUMBLE CREATORS ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold tracking-tight">Rumble Creators</h2>
            <span className="text-xs text-[#55556a] ml-auto">{creators.length} registered</span>
          </div>
          {creators.length === 0 ? (
            <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-8 text-center">
              <Users className="w-8 h-8 text-[#55556a] mx-auto mb-3" />
              <p className="text-sm text-[#8888a0]">No creators registered yet</p>
              <p className="text-xs text-[#55556a] mt-1">Start the agent with DEMO=true to see sample creators</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creators.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-[#2a2a35] bg-[#0c0c10] px-4 py-3 hover:border-[#3a3a48] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-400">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-[#55556a] truncate">{c.channelUrl}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-[#8888a0]">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {c.totalTips} tips</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {c.totalAmount.toFixed(4)}</span>
                  </div>
                  <button
                    onClick={() => handleQuickTip(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/10 border border-teal-400/20 text-teal-300 text-xs font-medium hover:bg-teal-400/20 transition-colors"
                  >
                    <Send className="w-3 h-3" /> Tip
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ━━━ 3. SEND TIP ━━━ */}
        <section id="tip-form">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold tracking-tight">Send Tip</h2>
          </div>
          <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Recipient</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x... or UQ... address"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm text-[#f0f0f5] placeholder:text-[#55556a] focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Amount</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.001"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm text-[#f0f0f5] placeholder:text-[#55556a] focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all tabular-nums"
                  />
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value as 'native' | 'usdt')}
                    className="px-3 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm text-[#f0f0f5] focus:border-teal-400 outline-none"
                  >
                    <option value="native">Native</option>
                    <option value="usdt">USDT</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8888a0] mb-1.5">Message (optional)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Great video!"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141418] border border-[#2a2a35] text-sm text-[#f0f0f5] placeholder:text-[#55556a] focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {tipResult && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-teal-400/10 border border-teal-400/20">
                <div className="flex items-center gap-2 text-sm text-teal-300 font-medium mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Tip {tipResult.status === 'confirmed' ? 'confirmed' : 'sent'}!
                </div>
                <p className="text-xs text-[#8888a0]">
                  {tipResult.amount} → {tipResult.recipient.slice(0, 10)}... on {tipResult.chainId}
                </p>
                {tipResult.reasoning && (
                  <p className="text-xs text-[#55556a] mt-1 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> {tipResult.reasoning}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleSendTip}
              disabled={sending || !recipient || !amount}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI Agent is processing...</>
              ) : (
                <><Zap className="w-4 h-4" /> Send Tip <ArrowUpRight className="w-4 h-4 opacity-60" /></>
              )}
            </button>
            <p className="text-xs text-[#55556a] text-center mt-2">
              AI agent selects the cheapest chain automatically
            </p>
          </div>
        </section>

        {/* ━━━ 4. AGENT PIPELINE ━━━ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold tracking-tight">Agent Pipeline</h2>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              agentState.status === 'idle'
                ? 'bg-[#141418] text-[#8888a0]'
                : 'bg-teal-400/10 text-teal-300 animate-pulse'
            }`}>
              {agentState.status}
            </span>
          </div>
          <div className="rounded-2xl border border-[#2a2a35] bg-[#0c0c10] p-5">
            {agentState.status === 'idle' ? (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-[#2a2a35] mx-auto mb-3" />
                <p className="text-sm text-[#8888a0]">Agent ready</p>
                <p className="text-xs text-[#55556a]">Send a tip to see the 11-step decision pipeline in action</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{agentState.currentStep || agentState.status}</p>
                    {agentState.reasoning && <p className="text-xs text-[#8888a0] mt-0.5">{agentState.reasoning}</p>}
                  </div>
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                </div>
                {agentState.progress !== undefined && (
                  <div className="h-1.5 rounded-full bg-[#141418] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-violet-400 transition-all duration-500"
                      style={{ width: `${agentState.progress}%` }}
                    />
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
              <p className="text-xs text-[#55556a] mt-1">Tips and agent decisions will appear here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activity.map((event, i) => (
                <div key={event.id || i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-[#0c0c10] transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                    event.type.includes('sent') || event.type.includes('success') ? 'bg-teal-400' :
                    event.type.includes('fail') ? 'bg-red-400' : 'bg-[#55556a]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#f0f0f5]">{event.message}</p>
                    {event.detail && <p className="text-xs text-[#55556a] mt-0.5 truncate">{event.detail}</p>}
                  </div>
                  <span className="text-xs text-[#55556a] shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-[#2a2a35]/40 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-[#55556a]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            TipFlow — Powered by Tether WDK
          </div>
          <span>Hackathon Galactica 2026</span>
        </div>
      </footer>
    </div>
  );
}
