import { Brain, Shield, Layers, Radio, Cpu } from 'lucide-react';

interface AiHeroProps {
  agentMode: string;
  chainCount: number;
}

export function AiHero({ agentMode, chainCount }: AiHeroProps) {
  const stats = [
    { label: 'Pipeline', value: '11-step', icon: Layers, color: 'text-purple-400' },
    { label: 'Sub-Agents', value: '3', icon: Cpu, color: 'text-blue-400' },
    { label: 'Chains', value: String(chainCount), icon: Radio, color: 'text-emerald-400' },
    { label: 'Risk Engine', value: 'Active', icon: Shield, color: 'text-amber-400' },
  ];

  return (
    <div className="relative mb-8">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/10" />
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1),transparent_50%)]" />
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="relative px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              AI Intelligence Engine
            </h1>
            <p className="text-sm text-zinc-400">
              Autonomous multi-agent tipping · {agentMode === 'llm' ? 'LLM-powered' : 'Rule-based'} reasoning
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-xs text-zinc-400">{label}:</span>
              <span className="text-xs font-semibold text-zinc-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
