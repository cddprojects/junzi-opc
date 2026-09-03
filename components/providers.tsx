"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { DemoStoreProvider } from "@/components/demo-store";
import { LocaleProvider } from "@/components/locale-provider";
import type { Currency, StoreSettings } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";

export function Providers({
  children,
  currency,
  settings,
  locale,
}: {
  children: React.ReactNode;
  currency?: Currency;
  settings?: StoreSettings;
  locale?: Locale;
}) {
  return (
    <LocaleProvider initialLocale={locale}>
      <CurrencyProvider initialCurrency={currency} initialSettings={settings}>
        <AuthProvider>
          <DemoStoreProvider>
            {children}
            <Toaster position="top-center" theme="light" />
          </DemoStoreProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LocaleProvider>
  );
}
