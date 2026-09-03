"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, htmlLang, LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n";
import { t, type MessageKey } from "@/lib/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* ignore */
  }
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCALE_COOKIE);
        if (stored) return parseLocale(stored, initialLocale || DEFAULT_LOCALE);
      } catch {
        /* ignore */
      }
    }
    return parseLocale(initialLocale, DEFAULT_LOCALE);
  });

  React.useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      const parsed = parseLocale(next);
      setLocaleState(parsed);
      writeLocaleCookie(parsed);
      void fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: parsed }),
      }).finally(() => {
        router.refresh();
      });
    },
    [router],
  );

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => t(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
