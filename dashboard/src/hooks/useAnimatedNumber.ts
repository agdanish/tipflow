// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from its previous value to the target value using
 * an ease-out curve. Returns the current display value as a string.
 *
 * Features:
 * - Spring-style ease-out curve
 * - Supports decimals via `decimals` param
 * - Skips animation on first render (no flicker)
 * - Respects prefers-reduced-motion
 */
export function useAnimatedNumber(
  target: number,
  options: {
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  } = {},
): string {
  const { duration = 800, decimals = 0, prefix = '', suffix = '' } = options;
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevRef.current = target;
      setDisplay(target);
      return;
    }

    // Respect reduced motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || target === prevRef.current) {
      prevRef.current = target;
      setDisplay(target);
      return;
    }

    const from = prevRef.current;
    const diff = target - from;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
        prevRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  // Update ref when target changes (for cleanup path)
  useEffect(() => {
    return () => {
      prevRef.current = target;
    };
  }, [target]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Hook variant that returns just the raw animated number (for custom formatting).
 */
export function useAnimatedValue(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevRef.current = target;
      setDisplay(target);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || target === prevRef.current) {
      prevRef.current = target;
      setDisplay(target);
      return;
    }

    const from = prevRef.current;
    const diff = target - from;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
        prevRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  useEffect(() => {
    return () => { prevRef.current = target; };
  }, [target]);

  return display;
}
