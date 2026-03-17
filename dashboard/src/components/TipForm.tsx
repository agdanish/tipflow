import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Coins, Sparkles, Wand2, Clock, CalendarClock, BookUser, UserPlus, X, Trash2, BookMarked, Repeat } from 'lucide-react';
import { api } from '../lib/api';
import type { ChainId, TokenType, TipResult, Contact, TipTemplate } from '../types';

interface TipFormProps {
  onTipComplete: (result: TipResult) => void;
  onTipScheduled?: () => void;
  disabled: boolean;
  prefillTemplate?: TipTemplate | null;
  onTemplatePrefilled?: () => void;
}

export function TipForm({ onTipComplete, onTipScheduled, disabled, prefillTemplate, onTemplatePrefilled }: TipFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('native');
  const [chain, setChain] = useState<ChainId | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule state
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Save as template state
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Prefill from template
  useEffect(() => {
    if (prefillTemplate) {
      setRecipient(prefillTemplate.recipient);
      setAmount(prefillTemplate.amount);
      setToken(prefillTemplate.token);
      setChain((prefillTemplate.chainId as ChainId) || '');
      onTemplatePrefilled?.();
    }
  }, [prefillTemplate, onTemplatePrefilled]);

  // Contacts / address book state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const contactsRef = useRef<HTMLDivElement>(null);

  // Load contacts on mount
  useEffect(() => {
    api.getContacts().then(({ contacts: c }) => setContacts(c)).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contactsRef.current && !contactsRef.current.contains(e.target as Node)) {
        setShowContacts(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectContact = (c: Contact) => {
    setRecipient(c.address);
    if (c.chain) setChain(c.chain);
    setShowContacts(false);
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !recipient.trim()) return;
    try {
      const { contact } = await api.addContact(contactName.trim(), recipient.trim(), chain || undefined);
      setContacts((prev) => {
        const exists = prev.some((c) => c.id === contact.id);
        return exists ? prev.map((c) => (c.id === contact.id ? contact : c)) : [contact, ...prev];
      });
      setSavingContact(false);
      setContactName('');
    } catch {
      // silently fail
    }
  };

  const handleDeleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silently fail
    }
  };

  const refreshContacts = () => {
    api.getContacts().then(({ contacts: c }) => setContacts(c)).catch(() => {});
  };

  // NLP parsing state
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [nlpParsed, setNlpParsed] = useState(false);
  const [nlpSource, setNlpSource] = useState<'llm' | 'regex' | null>(null);
  const [nlpConfidence, setNlpConfidence] = useState(0);

  const handleNlpParse = async () => {
    if (!nlpInput.trim() || nlpParsing) return;

    setNlpParsing(true);
    setError(null);
    setNlpParsed(false);

    try {
      const { parsed, source } = await api.parseTipInput(nlpInput.trim());

      if (parsed.confidence === 0) {
        setError('Could not parse tip command. Try: "send 0.01 ETH to 0x..."');
        return;
      }

      // Auto-fill form fields from parsed result
      if (parsed.recipient) setRecipient(parsed.recipient);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.token) {
        setToken(parsed.token);
        if (parsed.token === 'usdt') setChain('ethereum-sepolia');
      }
      if (parsed.chain) setChain(parsed.chain as ChainId);
      if (parsed.message) setMessage(parsed.message);

      setNlpParsed(true);
      setNlpSource(source);
      setNlpConfidence(parsed.confidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse input');
    } finally {
      setNlpParsing(false);
    }
  };

  const handleNlpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNlpParse();
    }
  };

  const clearNlpState = () => {
    setNlpParsed(false);
    setNlpSource(null);
    setNlpConfidence(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || sending || disabled) return;

    if (scheduleMode) {
      if (!scheduledAt) {
        setError('Please select a date and time for the scheduled tip');
        return;
      }
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate.getTime() <= Date.now()) {
        setError('Scheduled time must be in the future');
        return;
      }
    }

    setSending(true);
    setError(null);

    try {
      if (scheduleMode) {
        await api.scheduleTip(
          recipient,
          amount,
          new Date(scheduledAt).toISOString(),
          token,
          chain || undefined,
          message || undefined,
          recurring || undefined,
          recurring ? interval : undefined,
        );
        onTipScheduled?.();
      } else {
        const { result } = await api.sendTip(
          recipient,
          amount,
          token,
          chain || undefined,
          message || undefined,
        );
        onTipComplete(result);
        refreshContacts(); // Update tip counts
      }
      setRecipient('');
      setAmount('');
      setMessage('');
      setChain('');
      setScheduledAt('');
      setRecurring(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const presetAmounts = token === 'usdt' ? ['1', '5', '10', '25'] : ['0.001', '0.005', '0.01', '0.05'];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-accent" />
        Send Tip
      </h2>

      {/* NLP Natural Language Input */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <label className="text-xs text-text-secondary">Natural Language Command</label>
          {nlpParsed && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-medium text-purple-400">
              <Sparkles className="w-3 h-3" />
              {nlpSource === 'llm' ? 'AI' : 'Smart'} parsed &middot; {nlpConfidence}% confidence
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => { setNlpInput(e.target.value); clearNlpState(); }}
            onKeyDown={handleNlpKeyDown}
            id="nlp-input"
            placeholder='e.g. "send 0.01 ETH to 0x..."'
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
            disabled={sending || disabled || nlpParsing}
          />
          <button
            type="button"
            onClick={handleNlpParse}
            disabled={!nlpInput.trim() || nlpParsing || sending || disabled}
            className="px-3 sm:px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs sm:text-sm font-medium hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            {nlpParsing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Parse</span>
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1 hidden sm:block">
          Try: "send 0.01 ETH to 0x..." &middot; "tip 5 USDT to 0x..." &middot; "transfer 0.1 TON to UQ..."
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />
        <div className="flex justify-center -mt-2 mb-2">
          <span className="px-2 bg-surface-1 text-[10px] text-text-muted uppercase tracking-wider">or fill manually</span>
        </div>
      </div>

      <form id="tip-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Token selector */}
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Token</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setToken('native'); setAmount(''); }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                token === 'native'
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface-2 text-text-secondary hover:border-border-light'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span className="sm:hidden">ETH/TON</span>
              <span className="hidden sm:inline">Native (ETH/TON)</span>
            </button>
            <button
              type="button"
              onClick={() => { setToken('usdt'); setAmount(''); setChain('ethereum-sepolia'); }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                token === 'usdt'
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-surface-2 text-text-secondary hover:border-border-light'
              }`}
            >
              <span className="text-xs font-bold">$</span>
              USDT
            </button>
          </div>
        </div>

        <div ref={contactsRef} className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-secondary">Recipient Address</label>
            {contacts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowContacts(!showContacts)}
                className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent-light transition-colors"
              >
                <BookUser className="w-3 h-3" />
                Contacts ({contacts.length})
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              onFocus={() => { if (contacts.length > 0 && !recipient) setShowContacts(true); }}
              placeholder={token === 'usdt' ? '0x...' : '0x... or UQ...'}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors font-mono"
              disabled={sending || disabled}
            />
            {recipient.trim() && !savingContact && (
              <button
                type="button"
                onClick={() => setSavingContact(true)}
                title="Save to contacts"
                className="px-2.5 py-2.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-accent hover:border-accent-border transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Save contact inline form */}
          {savingContact && (
            <div className="flex gap-1.5 mt-1.5">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveContact(); } }}
                placeholder="Contact name..."
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-surface-2 border border-accent-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-border transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={!contactName.trim()}
                className="px-2.5 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-light disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setSavingContact(false); setContactName(''); }}
                className="px-2 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Contacts dropdown */}
          {showContacts && contacts.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-surface-2 border border-border shadow-lg">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectContact(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-3 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">{c.name}</div>
                    <div className="text-[10px] text-text-muted font-mono truncate">{c.address}</div>
                  </div>
                  {c.tipCount > 0 && (
                    <span className="text-[10px] text-text-muted shrink-0">{c.tipCount} tips</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteContact(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-error transition-all shrink-0"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Amount {token === 'usdt' ? '(USDT)' : ''}
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={token === 'usdt' ? '10.00' : '0.01'}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            disabled={sending || disabled}
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-md bg-surface-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                {token === 'usdt' ? `$${preset}` : preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Chain Preference <span className="text-text-muted">(optional — agent decides if empty)</span>
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as ChainId | '')}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border transition-colors"
            disabled={sending || disabled || token === 'usdt'}
          >
            {token === 'usdt' ? (
              <option value="ethereum-sepolia">Ethereum Sepolia (USDT)</option>
            ) : (
              <>
                <option value="">Auto (AI decides)</option>
                <option value="ethereum-sepolia">Ethereum Sepolia</option>
                <option value="ton-testnet">TON Testnet</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1.5">
            Message <span className="text-text-muted">(optional)</span>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Great work on the PR!"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            disabled={sending || disabled}
          />
        </div>

        {/* Schedule toggle */}
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setScheduleMode(!scheduleMode); setScheduledAt(''); setRecurring(false); }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                scheduleMode ? 'bg-amber-500' : 'bg-surface-3 border border-border'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  scheduleMode ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer" onClick={() => { setScheduleMode(!scheduleMode); setScheduledAt(''); setRecurring(false); }}>
              <Clock className="w-3.5 h-3.5" />
              Schedule for later
            </label>
          </div>
          {scheduleMode && (
            <div className="mt-2 space-y-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-amber-500/30 text-sm text-text-primary focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                disabled={sending || disabled}
              />
              {/* Recurring toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRecurring(!recurring)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    recurring ? 'bg-purple-500' : 'bg-surface-3 border border-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      recurring ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer" onClick={() => setRecurring(!recurring)}>
                  <Repeat className="w-3.5 h-3.5" />
                  Recurring
                </label>
                {recurring && (
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="ml-auto px-2 py-1 rounded-md bg-surface-2 border border-purple-500/30 text-xs text-text-primary focus:outline-none transition-colors"
                    disabled={sending || disabled}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>
              <p className="text-[10px] text-text-muted">
                {recurring
                  ? `The agent will execute this tip ${interval} starting at the scheduled time.`
                  : 'The agent will autonomously execute this tip at the scheduled time.'}
              </p>
            </div>
          )}
        </div>

        {/* Save as Template */}
        {recipient.trim() && amount.trim() && (
          <div>
            {savingTemplate ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (templateName.trim()) {
                        api.createTemplate({
                          name: templateName.trim(),
                          recipient,
                          amount,
                          token,
                          chainId: chain || undefined,
                        }).then(() => {
                          setSavingTemplate(false);
                          setTemplateName('');
                        }).catch(() => {});
                      }
                    }
                  }}
                  placeholder="Template name..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-surface-2 border border-blue-500/30 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!templateName.trim()) return;
                    api.createTemplate({
                      name: templateName.trim(),
                      recipient,
                      amount,
                      token,
                      chainId: chain || undefined,
                    }).then(() => {
                      setSavingTemplate(false);
                      setTemplateName('');
                    }).catch(() => {});
                  }}
                  disabled={!templateName.trim()}
                  className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setSavingTemplate(false); setTemplateName(''); }}
                  className="px-1.5 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSavingTemplate(true)}
                className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                <BookMarked className="w-3.5 h-3.5" />
                Save as Template
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
            <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!recipient || !amount || sending || disabled || (scheduleMode && !scheduledAt)}
          className={`w-full py-3 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
            scheduleMode
              ? 'bg-amber-500 text-white hover:bg-amber-400'
              : 'bg-accent text-white hover:bg-accent-light'
          }`}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {scheduleMode ? 'Scheduling...' : 'Agent Processing...'}
            </>
          ) : scheduleMode ? (
            <>
              <CalendarClock className="w-4 h-4" />
              Schedule {token === 'usdt' ? 'USDT' : ''} Tip
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send {token === 'usdt' ? 'USDT' : ''} Tip
            </>
          )}
        </button>
      </form>
    </div>
  );
}
