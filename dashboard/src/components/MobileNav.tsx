import { useState, useEffect } from 'react';

type NavTab = 'home' | 'history' | 'analytics' | 'settings';

const TABS: Array<{ id: NavTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'history', label: 'History' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

/** SVG icons rendered inline to avoid extra dependencies */
function TabIcon({ id, active }: { id: NavTab; active: boolean }) {
  const color = active ? 'var(--color-accent)' : 'var(--color-text-muted)';

  switch (id) {
    case 'home':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'history':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'analytics':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

/** Hash-based tab navigation matching DashboardTabs */
const TAB_HASH_MAP: Record<NavTab, string> = {
  home: 'dashboard',
  history: 'history',
  analytics: 'analytics',
  settings: 'settings',
};

function hashToNavTab(): NavTab {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'history') return 'history';
  if (hash === 'analytics') return 'analytics';
  if (hash === 'settings') return 'settings';
  return 'home';
}

export function MobileNav() {
  const [active, setActive] = useState<NavTab>(hashToNavTab);
  const [isMobile, setIsMobile] = useState(false);

  // Sync with hash changes (from DashboardTabs, CommandPalette, etc.)
  useEffect(() => {
    const onHashChange = () => setActive(hashToNavTab());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Only render on mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handleChange(mq);
    mq.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
  }, []);

  if (!isMobile) return null;

  const handleTabClick = (tab: NavTab) => {
    setActive(tab);
    // Use hash-based navigation (same as DashboardTabs)
    window.location.hash = TAB_HASH_MAP[tab];
    // Scroll to top of main content
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-1/95 backdrop-blur-md"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <TabIcon id={tab.id} active={isActive} />
              <span
                className="text-xs font-medium transition-colors"
                style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
