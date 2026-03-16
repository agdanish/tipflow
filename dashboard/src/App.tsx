import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { TipForm } from './components/TipForm';
import { AgentPanel } from './components/AgentPanel';
import { TipHistory } from './components/TipHistory';
import { StatsPanel } from './components/StatsPanel';
import { ToastContainer, useToasts } from './components/Toast';
import { useHealth, useBalances, useAgentState, useHistory, useStats } from './hooks/useApi';
import type { TipResult } from './types';
import { Wallet } from 'lucide-react';

function App() {
  const { health } = useHealth();
  const { balances, loading: balancesLoading, refresh: refreshBalances } = useBalances();
  const agentState = useAgentState();
  const { history, loading: historyLoading, refresh: refreshHistory } = useHistory();
  const { stats, refresh: refreshStats } = useStats();
  const { toasts, addToast, dismissToast } = useToasts();

  const handleTipComplete = (result: TipResult) => {
    if (result.status === 'confirmed') {
      addToast('success', 'Tip Sent!', `${result.amount} sent to ${result.to.slice(0, 10)}... on ${result.chainId}`);
    } else {
      addToast('error', 'Tip Failed', result.error ?? 'Transaction failed');
    }
    refreshBalances();
    refreshHistory();
    refreshStats();
  };

  const isAgentBusy = agentState.status !== 'idle';

  return (
    <div className="min-h-screen bg-surface">
      <Header health={health} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Wallets */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallets
          </h2>
          {balancesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-44 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {balances.map((b) => (
                <WalletCard key={b.chainId} balance={b} />
              ))}
            </div>
          )}
        </section>

        {/* Main grid: Tip Form + Agent | History + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Tip Form + Agent */}
          <div className="lg:col-span-1 space-y-6">
            <TipForm onTipComplete={handleTipComplete} disabled={isAgentBusy} />
            <AgentPanel state={agentState} />
          </div>

          {/* Right column: History + Stats */}
          <div className="lg:col-span-2 space-y-6">
            <TipHistory history={history} loading={historyLoading} />
            <StatsPanel stats={stats} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs text-text-muted">
            Built with{' '}
            <a
              href="https://wdk.tether.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Tether WDK
            </a>
            {' '}&middot; TipFlow &middot; Tether Hackathon Galactica 2026
          </p>
        </footer>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
