import { useEffect } from 'react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';

interface VoiceButtonProps {
  /** Called with the final transcript when speech recognition completes */
  onTranscript: (text: string) => void;
  /** Disable the button (e.g. while sending) */
  disabled?: boolean;
}

/**
 * Microphone button for voice-to-text input.
 * Uses the Web Speech API — hides itself gracefully on unsupported browsers.
 * Shows a pulsing red ring animation while actively listening.
 */
export function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceCommand();

  // When listening stops and we have a transcript, pass it up
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
    }
  }, [isListening, transcript, onTranscript]);

  // Don't render on unsupported browsers
  if (!isSupported) return null;

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Pulsing ring when listening */}
      {isListening && (
        <span className="absolute inset-0 rounded-lg animate-voice-pulse bg-red-500/20 border border-red-500/40" />
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Voice input'}
        className={`relative z-10 flex items-center justify-center w-[42px] h-[42px] rounded-lg border transition-all shrink-0 ${
          isListening
            ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25'
            : 'bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:border-border-light'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isListening ? (
          /* Animated bars icon while listening */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="2" height="8" rx="1" fill="currentColor" className="animate-voice-bar1" />
            <rect x="8" y="5" width="2" height="14" rx="1" fill="currentColor" className="animate-voice-bar2" />
            <rect x="12" y="7" width="2" height="10" rx="1" fill="currentColor" className="animate-voice-bar3" />
            <rect x="16" y="4" width="2" height="16" rx="1" fill="currentColor" className="animate-voice-bar4" />
            <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" className="animate-voice-bar1" />
          </svg>
        ) : (
          /* Microphone icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>
      {isListening && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-red-400 whitespace-nowrap font-medium">
          Listening...
        </span>
      )}
    </div>
  );
}
