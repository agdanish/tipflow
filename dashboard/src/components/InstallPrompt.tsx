import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tipflow-install-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if user previously dismissed
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-lg mx-auto flex items-center gap-3 rounded-xl border border-accent-border bg-surface-1 p-3 sm:p-4 shadow-xl backdrop-blur-sm">
        {/* Icon */}
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-accent/15 text-accent">
          <Download className="w-5 h-5" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Install TipFlow</p>
          <p className="text-xs text-text-secondary mt-0.5 leading-snug">
            Add to your home screen for quick access and offline support.
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {installing ? 'Installing...' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-2 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
