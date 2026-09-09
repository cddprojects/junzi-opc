"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Home, Search, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/data";
import { localized } from "@/lib/i18n";
import { pageTitleKey } from "@/lib/messages";
import { cartCount, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";

const TAB_HREFS = [
  { href: "/", key: "navHome" as const, icon: Home },
  { href: "/categories", key: "navCategories" as const, icon: Bookmark },
  { href: "/mine", key: "navMine" as const, icon: UserRound },
];

const DESKTOP_NAV = [
  { href: "/", key: "navHome" as const },
  { href: "/categories", key: "navCategories" as const },
  { href: "/courses/recorded", key: "navRecorded" as const },
  { href: "/courses/live", key: "navLive" as const },
  { href: "/member", key: "navMember" as const },
  { href: "/guides", key: "navGuides" as const },
];

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const isProduct = pathname.startsWith("/product/");

  return (
    <div className="storefront min-h-dvh bg-[#f4f0e6] text-[#2b2418]">
      <DesktopHeader />
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <main
        className={cn(
          "mx-auto w-full bg-[#f6f2ea] md:max-w-6xl md:bg-transparent md:px-6 md:pt-7 md:pb-16",
          isProduct ? "pb-[64px] md:pb-16" : "pb-[58px] md:pb-16",
        )}
      >
        {children}
      </main>
      <DesktopFooter />
      {isProduct ? null : <TabBar />}
    </div>
  );
}

function AccountLink({ compact }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  if (loading) {
    return <span className="text-[13px] text-[#888]">{compact ? "…" : "…"}</span>;
  }
  if (user) {
    return (
      <Link href="/mine" className={cn("truncate text-[#444] hover:text-[#b8863b]", compact ? "max-w-16 text-[12px]" : "max-w-28 text-[14px]")}>
        {user.name}
      </Link>
    );
  }
  return (
    <Link href="/login" className={cn("text-[#444] hover:text-[#b8863b]", compact ? "text-[12px]" : "text-[14px]")}>
      {t("login")}
    </Link>
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const { cart } = useDemoStore();
  const count = cartCount(cart);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[#e6dcc8] bg-[#fffdf8]/95 backdrop-blur-md md:block">
      <div className="mx-auto flex h-[68px] max-w-6xl flex-nowrap items-center gap-4 px-6">
        <Link href="/" className="shrink-0 font-serif text-[20px] tracking-wide whitespace-nowrap text-[#3a2c10]">
          {brand.name}
        </Link>
        <nav className="flex shrink-0 flex-nowrap items-center gap-4 text-[13px] xl:gap-5">
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap [word-break:keep-all] hover:text-[#b8863b]",
                isTabActive(pathname, item.href) ? "font-medium text-[#b8863b]" : "text-[#444]",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <form action="/search" className="relative min-w-[5.5rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
          <input
            name="q"
            placeholder={t("searchCourses")}
            className="h-9 w-full min-w-0 rounded-full bg-[#f4efe6] pr-3 pl-9 text-[13px] text-[#333] outline-none placeholder:text-[#aaa]"
          />
        </form>
        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher compact />
          <CurrencySwitcher compact />
          <Link href="/cart" className="relative text-[#444]" aria-label={t("cart")}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
                {count}
              </span>
            )}
          </Link>
          <AccountLink />
        </div>
      </div>
    </header>
  );
}

function DesktopFooter() {
  const { locale, t } = useLocale();
  return (
    <footer className="hidden border-t border-[#e6dcc8] bg-[#fffdf8] py-10 text-center text-[13px] text-[#7a6a50] md:block">
      <p className="font-serif text-[17px] text-[#3a2c10]">{localized(locale, brand.mottoWay, brand.mottoWayEn)}</p>
      <p className="mt-2">{t("footerDemo")}</p>
      <div className="mt-4 flex items-center justify-center gap-5">
        <LocaleSwitcher />
        <CurrencySwitcher />
        <Link href="/verify" className="text-[#b8863b]">
          {t("verifyCode")}
        </Link>
        <Link href="/admin" className="text-[#b8863b]">
          {t("adminBackend")}
        </Link>
      </div>
    </footer>
  );
}

function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useDemoStore();
  const count = cartCount(cart);
  const { t } = useLocale();
  const isHome = pathname === "/";
  const title = mobileTitle(pathname, t);

  return (
    <header className="sticky top-0 z-30 border-b border-[#ece4d4] bg-[#fffdf8]/96 backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-3">
        {!isHome && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-8 shrink-0 items-center justify-center text-[#333]"
            aria-label={t("back")}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <Link href="/" className="min-w-0 flex-1 truncate font-serif text-[17px] text-[#3a2c10]">
          {isHome ? brand.name : title}
        </Link>
        <Link href="/search" className="text-[#444]" aria-label={t("search")}>
          <Search className="size-5" />
        </Link>
        <Link href="/cart" className="relative text-[#444]" aria-label={t("cart")}>
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
        <LocaleSwitcher compact />
        <CurrencySwitcher compact />
        <AccountLink compact />
      </div>
    </header>
  );
}

function mobileTitle(pathname: string, translate: ReturnType<typeof useLocale>["t"]) {
  const key = pageTitleKey(pathname);
  return key ? translate(key) : brand.name;
}

export function TabBar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-[52px] w-full border-t border-[#ece4d4] bg-[#fffdf8] md:hidden">
      {TAB_HREFS.map((tab) => {
        const active = isTabActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-[#8a5a20]" : "text-[#888]",
            )}
          >
            <Icon className={cn("size-[22px]", active && "fill-[#8a5a20]")} strokeWidth={active ? 2.2 : 1.7} />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppShell as PhoneShell };
