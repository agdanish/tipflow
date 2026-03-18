import { useState, useEffect, useCallback } from 'react';
import { Zap, Wallet, MessageSquareText, Bot, Rocket, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  /** CSS selector for the element to spotlight (null = centered card, no spotlight) */
  target: string | null;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to TipFlow!',
    description:
      'Your AI-powered, multi-chain tipping agent built on Tether WDK. Send USDT tips across Ethereum and TON with natural language commands.',
    icon: <Zap className="w-7 h-7 text-accent" />,
    target: null,
  },
  {
    title: 'Your Wallets',
    description:
      'TipFlow manages wallets on multiple chains simultaneously. View balances, copy addresses, and monitor your funds in real time.',
    icon: <Wallet className="w-7 h-7 text-eth" />,
    target: '[data-onboarding="wallets"]',
  },
  {
    title: 'Smart Tipping',
    description:
      'Type commands like "send 5 USDT to 0xAbc..." or "tip 2 USDT on TON". The AI agent parses your intent and executes the transaction.',
    icon: <MessageSquareText className="w-7 h-7 text-accent-light" />,
    target: '[data-onboarding="tip-form"]',
  },
  {
    title: 'AI Agent',
    description:
      'Watch the decision pipeline in real time. The agent validates addresses, checks balances, selects the optimal chain, and confirms transactions.',
    icon: <Bot className="w-7 h-7 text-purple-400" />,
    target: '[data-onboarding="agent-panel"]',
  },
  {
    title: "You're Ready!",
    description:
      'Start by sending your first tip. Use testnet tokens to experiment freely. You can replay this tour anytime from the header.',
    icon: <Rocket className="w-7 h-7 text-accent" />,
    target: null,
  },
];

const STORAGE_KEY = 'tipflow-onboarding-complete';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visible, setVisible] = useState(false);

  const current = STEPS[step];

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Measure the target element for the spotlight
  useEffect(() => {
    if (!current.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setSpotlightRect(null);
    }
  }, [step, current.target]);

  // Re-measure on resize
  useEffect(() => {
    const handleResize = () => {
      if (!current.target) return;
      const el = document.querySelector(current.target);
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [current.target]);

  const goTo = useCallback((nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      goTo(step + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1);
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handleBack();
      else if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const PAD = 12;

  // Compute spotlight box-shadow mask
  const spotlightShadow = spotlightRect
    ? `0 0 0 9999px rgba(0, 0, 0, 0.75), inset 0 0 0 0 transparent`
    : undefined;

  // Position the tooltip card near the spotlight, or center it
  const getCardStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const cardWidth = 380;
    const cardHeight = 260;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer positioning below the spotlight
    let top = spotlightRect.bottom + PAD + 16;
    let left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2;

    // If it goes off bottom, place above
    if (top + cardHeight > vh - 20) {
      top = spotlightRect.top - PAD - cardHeight - 16;
    }
    // If it still goes off top, center vertically
    if (top < 20) {
      top = vh / 2 - cardHeight / 2;
    }
    // Clamp horizontal
    if (left < 16) left = 16;
    if (left + cardWidth > vw - 16) left = vw - cardWidth - 16;

    return { position: 'fixed', top, left };
  };

  return (
    <div
      className={`onboarding-overlay ${visible ? 'onboarding-visible' : ''}`}
      style={{ zIndex: 9999 }}
    >
      {/* Dark backdrop (only used when no spotlight) */}
      {!spotlightRect && (
        <div
          className="fixed inset-0 bg-black/75 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        />
      )}

      {/* Spotlight cutout */}
      {spotlightRect && (
        <div
          className="onboarding-spotlight"
          style={{
            position: 'fixed',
            top: spotlightRect.top - PAD,
            left: spotlightRect.left - PAD,
            width: spotlightRect.width + PAD * 2,
            height: spotlightRect.height + PAD * 2,
            borderRadius: 16,
            boxShadow: spotlightShadow,
            pointerEvents: 'none',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 9999,
          }}
        />
      )}

      {/* Card */}
      <div
        className={`onboarding-card ${isTransitioning ? 'onboarding-card-exit' : 'onboarding-card-enter'}`}
        style={{ ...getCardStyle(), zIndex: 10000, width: 380, maxWidth: 'calc(100vw - 32px)' }}
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-3 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="absolute top-3 left-4 text-[10px] text-text-muted font-medium tabular-nums">
          Step {step + 1} of {STEPS.length}
        </div>

        {/* Skip button */}
        <button
          onClick={finish}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors"
          title="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-surface-3 border border-border flex items-center justify-center mb-4">
          {current.icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-text-primary mb-2">{current.title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">{current.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-accent'
                    : i < step
                    ? 'w-1.5 bg-accent/40'
                    : 'w-1.5 bg-border-light'
                }`}
              />
            ))}
            <span className="text-[11px] text-text-muted ml-2">
              {step + 1}/{STEPS.length}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent-light transition-all shadow-sm shadow-accent/20"
            >
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
              {step < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Check if onboarding has been completed */
export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/** Reset onboarding so it shows again */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}
