// Copyright 2026 TipFlow. Licensed under Apache 2.0.
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LOCALES, setLocale, getLocaleInfo, t, type Locale } from '../lib/i18n';
import { useLocale } from '../hooks/useLocale';

export function LanguageSelector() {
  const locale = useLocale();
  const info = getLocaleInfo(locale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all"
        title={t('language.select')}
        aria-label={t('language.select')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('language.select')}
          className="absolute right-0 mt-2 w-48 rounded-lg bg-surface-1 border border-border shadow-lg z-50 overflow-hidden animate-scale-in"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              onClick={() => handleSelect(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                l.code === locale
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.nativeName}</span>
              {l.code === locale && (
                <span className="ml-auto text-accent text-xs">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
