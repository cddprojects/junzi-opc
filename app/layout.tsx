import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell";
import { NavProgress } from "@/components/nav-progress";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import { htmlLang, LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/store";
import "./globals.css";

const sans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const serif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "君子小雅OPC",
  description: "君子小雅OPC研习社公开浏览站：一人公司课程、会员与操作指南。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const jar = await cookies();
  const locale = parseLocale(jar.get(LOCALE_COOKIE)?.value);
  const cookie = jar.get(CURRENCY_COOKIE)?.value;
  return (
    <html
      lang={htmlLang(locale)}
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full font-sans">
        <Providers
          locale={locale}
          currency={parseCurrency(cookie, settings.defaultCurrency)}
          settings={settings}
        >
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
