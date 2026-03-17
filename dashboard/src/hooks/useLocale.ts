// Copyright 2026 TipFlow. Licensed under Apache 2.0.
import { useState, useEffect } from 'react';
import { getLocale, subscribe, type Locale } from '../lib/i18n';

/** React hook that re-renders when the global locale changes. */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(getLocale);

  useEffect(() => {
    const unsub = subscribe((next) => setLocale(next));
    return unsub;
  }, []);

  return locale;
}
