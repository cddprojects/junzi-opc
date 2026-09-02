"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { DemoStoreProvider } from "@/components/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DemoStoreProvider>
        {children}
        <Toaster position="top-center" theme="light" />
      </DemoStoreProvider>
    </AuthProvider>
  );
}
