"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { DemoStoreProvider } from "@/components/demo-store";
import type { Currency, StoreSettings } from "@/lib/currency";

export function Providers({
  children,
  currency,
  settings,
}: {
  children: React.ReactNode;
  currency?: Currency;
  settings?: StoreSettings;
}) {
  return (
    <CurrencyProvider initialCurrency={currency} initialSettings={settings}>
      <AuthProvider>
        <DemoStoreProvider>
          {children}
          <Toaster position="top-center" theme="light" />
        </DemoStoreProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
