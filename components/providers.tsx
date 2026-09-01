"use client";

import { Toaster } from "@/components/ui/sonner";
import { DemoStoreProvider } from "@/components/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoStoreProvider>
      {children}
      <Toaster position="top-center" theme="light" />
    </DemoStoreProvider>
  );
}
