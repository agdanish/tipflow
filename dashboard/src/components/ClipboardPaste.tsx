import { useState } from 'react';
import { ClipboardPaste as ClipboardIcon, Check } from 'lucide-react';

interface ClipboardPasteProps {
  onPaste: (text: string) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

/**
 * ClipboardPaste — small button that reads clipboard and passes text to a callback.
 * Shows brief "Pasted!" feedback after successful paste.
 */
export function ClipboardPaste({ onPaste, disabled, className, title = 'Paste from clipboard' }: ClipboardPasteProps) {
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        onPaste(text.trim());
        setPasted(true);
        setTimeout(() => setPasted(false), 1500);
      }
    } catch {
      // Clipboard API not available or permission denied — silently fail
    }
  };

  return (
    <button
      type="button"
      onClick={handlePaste}
      disabled={disabled || pasted}
      title={pasted ? 'Pasted!' : title}
      className={
        className ??
        `px-2.5 py-2.5 rounded-lg border transition-colors shrink-0 ${
          pasted
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-surface-2 border-border text-text-secondary hover:text-accent hover:border-accent-border'
        }`
      }
    >
      {pasted ? <Check className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
    </button>
  );
}
