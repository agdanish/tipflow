// Copyright 2026 Danish A. Licensed under Apache-2.0.
// TipFlow — AI-Powered Multi-Chain Tipping Agent

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
// import { WalletCard } from './components/WalletCard';
// import { TipForm } from './components/TipForm';
// import { BatchTipForm } from './components/BatchTipForm';
// import { SplitTipForm } from './components/SplitTipForm';
// import { AgentPanel } from './components/AgentPanel';
// import { TipHistory } from './components/TipHistory';
import { StatsPanel } from './components/StatsPanel';
import { GasMonitor } from './components/GasMonitor';
import { CurrencyConverter } from './components/CurrencyConverter';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { Challenges } from './components/Challenges';
// import { ActivityFeed } from './components/ActivityFeed';
import { QRReceive } from './components/QRReceive';
// import { DecisionTree } from './components/DecisionTree';
import { TipTemplates } from './components/TipTemplates';
// import { WalletCardSkeleton } from './components/Skeleton';
import { ToastContainer, useToasts } from './components/Toast';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OnboardingOverlay, isOnboardingComplete } from './components/OnboardingOverlay';
import { ChatInterface } from './components/ChatInterface';
import { SecurityStatus } from './components/SecurityStatus';
import { ConditionalTips } from './components/ConditionalTips';
import { WebhookManager } from './components/WebhookManager';
import { ContactsManager } from './components/ContactsManager';
import { InstallPrompt } from './components/InstallPrompt';
import { ApiDocs } from './components/ApiDocs';
import { NetworkHealth } from './components/NetworkHealth';
import { TelegramStatus } from './components/TelegramStatus';
import { useNotifications } from './components/NotificationCenter';
import { WalletBackup } from './components/WalletBackup';
import { WalletSwitcher } from './components/WalletSwitcher';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
// import { TransactionTimeline } from './components/TransactionTimeline';
// import { ExportPanel } from './components/ExportPanel';
import { Footer } from './components/Footer';
import { HelpCenter } from './components/HelpCenter';
import { SystemInfo } from './components/SystemInfo';
import { TechStack } from './components/TechStack';
import { TipLinkCreator } from './components/TipLinkCreator';
import { ShareCard } from './components/ShareCard';
import { MobileNav } from './components/MobileNav';
// import { TipCalendar } from './components/TipCalendar';
import { initAccentColor } from './components/ThemeCustomizer';
import { ChainComparison } from './components/ChainComparison';
// import { FavoriteRecipients } from './components/FavoriteRecipients';
// import { QuickActions } from './components/QuickActions';
import { AuditLog } from './components/AuditLog';
// import { TipGoals } from './components/TipGoals';
import { SpendingLimits } from './components/SpendingLimits';
import { BatchImport } from './components/BatchImport';
import { TipReport } from './components/TipReport';
import { DemoBanner } from './components/DemoBanner';
import { DemoScenarios } from './components/DemoScenarios';
import { RumbleIntegration } from './components/RumbleIntegration';
// import { AutonomyPanel } from './components/AutonomyPanel';
import { TreasuryPanel } from './components/TreasuryPanel';
import { BridgePanel } from './components/BridgePanel';
import { LendingPanel } from './components/LendingPanel';
// import { StreamingPanel } from './components/StreamingPanel';
import { CryptoReceiptPanel } from './components/CryptoReceipt';
// import { ReputationPanel } from './components/ReputationPanel';
// import { OrchestratorPanel } from './components/OrchestratorPanel';
// import { PredictorPanel } from './components/PredictorPanel';
// import { FeeArbitragePanel } from './components/FeeArbitragePanel';
// import { EscrowPanel } from './components/EscrowPanel';
// import { MemoryPanel } from './components/MemoryPanel';
// import { DcaPanel } from './components/DcaPanel';
// import { CreatorAnalyticsPanel } from './components/CreatorAnalyticsPanel';
// import { RiskDashboard } from './components/RiskDashboard';
// import { EngagementPanel } from './components/EngagementPanel';
// import { CreatorDiscoveryPanel } from './components/CreatorDiscoveryPanel';
// import { TipPropagationPanel } from './components/TipPropagationPanel';
// import { ProofOfEngagementPanel } from './components/ProofOfEngagementPanel';
import { HealthDashboard } from './components/HealthDashboard';
import { useHealth, useBalances, useAgentState, useHistory, useStats } from './hooks/useApi';
import { useSpotlight } from './hooks/useSpotlight';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSwipe } from './hooks/useTouchGestures';
import { api } from './lib/api';
import { playSuccess, playError, playNotification, isSoundEnabled, setSoundEnabled } from './lib/sounds';
import type { TipResult, ScheduledTip, LeaderboardEntry, Achievement, TipTemplate, SplitTipResult, TipLink } from './types';
import { DashboardTabs } from './components/DashboardTabs';
import { CommandPalette, useCommandActions } from './components/CommandPalette';
import { SuccessCelebration } from './components/SuccessCelebration';
// import { PortfolioSummary } from './components/PortfolioSummary';
// TransactionTracker, PriceTicker, SmartSuggestions — now used via ui-v3 components
// import { FeeOptimizer } from './components/FeeOptimizer';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { FloatingMenu } from './components/FloatingMenu';
import { InnovationShowcase } from './components/InnovationShowcase';
import { IndexerPanel } from './components/IndexerPanel';
import { WdkCapabilities } from './components/WdkCapabilities';
import { DecisionAuditTrail } from './components/DecisionAuditTrail';
import { AgentActivityFeed } from './components/AgentActivityFeed';
import { EconomicsDashboard } from './components/EconomicsDashboard';
import { PluginRegistry } from './components/PluginRegistry';
import { DeveloperHub } from './components/DeveloperHub';
import { ProtocolOverview } from './components/ProtocolOverview';
// LiveMetrics — now used via ui-v3 DashboardHero
import { ApiExplorer } from './components/ApiExplorer';
// import { AgentCapabilities } from './components/AgentCapabilities';
import { DashboardHero, TipComposer, ContextFeed, WalletStrip, InsightBar } from './ui-v3/dashboard';
import { HistoryPage } from './ui-v3/history';
import { AiEnginePage } from './ui-v3/ai';

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
  const [trackedTx, setTrackedTx] = useState<TipResult | null>(null);
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

  // Cursor spotlight effect on main content
  const spotlightRef = useSpotlight<HTMLElement>();

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

  // Keyboard shortcuts & Command Palette
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const shortcutActions = useMemo(
    () => ({
      submitForm: () => {
        const form = document.getElementById('tip-form') as HTMLFormElement | null;
        if (form) form.requestSubmit();
      },
      focusNlpInput: () => {
        setShowCommandPalette(true);
      },
      toggleTipMode: () => setTipMode((prev) => prev === 'single' ? 'batch' : prev === 'batch' ? 'split' : 'single'),
      toggleTheme,
      showShortcutsHelp: () => setShowShortcuts(true),
      closeModal: () => { setShowShortcuts(false); setShowCommandPalette(false); },
    }),
    [toggleTheme],
  );

  useKeyboardShortcuts(shortcutActions);

  // Command palette actions with tab navigation via hash
  const navigateToTab = useCallback((tab: string) => {
    window.location.hash = tab;
  }, []);

  const commandActions = useCommandActions({
    onNavigate: navigateToTab,
    onToggleTheme: toggleTheme,
    onToggleSound: toggleSound,
    onShowShortcuts: () => setShowShortcuts(true),
    onRefreshBalances: refreshBalances,
    theme,
    soundOn,
  });

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
      setShowCelebration(true);
      setTrackedTx(result);
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
      setShowCelebration(true);
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
      setShowCelebration(true);
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <Header health={health} theme={theme} onToggleTheme={toggleTheme} soundOn={soundOn} onToggleSound={toggleSound} onShowShortcuts={() => setShowShortcuts(true)} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onClearAll={clearAll} />

      <main ref={spotlightRef} id="main-content" role="main" className="relative z-10 flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Demo Mode Banner */}
        <DemoBanner />

        {/* Tabbed content */}
        <DashboardTabs
          dashboardContent={
            <>
              {/* V3 HERO — wallet summary + agent status + CTA */}
              <DashboardHero
                balances={balances}
                health={health}
                agentStatus={agentState.status}
                totalTips={stats?.totalTips ?? 0}
                onSendTip={() => {
                  setTipMode('single');
                  setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement>('[aria-label="Tip amount"], [aria-label="Tip amount in USDT"]');
                    input?.focus();
                  }, 200);
                }}
              />

              {/* V3 MAIN: 8/4 Composer + Context */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6" data-onboarding="tip-form">
                <div className="lg:col-span-8">
                  <TipComposer
                    tipMode={tipMode}
                    setTipMode={setTipMode}
                    tipTabsRef={tipTabsRef}
                    isAgentBusy={isAgentBusy}
                    pendingTemplate={pendingTemplate}
                    tipLinkPrefill={tipLinkPrefill}
                    onTipComplete={handleTipComplete}
                    onTipScheduled={handleTipScheduled}
                    onBatchComplete={handleBatchComplete}
                    onSplitComplete={handleSplitComplete}
                    onTemplatePrefilled={() => setPendingTemplate(null)}
                    onTipLinkPrefilled={() => setTipLinkPrefill(null)}
                  />
                </div>
                <div className="lg:col-span-4">
                  <ContextFeed
                    agentState={agentState}
                    trackedTx={trackedTx}
                    onDismissTracked={() => setTrackedTx(null)}
                    scheduledTips={scheduledTips}
                    onCancelScheduled={handleCancelScheduled}
                  />
                </div>
              </div>

              {/* V3 WALLETS — horizontal scroll strip */}
              <WalletStrip balances={balances} loading={balancesLoading} />

              {/* V3 INSIGHTS */}
              <InsightBar onNavigate={navigateToTab} tipCount={stats?.totalTips ?? 0} />

              {/* Secondary content — single collapsible */}
              <details className="group rounded-xl bg-zinc-900/30 border border-zinc-800/50 mb-6">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors select-none">
                  <span>More: Templates, Contacts, Demo & Showcase</span>
                  <svg className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 space-y-5 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div id="tip-templates-section"><TipTemplates onUseTemplate={handleUseTemplate} /></div>
                    <TipLinkCreator />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContactsManager />
                    <QRReceive />
                  </div>
                  <BatchImport />
                  <ConditionalTips />
                  <AgentActivityFeed />
                  <DecisionAuditTrail />
                  <DemoScenarios onSetTipMode={setTipMode} onTipComplete={handleTipComplete} />
                  <InnovationShowcase onNavigate={navigateToTab} />
                  <ProtocolOverview />
                </div>
              </details>
            </>
          }

          analyticsContent={
            <div className="space-y-6">
              <EconomicsDashboard />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <StatsPanel stats={stats} />
                <div id="chain-comparison-section"><ChainComparison /></div>
              </div>
              <AnalyticsDashboard />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ActivityHeatmap history={history} />
                <TipReport history={history} />
              </div>
              <Leaderboard entries={leaderboard} loading={leaderboardLoading} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Achievements achievements={achievements} loading={achievementsLoading} />
                <Challenges />
              </div>
              <TechStack />
            </div>
          }
          historyContent={
            <HistoryPage history={history} loading={historyLoading} />
          }
          rumbleContent={
            <RumbleIntegration />
          }
          aiContent={
            <AiEnginePage agentMode={(health as Record<string, string> | null)?.aiMode ?? 'rule-based'} chainCount={balances.length} />
          }
          settingsContent={
            <div className="space-y-6 max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SettingsPanel theme={theme} onToggleTheme={toggleTheme} soundOn={soundOn} onToggleSound={toggleSound} />
                <div className="space-y-5">
                  <WalletBackup totalTransactions={stats?.totalTips ?? 0} />
                  <WalletSwitcher onActiveChanged={() => refreshBalances()} />
                </div>
              </div>

              <HealthDashboard />

              <section>
                <h2 className="text-lg font-bold text-text-primary mb-4">System Monitors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <GasMonitor />
                  <CurrencyConverter />
                  <SecurityStatus />
                  <NetworkHealth />
                  <TelegramStatus />
                  <SystemInfo />
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TreasuryPanel />
                <BridgePanel />
                <LendingPanel />
                <SpendingLimits />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <WdkCapabilities />
                <CryptoReceiptPanel />
                <IndexerPanel />
              </div>

              <details className="group rounded-xl bg-surface-2/50 border border-border">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-text-primary hover:text-accent transition-colors select-none">
                  <span>Integrations & Webhooks</span>
                  <svg className="w-4 h-4 text-text-muted transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 space-y-5 animate-slide-down">
                  <WebhookManager />
                  <AuditLog />
                </div>
              </details>

              <details className="group rounded-xl bg-surface-2/50 border border-border">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-text-primary hover:text-accent transition-colors select-none">
                  <span>Developer Tools</span>
                  <svg className="w-4 h-4 text-text-muted transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 space-y-5 animate-slide-down">
                  <ApiDocs />
                  <DeveloperHub />
                  <PluginRegistry />
                  <ApiExplorer />
                </div>
              </details>
            </div>
          }
        />
      </main>

      {/* Help Center */}
      <HelpCenter />

      {/* Footer */}
      <Footer />

      <ChatInterface />
      <InstallPrompt />
      {shareResult && (
        <ShareCard result={shareResult} onClose={() => setShareResult(null)} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={commandActions}
      />
      <SuccessCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Onboarding overlay — first visit only */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}

      <MobileNav />

      {/* Floating Quick Action Menu */}
      <FloatingMenu
        onSingleTip={() => {
          navigateToTab('dashboard');
          setTipMode('single');
          setTimeout(() => document.getElementById('nlp-input')?.focus(), 200);
        }}
        onBatchTip={() => {
          navigateToTab('dashboard');
          setTipMode('batch');
        }}
        onSplitTip={() => {
          navigateToTab('dashboard');
          setTipMode('split');
        }}
        onRefresh={refreshBalances}
        onCommandPalette={() => setShowCommandPalette(true)}
      />
    </div>
  );
}

export default App;
