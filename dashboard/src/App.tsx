import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { TipForm } from './components/TipForm';
import { BatchTipForm } from './components/BatchTipForm';
import { SplitTipForm } from './components/SplitTipForm';
import { AgentPanel } from './components/AgentPanel';
import { TipHistory } from './components/TipHistory';
import { StatsPanel } from './components/StatsPanel';
import { GasMonitor } from './components/GasMonitor';
import { CurrencyConverter } from './components/CurrencyConverter';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { Challenges } from './components/Challenges';
import { ActivityFeed } from './components/ActivityFeed';
import { QRReceive } from './components/QRReceive';
import { DecisionTree } from './components/DecisionTree';
import { TipTemplates } from './components/TipTemplates';
import { WalletCardSkeleton } from './components/Skeleton';
import { ToastContainer, useToasts } from './components/Toast';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OnboardingOverlay, isOnboardingComplete, resetOnboarding } from './components/OnboardingOverlay';
import { ChatInterface } from './components/ChatInterface';
import { SecurityStatus } from './components/SecurityStatus';
import { ConditionalTips } from './components/ConditionalTips';
import { WebhookManager } from './components/WebhookManager';
import { InstallPrompt } from './components/InstallPrompt';
import { ApiDocs } from './components/ApiDocs';
import { NetworkHealth } from './components/NetworkHealth';
import { TelegramStatus } from './components/TelegramStatus';
import { useNotifications } from './components/NotificationCenter';
import { WalletBackup } from './components/WalletBackup';
import { WalletSwitcher } from './components/WalletSwitcher';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { TransactionTimeline } from './components/TransactionTimeline';
import { ExportPanel } from './components/ExportPanel';
import { Footer } from './components/Footer';
import { SystemInfo } from './components/SystemInfo';
import { TechStack } from './components/TechStack';
import { TipLinkCreator } from './components/TipLinkCreator';
import { ShareCard } from './components/ShareCard';
import { MobileNav } from './components/MobileNav';
import { initAccentColor } from './components/ThemeCustomizer';
import { useHealth, useBalances, useAgentState, useHistory, useStats } from './hooks/useApi';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSwipe } from './hooks/useTouchGestures';
import { api } from './lib/api';
import { playSuccess, playError, playNotification, isSoundEnabled, setSoundEnabled } from './lib/sounds';
import type { TipResult, ScheduledTip, LeaderboardEntry, Achievement, TipTemplate, SplitTipResult, TipLink } from './types';
import { Wallet, Send, Users, Scissors, CalendarClock, X, Clock, CheckCircle2, XCircle, Repeat } from 'lucide-react';

function App() {
  const { health } = useHealth();
  const { balances, loading: balancesLoading, refresh: refreshBalances } = useBalances();
  const agentState = useAgentState();
  const { history, loading: historyLoading, refresh: refreshHistory } = useHistory();
  const { stats, refresh: refreshStats } = useStats();
  const { toasts, addToast, dismissToast } = useToasts();
  const { notifications, pushNotification, markRead, markAllRead, clearAll } = useNotifications();
  const [tipMode, setTipMode] = useState<'single' | 'batch' | 'split'>('single');
  const [scheduledTips, setScheduledTips] = useState<ScheduledTip[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [pendingTemplate, setPendingTemplate] = useState<TipTemplate | null>(null);
  const [tipLinkPrefill, setTipLinkPrefill] = useState<TipLink | null>(null);
  const [shareResult, setShareResult] = useState<TipResult | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingComplete());
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tipflow-theme') as 'dark' | 'light') || 'dark';
  });

  // Initialize accent color from localStorage
  useEffect(() => { initAccentColor(); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('tipflow-theme', theme);
  }, [theme]);

  // Swipe gesture ref for tip mode tabs
  const tipTabsRef = useRef<HTMLDivElement>(null);
  const swipeHandlers = useMemo(() => ({
    onSwipeLeft: () => setTipMode((prev) => prev === 'single' ? 'batch' : prev === 'batch' ? 'split' : prev),
    onSwipeRight: () => setTipMode((prev) => prev === 'split' ? 'batch' : prev === 'batch' ? 'single' : prev),
  }), []);
  useSwipe(tipTabsRef, swipeHandlers);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  // Keyboard shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcutActions = useMemo(
    () => ({
      submitForm: () => {
        const form = document.getElementById('tip-form') as HTMLFormElement | null;
        if (form) form.requestSubmit();
      },
      focusNlpInput: () => {
        const input = document.getElementById('nlp-input') as HTMLInputElement | null;
        if (input) input.focus();
      },
      toggleTipMode: () => setTipMode((prev) => prev === 'single' ? 'batch' : prev === 'batch' ? 'split' : 'single'),
      toggleTheme,
      showShortcutsHelp: () => setShowShortcuts(true),
      closeModal: () => setShowShortcuts(false),
    }),
    [toggleTheme],
  );

  useKeyboardShortcuts(shortcutActions);

  // Request browser notification permission once on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check URL for ?tiplink= param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipLinkId = params.get('tiplink');
    if (tipLinkId) {
      api.getTipLink(tipLinkId).then(({ tipLink }) => {
        setTipLinkPrefill(tipLink);
        setTipMode('single');
        // Clean URL without reload
        const url = new URL(window.location.href);
        url.searchParams.delete('tiplink');
        window.history.replaceState({}, '', url.pathname + url.search);
      }).catch(() => {
        addToast('error', 'Tip Link Not Found', 'The tip link may have expired or been deleted.');
      });
    }
  }, [addToast]);

  // SSE activity stream -> push to notification center
  useEffect(() => {
    let es: EventSource | null = null;

    const connect = () => {
      es = new EventSource('/api/activity/stream');

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'activity' && data.event) {
            const evt = data.event as { type: string; message: string; detail?: string };
            if (evt.type === 'tip_sent') {
              pushNotification('tip_sent', evt.message, evt.detail);
              playNotification();
            } else if (evt.type === 'tip_failed') {
              pushNotification('tip_failed', evt.message, evt.detail);
              playNotification();
            } else if (evt.type === 'condition_triggered') {
              pushNotification('condition_triggered', evt.message, evt.detail);
              playNotification();
            } else if (evt.type === 'tip_scheduled') {
              pushNotification('scheduled_executed', evt.message, evt.detail);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es?.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
    };
  }, [pushNotification]);

  const refreshScheduledTips = useCallback(async () => {
    try {
      const { tips } = await api.getScheduledTips();
      setScheduledTips(tips);
    } catch {
      // Keep existing
    }
  }, []);

  // Poll scheduled tips every 10 seconds
  useEffect(() => {
    refreshScheduledTips();
    const id = setInterval(refreshScheduledTips, 10_000);
    return () => clearInterval(id);
  }, [refreshScheduledTips]);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const { leaderboard: lb } = await api.getLeaderboard();
      setLeaderboard(lb);
    } catch {
      // keep existing
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const refreshAchievements = useCallback(async () => {
    try {
      const { achievements: ach } = await api.getAchievements();
      setAchievements(ach);
    } catch {
      // keep existing
    } finally {
      setAchievementsLoading(false);
    }
  }, []);

  // Fetch leaderboard and achievements on mount
  useEffect(() => {
    refreshLeaderboard();
    refreshAchievements();
  }, [refreshLeaderboard, refreshAchievements]);

  const handleTipScheduled = () => {
    addToast('success', 'Tip Scheduled', 'The agent will execute this tip at the scheduled time.');
    refreshScheduledTips();
  };

  const handleCancelScheduled = async (id: string) => {
    try {
      await api.cancelScheduledTip(id);
      addToast('success', 'Cancelled', 'Scheduled tip cancelled.');
      refreshScheduledTips();
    } catch {
      addToast('error', 'Error', 'Failed to cancel scheduled tip.');
    }
  };

  const handleTipComplete = (result: TipResult) => {
    if (result.status === 'confirmed') {
      const msg = `${result.amount} ${result.token === 'usdt' ? 'USDT' : ''} sent to ${result.to.slice(0, 10)}... on ${result.chainId}`;
      addToast('success', 'Tip Sent!', msg);
      pushNotification('tip_sent', msg, `TX: ${result.txHash.slice(0, 16)}...`);
      playSuccess();
      setShareResult(result);
      // Clear tiplink prefill after successful tip
      if (tipLinkPrefill) setTipLinkPrefill(null);
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TipFlow — Tip Sent!', {
          body: msg,
          icon: '/favicon.svg',
        });
      }
    } else {
      const errMsg = result.error ?? 'Transaction failed';
      addToast('error', 'Tip Failed', errMsg);
      pushNotification('tip_failed', errMsg);
      playError();
    }
    refreshBalances();
    refreshHistory();
    refreshStats();
    refreshLeaderboard();
    refreshAchievements();
  };

  const handleBatchComplete = (results: TipResult[]) => {
    const succeeded = results.filter((r) => r.status === 'confirmed').length;
    if (succeeded > 0) {
      const msg = `${succeeded}/${results.length} tips sent successfully`;
      addToast('success', 'Batch Complete', msg);
      pushNotification('tip_sent', `Batch: ${msg}`);
      playSuccess();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TipFlow — Batch Complete', {
          body: msg,
          icon: '/favicon.svg',
        });
      }
    } else {
      addToast('error', 'Batch Failed', 'All tips in the batch failed');
      pushNotification('tip_failed', 'Batch failed: all tips failed');
      playError();
    }
    refreshBalances();
    refreshHistory();
    refreshStats();
    refreshLeaderboard();
    refreshAchievements();
  };

  const handleSplitComplete = (result: SplitTipResult) => {
    if (result.successCount > 0) {
      const msg = `${result.successCount}/${result.results.length} split tips sent (total: ${result.totalAmount})`;
      addToast('success', 'Split Complete', msg);
      pushNotification('tip_sent', `Split: ${msg}`);
      playSuccess();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TipFlow — Split Complete', {
          body: msg,
          icon: '/favicon.svg',
        });
      }
    } else {
      addToast('error', 'Split Failed', 'All split tips failed');
      pushNotification('tip_failed', 'Split failed: all tips failed');
      playError();
    }
    refreshBalances();
    refreshHistory();
    refreshStats();
    refreshLeaderboard();
    refreshAchievements();
  };

  const handleUseTemplate = useCallback((template: TipTemplate) => {
    setTipMode('single');
    setPendingTemplate(template);
    addToast('success', 'Template Loaded', `"${template.name}" loaded into tip form.`);
  }, [addToast]);

  const isAgentBusy = agentState.status !== 'idle';

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <Header health={health} theme={theme} onToggleTheme={toggleTheme} soundOn={soundOn} onToggleSound={toggleSound} onShowShortcuts={() => setShowShortcuts(true)} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onClearAll={clearAll} />

      <main id="main-content" role="main" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Wallets */}
        <section className="mb-4 sm:mb-6" data-onboarding="wallets">
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallets
          </h2>
          {balancesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <WalletCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {balances.map((b) => (
                <WalletCard key={b.chainId} balance={b} />
              ))}
            </div>
          )}
          <div className="mt-4">
            <WalletSwitcher onActiveChanged={() => refreshBalances()} />
          </div>
          <div className="mt-4">
            <WalletBackup totalTransactions={stats?.totalTips ?? 0} />
          </div>
        </section>

        {/* Gas Price Monitor + Currency Converter + Security + Network Health + Telegram + System Info */}
        <section className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <GasMonitor />
          <CurrencyConverter />
          <SecurityStatus />
          <NetworkHealth />
          <TelegramStatus />
          <SystemInfo />
        </section>

        {/* Main grid: Tip Form + Agent | History + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column: Tip Form + Agent */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Tip mode tabs */}
            <div ref={tipTabsRef} className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border" data-onboarding="tip-form">
              <button
                onClick={() => setTipMode('single')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                  tipMode === 'single'
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Single Tip
              </button>
              <button
                onClick={() => setTipMode('batch')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                  tipMode === 'batch'
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Batch Tip
              </button>
              <button
                onClick={() => setTipMode('split')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                  tipMode === 'split'
                    ? 'bg-surface-3 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Split
              </button>
            </div>

            {/* Swipe hint — mobile only */}
            <p className="text-[10px] text-text-muted text-center mt-1 sm:hidden">Swipe to switch tip mode</p>

            {/* Tip Link banner */}
            {tipLinkPrefill && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-cyan-400">Tip Link Loaded</p>
                  <button
                    onClick={() => setTipLinkPrefill(null)}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-text-secondary">
                  You&apos;re about to tip <span className="font-semibold text-text-primary">{tipLinkPrefill.amount} {tipLinkPrefill.token === 'usdt' ? 'USDT' : 'Native'}</span> to{' '}
                  <span className="font-mono text-[11px]">{tipLinkPrefill.recipient.slice(0, 10)}...{tipLinkPrefill.recipient.slice(-6)}</span>
                </p>
                {tipLinkPrefill.message && (
                  <p className="text-[11px] text-text-muted italic">&ldquo;{tipLinkPrefill.message}&rdquo;</p>
                )}
              </div>
            )}

            {tipMode === 'single' && (
              <TipForm
                onTipComplete={handleTipComplete}
                onTipScheduled={handleTipScheduled}
                disabled={isAgentBusy}
                prefillTemplate={pendingTemplate}
                onTemplatePrefilled={() => setPendingTemplate(null)}
                prefillTipLink={tipLinkPrefill}
                onTipLinkPrefilled={() => setTipLinkPrefill(null)}
              />
            )}
            {tipMode === 'batch' && (
              <BatchTipForm onBatchComplete={handleBatchComplete} disabled={isAgentBusy} />
            )}
            {tipMode === 'split' && (
              <SplitTipForm onSplitComplete={handleSplitComplete} disabled={isAgentBusy} />
            )}
            <TipTemplates onUseTemplate={handleUseTemplate} />
            <TipLinkCreator />
            <div data-onboarding="agent-panel">
              <AgentPanel state={agentState} />
            </div>
            {agentState.currentDecision && (
              <DecisionTree decision={agentState.currentDecision} agentStatus={agentState.status} />
            )}
            <ConditionalTips />
            <WebhookManager />
            <ActivityFeed />
            <QRReceive />
          </div>

          {/* Right column: Scheduled Tips + History + Stats */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Scheduled Tips */}
            {scheduledTips.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
                <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  Scheduled Tips
                  <span className="ml-auto text-xs font-normal text-text-muted">
                    {scheduledTips.filter((t) => t.status === 'scheduled').length} pending
                  </span>
                </h2>
                <div className="space-y-2">
                  {scheduledTips.map((tip) => (
                    <div
                      key={tip.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        tip.status === 'scheduled'
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : tip.status === 'executed'
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="shrink-0">
                        {tip.status === 'scheduled' && <Clock className="w-4 h-4 text-amber-400" />}
                        {tip.status === 'executed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {tip.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="font-medium text-text-primary">
                            {tip.amount} {tip.token === 'usdt' ? 'USDT' : tip.chain === 'ton-testnet' ? 'TON' : 'ETH'}
                          </span>
                          <span className="text-text-muted">to</span>
                          <span className="font-mono text-xs text-text-secondary truncate">
                            {tip.recipient.slice(0, 8)}...{tip.recipient.slice(-6)}
                          </span>
                          {tip.recurring && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-[10px] font-medium text-purple-400">
                              <Repeat className="w-2.5 h-2.5" />
                              {tip.interval}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {tip.status === 'scheduled' ? (
                            <>Fires {new Date(tip.scheduledAt).toLocaleString()}</>
                          ) : tip.status === 'executed' ? (
                            <>Executed {new Date(tip.executedAt!).toLocaleString()}</>
                          ) : (
                            <>Failed {tip.executedAt ? new Date(tip.executedAt).toLocaleString() : ''}</>
                          )}
                          {tip.recurring && tip.lastExecuted && (
                            <> &middot; Last: {new Date(tip.lastExecuted).toLocaleString()}</>
                          )}
                          {tip.message && <> &middot; "{tip.message}"</>}
                        </div>
                      </div>
                      {tip.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelScheduled(tip.id)}
                          className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancel scheduled tip"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div id="section-history" />
            <TipHistory history={history} loading={historyLoading} />
            <ExportPanel historyCount={history.length} />
            <TransactionTimeline history={history} loading={historyLoading} />
            <StatsPanel stats={stats} />
            <Leaderboard entries={leaderboard} loading={leaderboardLoading} />
            <Achievements achievements={achievements} loading={achievementsLoading} />
            <Challenges />
          </div>
        </div>

        {/* Advanced Analytics (collapsible) */}
        <section id="section-analytics" className="mt-6">
          <AnalyticsDashboard />
        </section>

        {/* Settings (collapsible) */}
        <section id="section-settings" className="mt-6">
          <SettingsPanel theme={theme} onToggleTheme={toggleTheme} soundOn={soundOn} onToggleSound={toggleSound} />
        </section>

        {/* API Documentation (collapsible) */}
        <section className="mt-6">
          <ApiDocs />
        </section>

        {/* Tech Stack */}
        <section className="mt-6">
          <TechStack />
        </section>
      </main>

      {/* Footer */}
      <Footer />

      <ChatInterface />
      <InstallPrompt />
      {shareResult && (
        <ShareCard result={shareResult} onClose={() => setShareResult(null)} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Onboarding overlay — first visit only */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}

      <MobileNav />

      {/* Tour restart button */}
      {!showOnboarding && (
        <button
          onClick={() => { resetOnboarding(); setShowOnboarding(true); }}
          className="fixed bottom-5 right-5 z-50 w-9 h-9 rounded-full bg-surface-2 border border-border text-text-muted hover:text-accent hover:border-accent-border flex items-center justify-center transition-all shadow-lg"
          title="Replay onboarding tour"
        >
          <span className="text-sm font-bold">?</span>
        </button>
      )}
    </div>
  );
}

export default App;
