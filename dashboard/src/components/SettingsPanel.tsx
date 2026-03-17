import { useState, useEffect, useCallback } from 'react';
import { Settings, ChevronDown, ChevronRight, RotateCcw, Save, Loader2, MessageSquare, Link2, Coins, Bell, Palette, Volume2, Globe } from 'lucide-react';
import { api } from '../lib/api';
import type { PersonalityType, PersonalityDefinition, AgentSettings, ChainId, TokenType } from '../types';
import { LOCALES, getStoredLocale, storeLocale, type Locale } from '../lib/i18n';

/** Personality preview messages for each type */
const PERSONALITY_PREVIEWS: Record<PersonalityType, string> = {
  professional: 'Transaction confirmed. 0.01 ETH has been transferred to 0x1234...abcd on Ethereum Sepolia.',
  friendly: 'Awesome, tip sent! 0.01 ETH is on its way to 0x1234...abcd via Ethereum Sepolia. Nice one!',
  pirate: 'Arr! The treasure be delivered! 0.01 ETH sailed to 0x1234...abcd across the Ethereum Sepolia seas. Yo ho ho!',
  emoji: 'Tip sent! 0.01 ETH to 0x1234...abcd on Ethereum Sepolia!',
  minimal: 'Sent 0.01 ETH to 0x1234...abcd on Ethereum Sepolia. TX: 0xabcdef...',
};

const PERSONALITY_LABELS: Record<PersonalityType, { name: string; desc: string }> = {
  professional: { name: 'Professional', desc: 'Formal and business-like' },
  friendly: { name: 'Friendly', desc: 'Warm and casual' },
  pirate: { name: 'Pirate', desc: 'Arr! Talk like a pirate' },
  emoji: { name: 'Emoji', desc: 'Expressive with emoji' },
  minimal: { name: 'Minimal', desc: 'Short and concise' },
};

const CHAIN_OPTIONS: Array<{ value: ChainId | ''; label: string }> = [
  { value: '', label: 'Auto (AI decides)' },
  { value: 'ethereum-sepolia', label: 'Ethereum Sepolia' },
  { value: 'ton-testnet', label: 'TON Testnet' },
  { value: 'tron-nile', label: 'Tron Nile' },
];

const DEFAULT_SETTINGS: AgentSettings = {
  personality: 'friendly',
  defaultChain: '',
  defaultToken: 'native',
  autoConfirmThreshold: '0.01',
  autoConfirmEnabled: false,
  notifications: {
    tipSent: true,
    tipFailed: true,
    conditionTriggered: true,
    scheduledExecuted: true,
  },
};

interface SettingsPanelProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export function SettingsPanel({ theme, onToggleTheme, soundOn, onToggleSound }: SettingsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  // Load settings from backend + localStorage on mount
  useEffect(() => {
    if (!expanded) return;

    const loadSettings = async () => {
      try {
        // Load from localStorage first for instant display
        const stored = localStorage.getItem('tipflow-settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Partial<AgentSettings>;
            setSettings((prev) => ({ ...prev, ...parsed }));
          } catch {
            // Ignore parse errors
          }
        }

        // Then sync with backend
        const { settings: backendSettings } = await api.getSettings();
        setSettings(backendSettings);
      } catch {
        // Use defaults if backend unavailable
      }
    };

    loadSettings();
  }, [expanded]);

  const saveSettings = useCallback(async (newSettings: AgentSettings) => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Save to localStorage immediately
      localStorage.setItem('tipflow-settings', JSON.stringify(newSettings));

      // Save to backend
      await api.updateSettings(newSettings);

      // If personality changed, also update via the personality endpoint
      if (newSettings.personality !== settings.personality) {
        await api.setPersonality(newSettings.personality);
      }

      setSettings(newSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [settings.personality]);

  const updateField = useCallback(<K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-save on change
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  const updateNotification = useCallback((key: keyof AgentSettings['notifications'], value: boolean) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  const resetToDefaults = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const handleLocaleChange = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);
    // Reload the page to apply locale changes
    window.location.reload();
  }, []);

  return (
    <section className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-2/50 transition-colors"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-secondary" />
          Settings
        </h2>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-6 border-t border-border pt-4">
          {/* Status Bar */}
          {(saving || saved || error) && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              error ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              saved ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-accent/10 text-accent border border-accent/20'
            }`}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {saving ? 'Saving...' : saved ? 'Settings saved!' : error ? `Error: ${error}` : ''}
            </div>
          )}

          {/* Agent Personality */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Agent Personality
            </h3>
            <div className="space-y-2">
              {(Object.keys(PERSONALITY_LABELS) as PersonalityType[]).map((type) => (
                <label
                  key={type}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.personality === type
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border-hover bg-surface-2/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    value={type}
                    checked={settings.personality === type}
                    onChange={() => updateField('personality', type)}
                    className="mt-0.5 accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {PERSONALITY_LABELS[type].name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {PERSONALITY_LABELS[type].desc}
                      </span>
                    </div>
                    {settings.personality === type && (
                      <div className="mt-2 p-2 rounded bg-surface-3/50 border border-border text-xs text-text-secondary italic">
                        Preview: "{PERSONALITY_PREVIEWS[type]}"
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Default Chain */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              Default Chain
            </h3>
            <select
              value={settings.defaultChain}
              onChange={(e) => updateField('defaultChain', e.target.value as ChainId | '')}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {CHAIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              When set, tips will default to this chain instead of AI auto-selection.
            </p>
          </div>

          {/* Default Token */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              Default Token
            </h3>
            <div className="flex gap-2">
              {(['native', 'usdt'] as TokenType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateField('defaultToken', t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    settings.defaultToken === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-border-hover'
                  }`}
                >
                  {t === 'native' ? 'Native (ETH/TON)' : 'USDT'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-confirm Tips */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Save className="w-3.5 h-3.5 text-green-400" />
              Auto-confirm Small Tips
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoConfirmEnabled}
                  onChange={(e) => updateField('autoConfirmEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
              </label>
              <span className="text-sm text-text-secondary">
                {settings.autoConfirmEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {settings.autoConfirmEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Threshold:</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={settings.autoConfirmThreshold}
                  onChange={(e) => updateField('autoConfirmThreshold', e.target.value)}
                  className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-xs text-text-muted">
                  Tips below this amount skip confirmation
                </span>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Bell className="w-3.5 h-3.5 text-orange-400" />
              Notification Preferences
            </h3>
            <div className="space-y-2">
              {[
                { key: 'tipSent' as const, label: 'Tip Sent', desc: 'When a tip is successfully sent' },
                { key: 'tipFailed' as const, label: 'Tip Failed', desc: 'When a tip transaction fails' },
                { key: 'conditionTriggered' as const, label: 'Condition Triggered', desc: 'When a conditional tip fires' },
                { key: 'scheduledExecuted' as const, label: 'Scheduled Executed', desc: 'When a scheduled tip runs' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-2/50 cursor-pointer">
                  <div>
                    <span className="text-sm text-text-primary">{label}</span>
                    <span className="text-[11px] text-text-muted ml-2">{desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications[key]}
                    onChange={(e) => updateNotification(key, e.target.checked)}
                    className="accent-accent"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Theme
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => { if (theme === 'light') onToggleTheme(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  theme === 'dark'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface-2 text-text-secondary hover:border-border-hover'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => { if (theme === 'dark') onToggleTheme(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  theme === 'light'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface-2 text-text-secondary hover:border-border-hover'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Sound */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Sound
            </h3>
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-2/50 cursor-pointer">
              <span className="text-sm text-text-primary">
                Enable sound effects
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={onToggleSound}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
              </label>
            </label>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Language
            </h3>
            <select
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as Locale)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Reset to Defaults */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={resetToDefaults}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary border border-border hover:bg-surface-2 hover:text-text-primary transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
