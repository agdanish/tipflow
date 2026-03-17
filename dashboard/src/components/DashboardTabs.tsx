import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LayoutDashboard, BarChart3, History, Settings, Tv } from 'lucide-react';
import { t } from '../lib/i18n';
import { useLocale } from '../hooks/useLocale';

export type TabId = 'dashboard' | 'analytics' | 'history' | 'rumble' | 'settings';

interface TabDef {
  id: TabId;
  labelKey: string;
  icon: ReactNode;
}

const tabDefs: TabDef[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'analytics', labelKey: 'nav.analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'history',   labelKey: 'nav.history',   icon: <History className="w-4 h-4" /> },
  { id: 'rumble',    labelKey: 'nav.rumble',    icon: <Tv className="w-4 h-4" /> },
  { id: 'settings',  labelKey: 'nav.settings',  icon: <Settings className="w-4 h-4" /> },
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
  settingsContent: ReactNode;
}

export function DashboardTabs({ dashboardContent, analyticsContent, historyContent, rumbleContent, settingsContent }: DashboardTabsProps) {
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
    settings: settingsContent,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-surface-1 border border-border overflow-x-auto">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-0
                ${activeTab === tab.id
                  ? 'bg-accent/10 text-accent border border-accent-border shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }
              `}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {contentMap[activeTab]}
      </div>
    </div>
  );
}
