// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { Shield, Brain, FileText, Lock, TrendingDown, Radio, CalendarClock, Database, Star, Cpu, Zap, ArrowRight } from 'lucide-react';

interface Innovation {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  tab: string;
  color: string;
}

const innovations: Innovation[] = [
  { icon: <Cpu className="w-5 h-5" />, title: 'Multi-Agent Consensus', tagline: '3 AI agents vote on every transaction with Guardian veto', tab: 'ai', color: 'text-blue-400' },
  { icon: <Brain className="w-5 h-5" />, title: 'Predictive Tipping', tagline: 'Anticipates tips based on your behavior patterns', tab: 'ai', color: 'text-purple-400' },
  { icon: <FileText className="w-5 h-5" />, title: 'Proof-of-Tip Receipts', tagline: 'SHA-256 signed cryptographic proof of every tip', tab: 'settings', color: 'text-cyan-400' },
  { icon: <Lock className="w-5 h-5" />, title: 'Tip Escrow Protocol', tagline: '4 release conditions: manual, timed, confirmed, watch-time', tab: 'ai', color: 'text-amber-400' },
  { icon: <TrendingDown className="w-5 h-5" />, title: 'Fee Arbitrage Engine', tagline: 'Real-time cross-chain fee optimization with trend analysis', tab: 'ai', color: 'text-green-400' },
  { icon: <Radio className="w-5 h-5" />, title: 'Tip Streaming', tagline: 'Continuous micro-tips at configurable intervals', tab: 'dashboard', color: 'text-pink-400' },
  { icon: <CalendarClock className="w-5 h-5" />, title: 'DCA Tipping', tagline: 'Dollar-cost averaged tips spread over time', tab: 'ai', color: 'text-orange-400' },
  { icon: <Database className="w-5 h-5" />, title: 'Agent Memory', tagline: 'Persistent learning with confidence-scored memories', tab: 'ai', color: 'text-indigo-400' },
  { icon: <Star className="w-5 h-5" />, title: 'Reputation Engine', tagline: '5-tier scoring with time decay and creator recommendations', tab: 'dashboard', color: 'text-yellow-400' },
  { icon: <Shield className="w-5 h-5" />, title: 'Autonomy Policies', tagline: 'Declarative rules for automated agent execution', tab: 'dashboard', color: 'text-red-400' },
];

interface InnovationShowcaseProps {
  onNavigate: (tab: string) => void;
}

export function InnovationShowcase({ onNavigate }: InnovationShowcaseProps) {
  return (
    <div className="animated-border shadow-depth">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="gradient-text-animated">10 Patent-Worthy Innovations</span>
          </h2>
          <span className="text-xs text-text-muted">Powered by WDK</span>
        </div>

        {/* Horizontal scrolling carousel */}
        <div className="scroll-snap-x flex gap-3 pb-2 -mx-1 px-1">
          {innovations.map((item, i) => (
            <button
              key={item.title}
              onClick={() => onNavigate(item.tab)}
              className="scroll-snap-item shrink-0 w-[180px] p-3 rounded-lg bg-surface-2/50 border border-border card-pressable card-hover text-left group animate-list-item-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`${item.color} mb-2 transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              <p className="text-xs font-semibold text-text-primary mb-1 leading-tight">{item.title}</p>
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{item.tagline}</p>
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
