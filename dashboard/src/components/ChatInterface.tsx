import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ChatMessage } from '../types';

const MAX_MESSAGES = 50;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content:
    "Hey! I'm TipFlow, your AI tipping assistant. I can send tips, check balances, compare fees, and more. Try saying \"help\" to see everything I can do!",
  timestamp: new Date().toISOString(),
};

/** Inline SVG chat icon */
function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Inline SVG send icon */
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/** Inline SVG close (X) icon */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Typing indicator dots */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        T
      </div>
      <div className="bg-surface-2 dark:bg-surface-2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/** Rich action card for tip executions, balance checks, etc. */
function ActionCard({ action }: { action: NonNullable<ChatMessage['action']> }) {
  const data = action.data ?? {};

  if (action.type === 'tip_executed') {
    return (
      <div className="mt-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-green-400 font-semibold text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Tip Confirmed
        </div>
        <div className="text-text-secondary">
          <span className="font-medium">{String(data.amount)}</span>{' '}
          {data.token === 'usdt' ? 'USDT' : String(data.chainId).startsWith('ethereum') ? 'ETH' : 'TON'}
          {' '}&rarr;{' '}
          <span className="font-mono">{String(data.to ?? '').slice(0, 10)}...</span>
        </div>
        <div className="text-text-muted">
          Fee: {String(data.fee)} &middot; Chain: {String(data.chainId).startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet'}
        </div>
        {data.explorerUrl && (
          <a
            href={String(data.explorerUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-block mt-1"
          >
            View on Explorer &rarr;
          </a>
        )}
      </div>
    );
  }

  if (action.type === 'balance_check') {
    const balances = (data.balances ?? []) as Array<{ chainId: string; native: string; usdt: string; currency: string }>;
    return (
      <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs space-y-1.5">
        <div className="text-blue-400 font-semibold text-sm">Wallet Balances</div>
        {balances.map((b) => (
          <div key={b.chainId} className="flex justify-between text-text-secondary">
            <span>{b.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet'}</span>
            <span className="font-mono">{b.native} {b.currency}{parseFloat(b.usdt) > 0 ? ` + ${b.usdt} USDT` : ''}</span>
          </div>
        ))}
      </div>
    );
  }

  if (action.type === 'fee_estimate') {
    const comparison = (data.comparison ?? []) as Array<{ chainName: string; estimatedFeeUsd: string; estimatedFee: string }>;
    return (
      <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1.5">
        <div className="text-amber-400 font-semibold text-sm">Fee Comparison</div>
        {comparison.map((c, i) => (
          <div key={i} className="flex justify-between text-text-secondary">
            <span>{c.chainName}{i === 0 ? ' (cheapest)' : ''}</span>
            <span className="font-mono">~${c.estimatedFeeUsd}</span>
          </div>
        ))}
      </div>
    );
  }

  if (action.type === 'address_lookup') {
    const addresses = (data.addresses ?? {}) as Record<string, string>;
    return (
      <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs space-y-1.5">
        <div className="text-purple-400 font-semibold text-sm">Wallet Addresses</div>
        {Object.entries(addresses).map(([chainId, addr]) => (
          <div key={chainId} className="text-text-secondary">
            <div className="text-text-muted text-[10px]">{chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet'}</div>
            <div className="font-mono break-all">{addr}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/** Format message content with line breaks */
function MessageContent({ text }: { text: string }) {
  const parts = text.split('\n');
  return (
    <>
      {parts.map((line, i) => (
        <span key={i}>
          {line}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { message: agentMessage } = await api.sendChatMessage(trimmed);
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), agentMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-20 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          title="Chat with TipFlow Agent"
        >
          <ChatIcon />
          {/* Notification dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] sm:w-[400px] h-[520px] max-h-[80vh] flex flex-col rounded-2xl border border-border bg-surface-1 shadow-2xl overflow-hidden
          max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-h-full max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              T
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-primary">TipFlow Agent</div>
              <div className="text-[11px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              title="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'agent' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    T
                  </div>
                )}
                <div
                  className={`max-w-[80%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm'
                      : 'bg-surface-2 border border-border text-text-primary rounded-2xl rounded-tl-sm px-4 py-2.5'
                  }`}
                >
                  <MessageContent text={msg.content} />
                  {msg.action && <ActionCard action={msg.action} />}
                  <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-text-muted'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-border bg-surface-2 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isTyping}
                className="flex-1 bg-surface-1 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message"
              >
                <SendIcon />
              </button>
            </div>
            <div className="text-[10px] text-text-muted mt-1.5 text-center">
              Try: "check my balance" or "send 0.01 ETH to 0x..."
            </div>
          </div>
        </div>
      )}
    </>
  );
}
