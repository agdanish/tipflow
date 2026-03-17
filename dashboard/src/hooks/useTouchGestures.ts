import { useEffect, useRef, type RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minDistance?: number;
}

/**
 * Detect swipe gestures on a given element ref.
 * Uses passive touch listeners for performance.
 */
export function useSwipe<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handlers: SwipeHandlers,
): void {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const minDist = handlers.minDistance ?? 50;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;

      if (e.changedTouches.length === 0) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const dx = endX - startX.current;
      const dy = endY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must exceed minimum distance, and dominant axis wins
      if (absDx < minDist && absDy < minDist) return;

      if (absDx > absDy) {
        // Horizontal swipe
        if (dx > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, handlers]);
}
