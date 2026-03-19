import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LayoutDashboard, BarChart3, History, Settings, Tv, Brain } from 'lucide-react';
import { t } from '../lib/i18n';
import { useLocale } from '../hooks/useLocale';

export type TabId = 'dashboard' | 'analytics' | 'history' | 'rumble' | 'ai' | 'settings';

interface TabDef {
  id: TabId;
  labelKey: string;
  Icon: typeof LayoutDashboard;
}

const tabDefs: TabDef[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { id: 'analytics', labelKey: 'nav.analytics', Icon: BarChart3 },
  { id: 'history',   labelKey: 'nav.history',   Icon: History },
  { id: 'rumble',    labelKey: 'nav.rumble',     Icon: Tv },
  { id: 'ai',        labelKey: 'nav.ai',         Icon: Brain },
  { id: 'settings',  labelKey: 'nav.settings',   Icon: Settings },
];

function getTabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '') as TabId;
  if (tabDefs.some((td) => td.id === hash)) return hash;
  return (localStorage.getItem('tipflow-active-tab') as TabId) || 'dashboard';
}

interface DashboardTabsProps {
  dashboardContent: ReactNode;
  analyticsContent: ReactNode;
  historyContent: ReactNode;
  rumbleContent: ReactNode;
  aiContent: ReactNode;
  settingsContent: ReactNode;
  /** Tab IDs that have unread/new data */
  tabsWithUpdates?: TabId[];
}

export function DashboardTabs({ dashboardContent, analyticsContent, historyContent, rumbleContent, aiContent, settingsContent, tabsWithUpdates = [] }: DashboardTabsProps) {
  // Re-render on locale change so tab labels update
  useLocale();

  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);

  // Sync hash on mount and on popstate
  useEffect(() => {
    const onHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchTab = useCallback((id: TabId) => {
    setActiveTab(id);
    localStorage.setItem('tipflow-active-tab', id);
    window.location.hash = id;
  }, []);

  const contentMap: Record<TabId, ReactNode> = {
    dashboard: dashboardContent,
    analytics: analyticsContent,
    history: historyContent,
    rumble: rumbleContent,
    ai: aiContent,
    settings: settingsContent,
  };

  return (
    <div className="mb-6">
      <nav className="flex gap-1 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800/50" role="tablist">
        {tabDefs.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasUpdate = tabsWithUpdates.includes(tab.id) && !isActive;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              {hasUpdate && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-6" key={activeTab}>
        {contentMap[activeTab]}
      </div>
    </div>
  );
}
