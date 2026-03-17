import { useState, useEffect, useCallback } from 'react';

const ACCENT_COLORS = [
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Orange', hex: '#f59e0b' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Red', hex: '#ef4444' },
] as const;

const STORAGE_KEY = 'tipflow-accent-color';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 34, g: 197, b: 94 };
}

function applyAccentColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement;
  root.style.setProperty('--color-accent', hex);
  // Derive a slightly lighter version for hover
  const lightR = Math.min(255, r + 40);
  const lightG = Math.min(255, g + 40);
  const lightB = Math.min(255, b + 40);
  root.style.setProperty('--color-accent-light', `rgb(${lightR}, ${lightG}, ${lightB})`);
  root.style.setProperty('--color-accent-dim', `rgba(${r}, ${g}, ${b}, 0.1)`);
  root.style.setProperty('--color-accent-border', `rgba(${r}, ${g}, ${b}, 0.3)`);
}

export function ThemeCustomizer() {
  const [activeColor, setActiveColor] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '#22c55e';
  });

  // Apply on mount and when changed
  useEffect(() => {
    applyAccentColor(activeColor);
  }, [activeColor]);

  const selectColor = useCallback((hex: string) => {
    setActiveColor(hex);
    localStorage.setItem(STORAGE_KEY, hex);
    applyAccentColor(hex);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary whitespace-nowrap">Accent</span>
      <div className="flex items-center gap-1.5">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color.hex}
            onClick={() => selectColor(color.hex)}
            title={color.name}
            aria-label={`Set accent color to ${color.name}`}
            className="relative w-6 h-6 rounded-full border-2 transition-all shrink-0"
            style={{
              backgroundColor: color.hex,
              borderColor: activeColor === color.hex ? 'white' : 'transparent',
              transform: activeColor === color.hex ? 'scale(1.15)' : 'scale(1)',
              boxShadow: activeColor === color.hex ? `0 0 8px ${color.hex}60` : 'none',
            }}
          >
            {activeColor === color.hex && (
              <svg className="absolute inset-0 m-auto w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Initialize accent color from localStorage on app startup.
 * Call once in App component's useEffect.
 */
export function initAccentColor() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    applyAccentColor(stored);
  }
}
