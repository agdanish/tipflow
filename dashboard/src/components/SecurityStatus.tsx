import { Shield, CheckCircle2 } from 'lucide-react';

interface SecurityCheck {
  label: string;
  active: boolean;
}

const CHECKS: SecurityCheck[] = [
  { label: 'Rate limiting', active: true },
  { label: 'Input validation', active: true },
  { label: 'Self-custodial keys', active: true },
  { label: 'Security headers', active: true },
];

export function SecurityStatus() {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-green-500/10">
          <Shield className="w-4 h-4 text-green-400" />
        </div>
        <h3 className="text-sm font-medium text-text-secondary">Security</h3>
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-400">Active</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {CHECKS.map((check) => (
          <div key={check.label} className="flex items-center gap-2 px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-xs text-text-secondary">{check.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 px-2 py-1.5 rounded-md bg-surface-2 border border-border">
        <p className="text-[10px] text-text-muted leading-relaxed">
          Keys never leave your device. All transactions are signed locally using WDK self-custodial wallets.
        </p>
      </div>
    </div>
  );
}
