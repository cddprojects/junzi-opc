"use client";

import * as React from "react";
import {
  CURRENCY_CODES,
  CURRENCY_COOKIE,
  DEFAULT_SETTINGS,
  formatMoney,
  fromCny,
  parseCurrency,
  type Currency,
  type StoreSettings,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: Currency;
  settings: StoreSettings;
  setCurrency: (next: Currency) => void;
  convert: (cny: number) => number;
  format: (cny: number) => string;
};

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);

function writeCurrencyCookie(code: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(CURRENCY_COOKIE, code);
  } catch {
    /* ignore */
  }
}

export function CurrencyProvider({
  children,
  initialCurrency,
  initialSettings,
}: {
  children: React.ReactNode;
  initialCurrency?: Currency;
  initialSettings?: StoreSettings;
}) {
  const [settings, setSettings] = React.useState<StoreSettings>(initialSettings || DEFAULT_SETTINGS);
  const [currency, setCurrencyState] = React.useState<Currency>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CURRENCY_COOKIE);
        if (stored) return parseCurrency(stored, initialCurrency || "CNY");
      } catch {
        /* ignore */
      }
    }
    return parseCurrency(initialCurrency, initialSettings?.defaultCurrency || "CNY");
  });

  React.useEffect(() => {
    fetch("/api/currency", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: StoreSettings & { defaultCurrency?: Currency }) => {
        if (data?.fx) setSettings({ defaultCurrency: parseCurrency(data.defaultCurrency), fx: data.fx });
      })
      .catch(() => undefined);
  }, []);

  const setCurrency = React.useCallback((next: Currency) => {
    if (!CURRENCY_CODES.includes(next)) return;
    setCurrencyState(next);
    writeCurrencyCookie(next);
    void fetch("/api/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    });
  }, []);

  const value = React.useMemo<CurrencyContextValue>(
    () => ({
      currency,
      settings,
      setCurrency,
      convert: (cny) => fromCny(cny, currency, settings.fx),
      format: (cny) => formatMoney(cny, currency, settings.fx),
    }),
    [currency, settings, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
