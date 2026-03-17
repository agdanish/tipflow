import { useEffect, useCallback } from 'react';

export interface ShortcutAction {
  submitForm?: () => void;
  focusNlpInput?: () => void;
  toggleTipMode?: () => void;
  toggleTheme?: () => void;
  showShortcutsHelp?: () => void;
  closeModal?: () => void;
}

/**
 * Global keyboard shortcuts for power users.
 * Shortcuts are suppressed when the user is typing in an input/textarea/select.
 */
export function useKeyboardShortcuts(actions: ShortcutAction) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      // Escape — always active, closes modals/dropdowns
      if (e.key === 'Escape') {
        actions.closeModal?.();
        return;
      }

      // Ctrl/Cmd+Enter — submit tip form (works even in inputs)
      if (e.key === 'Enter' && mod) {
        e.preventDefault();
        actions.submitForm?.();
        return;
      }

      // Ctrl/Cmd+K — focus NLP input (works even in inputs, standard "command palette" shortcut)
      if (e.key === 'k' && mod) {
        e.preventDefault();
        actions.focusNlpInput?.();
        return;
      }

      // Shortcuts below are suppressed when typing in an input
      if (isInput) return;

      // Ctrl+B — toggle single/batch mode
      if (e.key === 'b' && e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        actions.toggleTipMode?.();
        return;
      }

      // Ctrl+D — toggle dark/light theme
      if (e.key === 'd' && e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        actions.toggleTheme?.();
        return;
      }

      // ? or Ctrl+/ — show shortcuts help
      if (e.key === '?' || (e.key === '/' && mod)) {
        e.preventDefault();
        actions.showShortcutsHelp?.();
        return;
      }
    },
    [actions],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
