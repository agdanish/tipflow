import { useState, useCallback } from 'react';
import {
  Shield,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  X,
  Lock,
  HardDrive,
} from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

const DERIVATION_PATH = "m/44'/60'/0'/0/0";
const WALLET_TYPE = 'HD Wallet (BIP-39)';
const CONFIRMATION_TEXT = 'I understand';

interface WalletBackupProps {
  totalTransactions?: number;
  createdDate?: string;
}

export function WalletBackup({ totalTransactions = 0, createdDate }: WalletBackupProps) {
  const [showModal, setShowModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [seedRevealed, setSeedRevealed] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevealRequest = useCallback(() => {
    setShowModal(true);
    setConfirmInput('');
    setSeedRevealed(false);
    setSeedPhrase([]);
    setError(null);
  }, []);

  const handleConfirmReveal = useCallback(async () => {
    if (confirmInput.toLowerCase().trim() !== CONFIRMATION_TEXT) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wallet/seed');
      if (!res.ok) {
        throw new Error('Failed to retrieve seed phrase');
      }
      const data = await res.json() as { seed: string };
      if (data.seed) {
        setSeedPhrase(data.seed.split(' '));
        setSeedRevealed(true);
      } else {
        throw new Error('No seed phrase returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve seed phrase');
    } finally {
      setLoading(false);
    }
  }, [confirmInput]);

  const handleCopySeed = useCallback(async () => {
    const ok = await copyToClipboard(seedPhrase.join(' '));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [seedPhrase]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setConfirmInput('');
    setSeedRevealed(false);
    setSeedPhrase([]);
    setError(null);
  }, []);

  const displayDate = createdDate
    ? new Date(createdDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <>
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Wallet Backup & Info</h3>
        </div>

        {/* Wallet Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Key className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Derivation Path</span>
            </div>
            <p className="text-xs font-mono text-text-primary">{DERIVATION_PATH}</p>
          </div>

          <div className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Wallet Type</span>
            </div>
            <p className="text-xs font-medium text-text-primary">{WALLET_TYPE}</p>
          </div>

          <div className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Created</span>
            </div>
            <p className="text-xs text-text-primary">{displayDate}</p>
          </div>

          <div className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Transactions</span>
            </div>
            <p className="text-xs font-medium text-text-primary">{totalTransactions}</p>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleRevealRequest}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          Export Seed Phrase
        </button>

        {/* Security note */}
        <div className="mt-3 px-2 py-1.5 rounded-md bg-surface-2 border border-border">
          <p className="text-xs text-text-muted leading-relaxed flex items-start gap-1.5">
            <Lock className="w-3 h-3 shrink-0 mt-0.5" />
            Your seed phrase gives full access to your wallet. Never share it with anyone. Store it securely offline.
          </p>
        </div>
      </div>

      {/* Seed Phrase Reveal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-1 shadow-2xl animate-slide-down">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {seedRevealed ? 'Seed Phrase' : 'Security Warning'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4">
              {!seedRevealed ? (
                <>
                  {/* Warning */}
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-300 leading-relaxed space-y-1">
                        <p className="font-medium">Revealing your seed phrase is a security-sensitive action.</p>
                        <p>Anyone with your seed phrase can access and control your wallet funds. Never share it with anyone or enter it on any website.</p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation input */}
                  <div className="mb-4">
                    <label className="text-xs text-text-secondary mb-1.5 block">
                      Type <span className="font-mono font-medium text-text-primary">{CONFIRMATION_TEXT}</span> to continue:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmReveal();
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                      placeholder="Type here..."
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirmReveal}
                    disabled={confirmInput.toLowerCase().trim() !== CONFIRMATION_TEXT || loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500/30 transition-all"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        Retrieving...
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Reveal Seed Phrase
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Seed phrase grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {seedPhrase.map((word, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-2 border border-border"
                      >
                        <span className="text-xs text-text-muted font-mono w-4 text-right">{i + 1}.</span>
                        <span className="text-xs font-mono text-text-primary">{word}</span>
                      </div>
                    ))}
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={handleCopySeed}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-medium transition-all ${
                      copied
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-surface-2 border-border text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Seed Phrase
                      </>
                    )}
                  </button>

                  {/* Warning after reveal */}
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-300 leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      Store this phrase securely offline. This window will clear on close.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
