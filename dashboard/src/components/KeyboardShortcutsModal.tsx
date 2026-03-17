import { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const modKey = isMac ? '\u2318' : 'Ctrl';

const shortcuts = [
  { keys: [`${modKey}`, 'Enter'], description: 'Submit the tip form' },
  { keys: [`${modKey}`, 'K'], description: 'Focus NLP input field' },
  { keys: ['Ctrl', 'B'], description: 'Toggle Single / Batch mode' },
  { keys: ['Ctrl', 'D'], description: 'Toggle dark / light theme' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close modals & dropdowns' },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on click outside the card
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    };
    const el = overlayRef.current;
    el?.addEventListener('mousedown', handler);
    return () => el?.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-surface-1 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <span key={j} className="flex items-center gap-1">
                    {j > 0 && <span className="text-[10px] text-text-muted">+</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-surface-3 border border-border text-[11px] font-mono font-medium text-text-secondary shadow-sm">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[10px] text-text-muted text-center">
            Shortcuts are disabled while typing in input fields (except {modKey}+K and {modKey}+Enter)
          </p>
        </div>
      </div>
    </div>
  );
}
