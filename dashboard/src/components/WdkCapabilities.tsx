// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useCallback } from 'react';
import { Shield, Cpu, Key, Layers, Zap, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Wallet, Hash, Link } from 'lucide-react';
import { api } from '../lib/api';

interface WdkPackage {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'available' | 'disabled';
  chain?: string;
}

const WDK_PACKAGES: WdkPackage[] = [
  { name: '@tetherto/wdk', description: 'Core WDK SDK — wallet lifecycle, key management', icon: <Cpu className="w-4 h-4" />, status: 'active' },
  { name: '@tetherto/wdk-wallet-evm', description: 'Ethereum/EVM wallet — Sepolia testnet transactions', icon: <Wallet className="w-4 h-4" />, status: 'active', chain: 'ethereum-sepolia' },
  { name: '@tetherto/wdk-wallet-ton', description: 'TON wallet — TON Testnet transactions', icon: <Wallet className="w-4 h-4" />, status: 'active', chain: 'ton-testnet' },
  { name: '@tetherto/wdk-wallet-tron', description: 'TRON wallet — TRON Nile testnet', icon: <Wallet className="w-4 h-4" />, status: 'active', chain: 'tron-nile' },
  { name: '@tetherto/wdk-wallet-evm-erc-4337', description: 'Account Abstraction — gasless tips via bundler/paymaster', icon: <Zap className="w-4 h-4" />, status: 'active' },
  { name: '@tetherto/wdk-wallet-ton-gasless', description: 'TON gasless — zero-fee TON transactions', icon: <Zap className="w-4 h-4" />, status: 'available' },
  { name: '@tetherto/wdk-protocol-bridge-usdt0-evm', description: 'USDT0 cross-chain bridge protocol', icon: <Link className="w-4 h-4" />, status: 'active' },
  { name: '@tetherto/wdk-protocol-lending-aave-evm', description: 'Aave V3 lending — treasury yield optimization', icon: <Layers className="w-4 h-4" />, status: 'active' },
];

interface DerivedAccount {
  index: number;
  address: string;
  path: string;
  isActive: boolean;
}

export function WdkCapabilities() {
  const [expanded, setExpanded] = useState(false);
  const [accounts, setAccounts] = useState<DerivedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [gaslessStatus, setGaslessStatus] = useState<{ available: boolean; bundlerUrl?: string } | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [wallets, gasless] = await Promise.allSettled([
        api.listWallets('ethereum-sepolia', 5),
        api.getGaslessStatus(),
      ]);

      if (wallets.status === 'fulfilled') {
        const data = wallets.value as unknown as { wallets: Array<{ index: number; address: string; path: string }>; activeIndex: number };
        setAccounts(
          (data.wallets ?? []).map(w => ({
            ...w,
            isActive: w.index === data.activeIndex,
          })),
        );
      }

      if (gasless.status === 'fulfilled') {
        const gs = gasless.value as unknown as Record<string, unknown>;
        setGaslessStatus({
          available: !!gs.available || !!gs.isAvailable,
          bundlerUrl: gs.bundlerUrl as string | undefined,
        });
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (expanded && accounts.length === 0) loadAccounts();
  }, [expanded, accounts.length, loadAccounts]);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Key className="w-4 h-4 text-accent" />
          WDK Wallet Capabilities
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
            8 packages
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-slide-down">
          {/* WDK Package Grid */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Integrated WDK Packages</p>
            <div className="space-y-1.5">
              {WDK_PACKAGES.map((pkg, i) => (
                <div
                  key={pkg.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/50 border border-border animate-list-item-in row-accent-hover"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={`shrink-0 ${pkg.status === 'active' ? 'text-accent' : 'text-text-muted'}`}>
                    {pkg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-medium text-text-primary truncate">{pkg.name}</p>
                    <p className="text-[10px] text-text-muted truncate">{pkg.description}</p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    pkg.status === 'active'
                      ? 'bg-green-500/10 text-green-400'
                      : pkg.status === 'available'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-surface-3 text-text-muted'
                  }`}>
                    {pkg.status === 'active' ? '● Active' : pkg.status === 'available' ? '○ Available' : '○ Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HD Derived Accounts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">HD Wallet Derivation (BIP-44)</p>
              <button onClick={loadAccounts} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {accounts.length > 0 ? (
              <div className="space-y-1">
                {accounts.map((acc) => (
                  <div
                    key={acc.index}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      acc.isActive
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-border bg-surface-2/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      acc.isActive ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {acc.index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-text-primary truncate">{acc.address}</p>
                      <p className="text-[9px] text-text-muted font-mono">{acc.path}</p>
                    </div>
                    {acc.isActive && (
                      <span className="text-[9px] font-medium text-accent px-1.5 py-0.5 rounded-full bg-accent/10">Active</span>
                    )}
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div className="h-20 skeleton rounded-lg" />
            ) : (
              <p className="text-[10px] text-text-muted text-center py-4">Click refresh to load derived accounts</p>
            )}
          </div>

          {/* ERC-4337 Account Abstraction Status */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">ERC-4337 Account Abstraction</p>
            <div className="p-3 rounded-lg bg-surface-2/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                {gaslessStatus?.available ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${gaslessStatus?.available ? 'text-green-400' : 'text-red-400'}`}>
                  Bundler {gaslessStatus?.available ? 'Connected' : 'Unavailable'}
                </span>
              </div>
              <div className="space-y-1 text-[10px] text-text-muted">
                <div className="flex justify-between">
                  <span>Protocol</span>
                  <span className="font-mono text-text-secondary">ERC-4337</span>
                </div>
                <div className="flex justify-between">
                  <span>Paymaster</span>
                  <span className="font-mono text-text-secondary">{gaslessStatus?.available ? 'Sponsored' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Cost to User</span>
                  <span className="font-mono text-green-400 font-semibold">{gaslessStatus?.available ? '$0.00' : 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Operations */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Cryptographic Operations</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border text-center">
                <Shield className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-text-primary">Proof-of-Tip</p>
                <p className="text-[9px] text-text-muted">SHA-256 + ECDSA</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border text-center">
                <Hash className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-text-primary">Receipt Signing</p>
                <p className="text-[9px] text-text-muted">WDK account.sign()</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
