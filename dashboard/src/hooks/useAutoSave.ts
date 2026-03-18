// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useRef, useCallback } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
  /** localStorage key for persistence */
  key: string;
  /** Debounce delay in ms (default: 1000) */
  delay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Auto-saves form state to localStorage with debounced writes.
 * Returns current status indicator for UX feedback.
 *
 * Features:
 * - Debounced saves (prevents excessive writes)
 * - Status indicator (idle → saving → saved)
 * - Restore from saved state on mount
 * - Clear saved state after successful submission
 */
export function useAutoSave<T extends Record<string, unknown>>(
  initialState: T,
  options: AutoSaveOptions,
) {
  const { key, delay = 1000, enabled = true } = options;

  // Restore from localStorage on mount
  const [state, setState] = useState<T>(() => {
    if (!enabled) return initialState;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        // Merge with initial to ensure new fields have defaults
        return { ...initialState, ...parsed };
      }
    } catch {
      // ignore
    }
    return initialState;
  });

  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDraftRef = useRef(false);

  // Check if there's a saved draft
  useEffect(() => {
    if (!enabled) return;
    const saved = localStorage.getItem(key);
    hasDraftRef.current = !!saved;
  }, [key, enabled]);

  // Debounced save
  const save = useCallback(
    (newState: T) => {
      if (!enabled) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      setStatus('saving');

      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(newState));
          setStatus('saved');
          hasDraftRef.current = true;

          // Reset to idle after 2s
          savedTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
        } catch {
          setStatus('error');
        }
      }, delay);
    },
    [key, delay, enabled],
  );

  // Update state and trigger save
  const update = useCallback(
    (updates: Partial<T>) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Clear saved draft (call after successful submission)
  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    hasDraftRef.current = false;
    setStatus('idle');
    setState(initialState);
  }, [key, initialState]);

  // Check if there's a restored draft
  const hasDraft = hasDraftRef.current;

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { state, update, status, clearDraft, hasDraft };
}
