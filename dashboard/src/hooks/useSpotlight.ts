// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useEffect, useRef } from 'react';

/**
 * Cursor spotlight effect — updates CSS custom properties on .spotlight-card
 * children when the pointer moves over a container.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: PointerEvent) => {
      const cards = el.querySelectorAll<HTMLElement>('.spotlight-card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };

    el.addEventListener('pointermove', handleMove);
    return () => el.removeEventListener('pointermove', handleMove);
  }, []);

  return ref;
}
