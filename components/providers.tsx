"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { DemoStoreProvider } from "@/components/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <DemoStoreProvider>
        {children}
        <Toaster position="top-center" />
      </DemoStoreProvider>
    </ThemeProvider>
  );
}
