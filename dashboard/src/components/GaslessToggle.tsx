import { useState, useEffect } from 'react';
import { Fuel, Zap, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { GaslessStatus } from '../types';

interface GaslessToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function GaslessToggle({ enabled, onToggle, disabled }: GaslessToggleProps) {
  const [status, setStatus] = useState<GaslessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    api.getGaslessStatus()
      .then((s) => setStatus(s))
      .catch(() => {
        setStatus(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const isAvailable = status?.gaslessAvailable ?? false;
  const isDisabled = disabled || !isAvailable || loading;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (!isDisabled) onToggle(!enabled);
          }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled && isAvailable
              ? 'bg-green-500'
              : isDisabled
                ? 'bg-surface-3 border border-border opacity-50 cursor-not-allowed'
                : 'bg-surface-3 border border-border'
          }`}
          disabled={isDisabled}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              enabled && isAvailable ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
        <label
          className={`flex items-center gap-1.5 text-xs cursor-pointer ${
            isDisabled ? 'text-text-muted cursor-not-allowed' : 'text-text-secondary'
          }`}
          onClick={() => {
            if (!isDisabled) onToggle(!enabled);
          }}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Fuel className="w-3.5 h-3.5" />
          )}
          Gasless Mode
          {enabled && isAvailable && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-xs font-medium text-green-400">
              <Zap className="w-2.5 h-2.5" />
              Zero Gas
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tooltip / Status Panel */}
      {showTooltip && status && (
        <div className="absolute z-30 left-0 right-0 mt-2 p-3 rounded-lg bg-surface-2 border border-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-green-400" />
              ERC-4337 Account Abstraction
            </h4>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            {/* EVM ERC-4337 Status */}
            <div className="flex items-start gap-2 p-2 rounded-md bg-surface-3">
              {status.evmErc4337.available ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary">
                  {status.evmErc4337.chainName}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {status.evmErc4337.available
                    ? 'Bundler + Paymaster connected. Transactions sponsored via Safe ERC-4337.'
                    : (status.evmErc4337.reason ?? 'Not configured')}
                </div>
              </div>
            </div>

            {/* TON Gasless Status */}
            <div className="flex items-start gap-2 p-2 rounded-md bg-surface-3">
              {status.tonGasless.available ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary">
                  {status.tonGasless.chainName}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {status.tonGasless.available
                    ? 'TON gasless relay connected. Token transfers pay no gas.'
                    : (status.tonGasless.reason ?? 'Not configured')}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            Gasless mode uses WDK ERC-4337 (Account Abstraction) and TON Gasless packages
            so users pay zero gas fees. A paymaster or sponsor covers transaction costs.
            Falls back to regular transactions if gasless is unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
