// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { Layers, ExternalLink } from 'lucide-react';

interface ProtocolLayer {
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  metrics: string;
}

const LAYERS: ProtocolLayer[] = [
  {
    name: 'APPLICATION',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500/5',
    description: '115 components \u00b7 230+ endpoints \u00b7 SDK',
    metrics: 'React + Vite + MCP + REST + WebSocket',
  },
  {
    name: 'INTELLIGENCE',
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500/5',
    description: 'multi-agent \u00b7 engagement \u00b7 prediction \u00b7 risk',
    metrics: '3-agent consensus \u00b7 Guardian veto \u00b7 ML scoring',
  },
  {
    name: 'ECONOMICS',
    color: 'text-amber-400',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-500/5',
    description: 'x402 \u00b7 treasury \u00b7 fee arbitrage \u00b7 yield',
    metrics: 'Aave V3 lending \u00b7 cross-chain optimization',
  },
  {
    name: 'EXECUTION',
    color: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/5',
    description: '11-step pipeline \u00b7 escrow \u00b7 streaming \u00b7 DCA',
    metrics: 'Atomic tips \u00b7 4 escrow modes \u00b7 micro-streams',
  },
  {
    name: 'WALLET',
    color: 'text-green-400',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/5',
    description: 'Tether WDK \u00b7 10 packages \u00b7 3 chains',
    metrics: 'EVM \u00b7 TON \u00b7 TRON \u00b7 ERC-4337 \u00b7 USDT0 bridge',
  },
];

export function ProtocolOverview() {
  return (
    <div className="animated-border shadow-depth">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span className="gradient-text-animated">5-Layer Protocol Architecture</span>
          </h2>
          <button aria-label="View protocol specification" className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors group">
            View Protocol Spec
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Protocol stack — bottom to top rendering (reversed array) */}
        <div className="space-y-2">
          {LAYERS.map((layer, i) => (
            <div
              key={layer.name}
              className={`flex items-stretch rounded-lg border-l-[3px] ${layer.borderColor} ${layer.bgColor} overflow-hidden animate-list-item-in`}
              style={{
                animationDelay: `${i * 100}ms`,
                animationFillMode: 'both',
              }}
            >
              {/* Layer name badge */}
              <div className="flex items-center justify-center px-3 py-3 min-w-[100px]">
                <span className={`text-sm font-bold tracking-widest ${layer.color}`}>
                  {layer.name}
                </span>
              </div>

              {/* Divider */}
              <div className={`w-px ${layer.bgColor} opacity-50`} />

              {/* Description & metrics */}
              <div className="flex-1 px-3 py-2.5 flex flex-col justify-center">
                <p className="text-xs text-text-primary font-medium">{layer.description}</p>
                <p className="text-xs text-text-muted mt-0.5">{layer.metrics}</p>
              </div>

              {/* Layer number */}
              <div className="flex items-center px-3">
                <span className={`text-lg font-bold ${layer.color} opacity-20`}>
                  {LAYERS.length - i}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <span className="text-xs text-text-muted">Each layer is independently extensible via plugins</span>
        </div>
      </div>
    </div>
  );
}
