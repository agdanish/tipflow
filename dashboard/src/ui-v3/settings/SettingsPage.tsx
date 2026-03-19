import { Settings, Shield, BarChart3, Layers, Plug, Code } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { SettingsPanel } from '../../components/SettingsPanel';
import { WalletBackup } from '../../components/WalletBackup';
import { WalletSwitcher } from '../../components/WalletSwitcher';
import { HealthDashboard } from '../../components/HealthDashboard';
import { GasMonitor } from '../../components/GasMonitor';
import { CurrencyConverter } from '../../components/CurrencyConverter';
import { SecurityStatus } from '../../components/SecurityStatus';
import { NetworkHealth } from '../../components/NetworkHealth';
import { TelegramStatus } from '../../components/TelegramStatus';
import { SystemInfo } from '../../components/SystemInfo';
import { SpendingLimits } from '../../components/SpendingLimits';
import { TreasuryPanel } from '../../components/TreasuryPanel';
import { BridgePanel } from '../../components/BridgePanel';
import { LendingPanel } from '../../components/LendingPanel';
import { CryptoReceiptPanel } from '../../components/CryptoReceipt';
import { WdkCapabilities } from '../../components/WdkCapabilities';
import { IndexerPanel } from '../../components/IndexerPanel';
import { WebhookManager } from '../../components/WebhookManager';
import { AuditLog } from '../../components/AuditLog';
import { ApiDocs } from '../../components/ApiDocs';
import { DeveloperHub } from '../../components/DeveloperHub';
import { PluginRegistry } from '../../components/PluginRegistry';
import { ApiExplorer } from '../../components/ApiExplorer';

interface SettingsPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  totalTips: number;
  onWalletChanged: () => void;
}

export function SettingsPage({ theme, onToggleTheme, soundOn, onToggleSound, totalTips, onWalletChanged }: SettingsPageProps) {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your agent, wallets, and integrations</p>
      </div>

      {/* ── ACCOUNT & PREFERENCES ── */}
      <SettingsSection icon={Settings} iconColor="bg-zinc-800 text-zinc-300" title="Account & Preferences" subtitle="Agent personality, defaults, theme" first>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <SettingsPanel theme={theme} onToggleTheme={onToggleTheme} soundOn={soundOn} onToggleSound={onToggleSound} />
          </div>
          <div className="lg:col-span-5 space-y-5">
            <WalletBackup totalTransactions={totalTips} />
            <WalletSwitcher onActiveChanged={onWalletChanged} />
          </div>
        </div>
      </SettingsSection>

      {/* ── SYSTEM HEALTH ── */}
      <SettingsSection icon={Shield} iconColor="bg-emerald-900/50 text-emerald-400" title="System Health" subtitle="Service status and monitoring">
        <HealthDashboard />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <GasMonitor />
          <CurrencyConverter />
          <SecurityStatus />
          <NetworkHealth />
          <TelegramStatus />
          <SystemInfo />
        </div>
      </SettingsSection>

      {/* ── FINANCIAL CONTROLS ── */}
      <SettingsSection icon={BarChart3} iconColor="bg-blue-900/50 text-blue-400" title="Financial Controls" subtitle="Spending limits and treasury management">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SpendingLimits />
          <TreasuryPanel />
        </div>
      </SettingsSection>

      {/* ── DEFI & INFRASTRUCTURE ── */}
      <SettingsSection icon={Layers} iconColor="bg-purple-900/50 text-purple-400" title="DeFi & Infrastructure" subtitle="Bridge, lending, receipts, indexer">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BridgePanel />
          <LendingPanel />
          <CryptoReceiptPanel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <WdkCapabilities />
          <IndexerPanel />
        </div>
      </SettingsSection>

      {/* ── INTEGRATIONS (collapsible) ── */}
      <div className="mb-6 pt-8 border-t border-zinc-800/50">
        <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <summary className="flex items-center gap-3 cursor-pointer px-5 py-4 select-none">
            <div className="w-8 h-8 rounded-lg bg-amber-900/50 text-amber-400 flex items-center justify-center">
              <Plug className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-zinc-300 hover:text-white transition-colors flex-1">Integrations & Webhooks</span>
            <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div className="px-5 pb-5 space-y-5 animate-slide-down">
            <WebhookManager />
            <AuditLog />
          </div>
        </details>
      </div>

      {/* ── DEVELOPER TOOLS (collapsible) ── */}
      <div className="mb-6">
        <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <summary className="flex items-center gap-3 cursor-pointer px-5 py-4 select-none">
            <div className="w-8 h-8 rounded-lg bg-cyan-900/50 text-cyan-400 flex items-center justify-center">
              <Code className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-zinc-300 hover:text-white transition-colors flex-1">Developer Tools</span>
            <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </summary>
          <div className="px-5 pb-5 space-y-5 animate-slide-down">
            <ApiDocs />
            <DeveloperHub />
            <PluginRegistry />
            <ApiExplorer />
          </div>
        </details>
      </div>
    </div>
  );
}
