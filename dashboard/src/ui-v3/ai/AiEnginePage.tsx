import { Sparkles, Brain, Zap } from 'lucide-react';
import { AiHero } from './AiHero';
import { OrchestratorPanel } from '../../components/OrchestratorPanel';
import { AutonomyPanel } from '../../components/AutonomyPanel';
import { CreatorDiscoveryPanel } from '../../components/CreatorDiscoveryPanel';
import { TipPropagationPanel } from '../../components/TipPropagationPanel';
import { ProofOfEngagementPanel } from '../../components/ProofOfEngagementPanel';
import { PredictorPanel } from '../../components/PredictorPanel';
import { RiskDashboard } from '../../components/RiskDashboard';
import { EngagementPanel } from '../../components/EngagementPanel';
import { FeeOptimizer } from '../../components/FeeOptimizer';
import { StreamingPanel } from '../../components/StreamingPanel';
import { FeeArbitragePanel } from '../../components/FeeArbitragePanel';
import { EscrowPanel } from '../../components/EscrowPanel';
import { MemoryPanel } from '../../components/MemoryPanel';
import { DcaPanel } from '../../components/DcaPanel';
import { CreatorAnalyticsPanel } from '../../components/CreatorAnalyticsPanel';

interface AiEnginePageProps {
  agentMode: string;
  chainCount: number;
}

export function AiEnginePage({ agentMode, chainCount }: AiEnginePageProps) {
  return (
    <div>
      {/* L0 — HERO */}
      <AiHero agentMode={agentMode} chainCount={chainCount} />

      {/* L1 — FLAGSHIP: Core Decision Engines (highest wow, asymmetric) */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-xl border border-zinc-700 bg-zinc-900/60 p-6">
            <OrchestratorPanel />
          </div>
          <div className="lg:col-span-5 rounded-xl border border-zinc-700 bg-zinc-900/60 p-6">
            <AutonomyPanel />
          </div>
        </div>
      </section>

      {/* L2 — INNOVATION: Novel features (5/5 wow) */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Innovation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CreatorDiscoveryPanel />
          <TipPropagationPanel />
          <ProofOfEngagementPanel />
        </div>
      </section>

      {/* L3 — INTELLIGENCE: Supporting AI (4/5 wow) */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Brain className="w-4 h-4 text-purple-400" />
          Intelligence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PredictorPanel />
          <RiskDashboard />
          <EngagementPanel />
        </div>
      </section>

      {/* L4 — EXECUTION: Tools (3/5 wow) */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Zap className="w-4 h-4 text-amber-400" />
          Execution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeeOptimizer />
          <StreamingPanel />
          <FeeArbitragePanel />
        </div>
      </section>

      {/* L5 — DEFI TOOLS: Collapsed (incremental features) */}
      <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50">
        <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors select-none">
          <span>DeFi Tools</span>
          <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="px-5 pb-5 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <EscrowPanel />
            <MemoryPanel />
            <DcaPanel />
            <CreatorAnalyticsPanel />
          </div>
        </div>
      </details>
    </div>
  );
}
