interface EmptyStateProps {
  variant: 'no-tips' | 'no-contacts' | 'welcome' | 'no-data';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function NoTipsIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Clock/history circle */}
      <circle cx="40" cy="40" r="30" stroke="var(--color-border-light)" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="40" cy="40" r="22" fill="var(--color-surface-3)" />
      {/* Arrow pointing up-right (send) */}
      <path
        d="M34 46L46 34M46 34H38M46 34V42"
        stroke="var(--color-text-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small decorative dots */}
      <circle cx="18" cy="22" r="2" fill="var(--color-accent)" opacity="0.3" />
      <circle cx="62" cy="58" r="2" fill="var(--color-accent)" opacity="0.3" />
      <circle cx="58" cy="18" r="1.5" fill="var(--color-info)" opacity="0.3" />
    </svg>
  );
}

function NoContactsIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Address book shape */}
      <rect x="20" y="15" width="40" height="50" rx="6" stroke="var(--color-border-light)" strokeWidth="2" />
      <line x1="20" y1="30" x2="60" y2="30" stroke="var(--color-border)" strokeWidth="1" />
      <line x1="20" y1="45" x2="60" y2="45" stroke="var(--color-border)" strokeWidth="1" />
      {/* Person icon */}
      <circle cx="40" cy="36" r="4" fill="var(--color-surface-3)" stroke="var(--color-text-muted)" strokeWidth="1.5" />
      <path
        d="M33 52C33 48 36 45 40 45C44 45 47 48 47 52"
        stroke="var(--color-text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Plus sign */}
      <circle cx="56" cy="56" r="8" fill="var(--color-surface-3)" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.6" />
      <path d="M56 52V60M52 56H60" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function WelcomeIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Stylised lightning/zap inside a circle */}
      <circle cx="40" cy="40" r="30" stroke="var(--color-accent)" strokeWidth="2" opacity="0.2" />
      <circle cx="40" cy="40" r="22" fill="var(--color-accent)" opacity="0.08" />
      <path
        d="M42 28L34 42H40L38 52L46 38H40L42 28Z"
        fill="var(--color-accent)"
        opacity="0.7"
      />
      {/* Sparkle dots */}
      <circle cx="60" cy="20" r="2" fill="var(--color-accent)" opacity="0.4" />
      <circle cx="20" cy="58" r="2" fill="var(--color-accent)" opacity="0.4" />
      <circle cx="64" cy="52" r="1.5" fill="var(--color-warning)" opacity="0.4" />
      <circle cx="16" cy="28" r="1.5" fill="var(--color-info)" opacity="0.4" />
    </svg>
  );
}

function NoDataIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Bar chart with empty bars */}
      <rect x="18" y="50" width="8" height="12" rx="2" fill="var(--color-surface-3)" />
      <rect x="30" y="40" width="8" height="22" rx="2" fill="var(--color-surface-3)" />
      <rect x="42" y="45" width="8" height="17" rx="2" fill="var(--color-surface-3)" />
      <rect x="54" y="35" width="8" height="27" rx="2" fill="var(--color-surface-3)" />
      {/* Baseline */}
      <line x1="14" y1="63" x2="66" y2="63" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Question mark */}
      <circle cx="40" cy="24" r="10" fill="var(--color-surface-3)" />
      <text x="40" y="28" textAnchor="middle" fill="var(--color-text-muted)" fontSize="12" fontWeight="bold">?</text>
    </svg>
  );
}

const VARIANT_DEFAULTS: Record<EmptyStateProps['variant'], { title: string; description: string; Illustration: () => JSX.Element }> = {
  'no-tips': {
    title: 'No tips sent yet',
    description: 'Send your first tip and transaction history will appear here.',
    Illustration: NoTipsIllustration,
  },
  'no-contacts': {
    title: 'No contacts yet',
    description: 'Save frequently tipped addresses for quick access.',
    Illustration: NoContactsIllustration,
  },
  welcome: {
    title: 'Welcome to TipFlow',
    description: 'AI-powered multi-chain tipping. Get started by sending your first tip.',
    Illustration: WelcomeIllustration,
  },
  'no-data': {
    title: 'No data available',
    description: 'Data will appear here once there is activity.',
    Illustration: NoDataIllustration,
  },
};

export function EmptyState({ variant, title, description, action }: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const Illustration = defaults.Illustration;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
      <Illustration />
      <h3 className="text-sm font-semibold text-text-secondary mt-4">
        {title ?? defaults.title}
      </h3>
      <p className="text-xs text-text-muted mt-1 text-center max-w-xs leading-relaxed">
        {description ?? defaults.description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-accent/10 text-accent border border-accent-border hover:bg-accent/20 transition-colors btn-press"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
