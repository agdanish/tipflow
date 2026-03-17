import { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Trash2, Loader2, Send, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import type { WebhookConfig } from '../types';

const AVAILABLE_EVENTS = [
  { value: 'tip.sent', label: 'Tip Sent' },
  { value: 'tip.failed', label: 'Tip Failed' },
  { value: 'tip.scheduled', label: 'Tip Scheduled' },
  { value: 'condition.triggered', label: 'Condition Triggered' },
];

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Form fields
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['tip.sent']);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { webhooks: wh } = await api.getWebhooks();
      setWebhooks(wh);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  };

  const handleRegister = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    setSaving(true);
    try {
      await api.registerWebhook(url.trim(), selectedEvents);
      setUrl('');
      setSelectedEvents(['tip.sent']);
      setCreating(false);
      fetchWebhooks();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testWebhooks();
      setTestResult({
        ok: true,
        message: `Test event sent to ${result.webhookCount} webhook(s)`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Webhook className="w-4 h-4 text-blue-400" />
          Webhooks
        </h2>
        <div className="flex items-center gap-2">
          {webhooks.length > 0 && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-accent-border transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Test
            </button>
          )}
          <button
            onClick={() => setCreating(!creating)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/10 border border-accent-border text-accent hover:bg-accent/20 transition-all"
          >
            {creating ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {creating ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {/* Test result feedback */}
      {testResult && (
        <div
          className={`mb-3 flex items-center gap-2 p-2.5 rounded-lg text-xs ${
            testResult.ok
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          )}
          {testResult.message}
        </div>
      )}

      {/* Add webhook form */}
      {creating && (
        <div className="mb-4 p-3 rounded-lg bg-surface-2 border border-border space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Events
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((evt) => (
                <label
                  key={evt.value}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                    selectedEvents.includes(evt.value)
                      ? 'bg-accent/15 border-accent-border text-accent'
                      : 'bg-surface border-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(evt.value)}
                    onChange={() => toggleEvent(evt.value)}
                    className="sr-only"
                  />
                  <span
                    className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
                      selectedEvents.includes(evt.value)
                        ? 'bg-accent border-accent text-white'
                        : 'border-border'
                    }`}
                  >
                    {selectedEvents.includes(evt.value) && '\u2713'}
                  </span>
                  {evt.label}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={saving || !url.trim() || selectedEvents.length === 0}
            className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Register Webhook
          </button>
        </div>
      )}

      {/* Webhook list */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading webhooks...
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-6">
          <Webhook className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
          <p className="text-sm text-text-muted">No webhooks registered</p>
          <p className="text-xs text-text-muted mt-1">
            Add a webhook URL to get notified when tips are sent
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-text-primary truncate">
                    {webhook.url}
                  </span>
                  {webhook.failCount > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-[10px] font-medium text-red-400">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {webhook.failCount} fail{webhook.failCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {webhook.events.map((evt) => (
                    <span
                      key={evt}
                      className="inline-block px-1.5 py-0.5 rounded bg-accent/10 border border-accent-border/30 text-[10px] font-medium text-accent"
                    >
                      {evt}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-text-muted">
                  Created {new Date(webhook.createdAt).toLocaleString()}
                  {webhook.lastTriggered && (
                    <> &middot; Last triggered {new Date(webhook.lastTriggered).toLocaleString()}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(webhook.id)}
                className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete webhook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
