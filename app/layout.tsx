import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import { getSettings } from "@/lib/store";
import "./globals.css";

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Noto_Serif_SC({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "君子小雅OPC",
  description: "君子小雅OPC研习社公开浏览站：一人公司课程、会员与操作指南。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = getSettings();
  const cookie = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <Providers currency={parseCurrency(cookie, settings.defaultCurrency)} settings={settings}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
