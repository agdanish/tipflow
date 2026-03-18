import { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  tags: string[];
}

const FAQ_DATA: FaqItem[] = [
  {
    question: 'What is TipFlow?',
    answer:
      'TipFlow is an AI-powered multi-chain tipping agent built on the Tether Wallet Development Kit (WDK). It lets you send tips across Ethereum (Sepolia testnet) and TON (Testnet) with intelligent chain selection, NLP commands, and fee optimization.',
    tags: ['general', 'overview'],
  },
  {
    question: 'How do I send a tip?',
    answer:
      'Enter the recipient address, choose a chain and token, set the amount, and click "Send Tip". You can also type a natural language command like "send 0.01 ETH to 0x..." in the NLP input, or use voice commands via the microphone button.',
    tags: ['tip', 'send', 'basics'],
  },
  {
    question: 'What chains are supported?',
    answer:
      'TipFlow currently supports Ethereum (Sepolia testnet) and TON (Testnet). The agent automatically selects the optimal chain based on fees, speed, and the recipient address format.',
    tags: ['chain', 'ethereum', 'ton', 'network'],
  },
  {
    question: 'How does NLP work?',
    answer:
      'Type natural language commands into the NLP input field. For example: "send 0.01 ETH to 0xABC...", "tip 5 USDT to alice.ton", or "send 100 tokens to my friend". The AI agent parses your intent and fills in the tip form automatically.',
    tags: ['nlp', 'natural language', 'ai', 'commands'],
  },
  {
    question: 'What is gasless tipping?',
    answer:
      'Gasless tipping uses ERC-4337 account abstraction to let you send tips without paying gas fees directly. A bundler handles the gas payment, making the experience seamless. Enable it with the gasless toggle in the tip form.',
    tags: ['gasless', 'erc-4337', 'gas', 'account abstraction'],
  },
  {
    question: 'How do recurring tips work?',
    answer:
      'When creating a tip, enable the "Schedule" option and set a recurring interval (e.g., every hour, daily, weekly). The agent will automatically execute the tip at the specified intervals until you cancel it from the Scheduled Tips panel.',
    tags: ['recurring', 'schedule', 'automated'],
  },
  {
    question: 'How do I use voice commands?',
    answer:
      'Click the microphone button in the tip form to start voice recognition. Speak your tip command naturally, like "send 0.5 ETH to 0xABC". The speech will be transcribed and parsed by the AI agent into a tip transaction.',
    tags: ['voice', 'speech', 'microphone'],
  },
  {
    question: 'What is the Telegram bot?',
    answer:
      'TipFlow includes a Telegram bot integration that lets you send tips directly from Telegram using the /tip command. Configure the bot token in your environment variables and use commands like "/tip 0.01 ETH to 0xABC...".',
    tags: ['telegram', 'bot', 'messaging'],
  },
  {
    question: 'How do I export my history?',
    answer:
      'Navigate to the History tab and use the Export panel. You can export your tip history in multiple formats: CSV (for spreadsheets), JSON (for developers), Markdown (for documentation), or a Summary report with statistics.',
    tags: ['export', 'history', 'csv', 'json', 'download'],
  },
  {
    question: 'Is my wallet secure?',
    answer:
      'Yes. TipFlow uses a self-custodial architecture powered by Tether WDK. Your private keys are generated and stored locally on your device and never leave it. No keys or seed phrases are sent to any server. You can also backup and restore your wallet.',
    tags: ['security', 'wallet', 'keys', 'custody'],
  },
  {
    question: 'What is WDK?',
    answer:
      'WDK (Wallet Development Kit) is an open-source toolkit by Tether for building wallet applications. It provides secure key management, multi-chain transaction signing, and account abstraction support. TipFlow is built entirely on WDK.',
    tags: ['wdk', 'tether', 'sdk', 'toolkit'],
  },
  {
    question: 'How do conditional tips work?',
    answer:
      'Conditional tips let you set triggers for automatic tipping. For example: "send 0.01 ETH when gas drops below 20 gwei" or "tip when my balance exceeds 1 ETH". The agent monitors conditions and executes tips when they are met.',
    tags: ['conditional', 'trigger', 'automated', 'gas', 'balance'],
  },
  {
    question: 'How do batch and split tips work?',
    answer:
      'Batch tips let you send multiple individual tips at once to different recipients. Split tips let you divide a total amount equally or by custom shares among multiple recipients. Switch between modes using the tabs above the tip form.',
    tags: ['batch', 'split', 'multiple', 'group'],
  },
];

export function HelpCenter() {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredFaq = useMemo(() => {
    if (!search.trim()) return FAQ_DATA;
    const q = search.toLowerCase();
    return FAQ_DATA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.includes(q))
    );
  }, [search]);

  const toggleItem = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-6">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-all"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Help Center &amp; FAQ</span>
        {open ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-border bg-surface-1 p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setExpandedIndex(null);
              }}
              placeholder="Search FAQ..."
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent/30 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setExpandedIndex(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results count */}
          {search && (
            <p className="text-xs text-text-muted">
              {filteredFaq.length} result{filteredFaq.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* FAQ items */}
          <div className="space-y-2">
            {filteredFaq.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">
                No results found. Try a different search term.
              </p>
            )}
            {filteredFaq.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={item.question}
                  className="rounded-lg border border-border bg-surface-2 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-3 transition-colors"
                  >
                    <span className="mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-accent" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      )}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isExpanded ? 'text-accent' : 'text-text-primary'
                      }`}
                    >
                      {item.question}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pl-11">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {item.answer}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-3 border border-border text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
