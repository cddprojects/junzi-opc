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
    <div className="storefront min-h-dvh bg-[var(--front-bg)] text-[var(--front-text)]">
      <DesktopHeader />
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <main
        className={cn(
          "front-wrap w-full md:px-6 md:pt-4 md:pb-20",
          isProduct
            ? "pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-20"
            : "pb-[calc(52px+env(safe-area-inset-bottom))] md:pb-20",
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
    return <span className="text-[13px] text-[var(--front-text-muted)]">{compact ? "…" : "…"}</span>;
  }
  if (user) {
    return (
      <Link
        href="/mine"
        className={cn(
          "truncate text-[var(--front-text-soft)] hover:text-[var(--front-accent)]",
          compact ? "max-w-16 text-[12px]" : "max-w-28 text-[14px]",
        )}
      >
        {user.name}
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className={cn(
        "text-[var(--front-text-soft)] hover:text-[var(--front-accent)]",
        compact ? "text-[12px]" : "text-[14px]",
      )}
    >
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
    <header className="sticky top-0 z-[var(--z-sticky)] hidden border-b border-[var(--front-border)] bg-white md:block">
      <div className="front-wrap flex h-[64px] flex-nowrap items-center gap-5 px-6">
        <Link href="/" className="shrink-0 text-[18px] font-semibold tracking-wide whitespace-nowrap text-[var(--front-text)]">
          {brand.name}
        </Link>
        <nav className="flex shrink-0 flex-nowrap items-center gap-5 text-[14px] xl:gap-6">
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap [word-break:keep-all] hover:text-[var(--front-accent)]",
                isTabActive(pathname, item.href)
                  ? "font-medium text-[var(--front-accent)]"
                  : "text-[var(--front-text-soft)]",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <form action="/search" className="relative min-w-[5.5rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--front-text-muted)]" />
          <input
            name="q"
            placeholder={t("searchCourses")}
            className="h-10 w-full min-w-0 rounded-full border border-[var(--front-border)] bg-[#f7f7f7] pr-3 pl-10 text-[14px] text-[var(--front-text)] outline-none placeholder:text-[var(--front-text-muted)]"
          />
        </form>
        <div className="flex shrink-0 items-center gap-3">
          <LocaleSwitcher compact />
          <CurrencySwitcher compact />
          <Link href="/cart" className="relative text-[var(--front-text-soft)]" aria-label={t("cart")}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--front-accent)] px-1 text-[10px] text-white">
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
    <footer className="hidden border-t border-[var(--front-border)] bg-white py-10 text-center text-[14px] text-[var(--front-text-soft)] md:block">
      <p className="text-[16px] text-[var(--front-text)]">{localized(locale, brand.mottoWay, brand.mottoWayEn)}</p>
      <p className="mt-3">{t("footerDemo")}</p>
      <div className="mt-6 flex items-center justify-center gap-6">
        <LocaleSwitcher />
        <CurrencySwitcher />
        <Link href="/verify" className="text-[var(--front-accent)]">
          {t("verifyCode")}
        </Link>
        <Link href="/admin" className="text-[var(--front-accent)]">
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
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[#f0f0f0] bg-white">
      <div className="relative flex h-11 items-center px-1">
        <div className="z-10 flex w-[72px] shrink-0 items-center">
          {!isHome && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex size-9 items-center justify-center text-[#333]"
              aria-label={t("back")}
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-[16px] font-medium text-[#333]">
          {isHome ? brand.name : title}
        </p>
        <div className="z-10 flex w-[118px] shrink-0 items-center justify-end">
          <Link href="/search" className="flex size-9 items-center justify-center text-[#333]" aria-label={t("search")}>
            <Search className="size-5" />
          </Link>
          <Link href="/cart" className="relative flex size-9 items-center justify-center text-[#333]" aria-label={t("cart")}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#fa3534] px-0.5 text-[9px] text-white">
                {count}
              </span>
            )}
          </Link>
          <LocaleSwitcher compact />
        </div>
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
    <nav className="mp-tabbar fixed right-0 bottom-0 left-0 z-[var(--z-sticky)] flex h-[50px] border-t border-[#eee] bg-white md:hidden">
      {TAB_HREFS.map((tab) => {
        const active = isTabActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-[var(--front-tab)]" : "text-[#8a8a8a]",
            )}
          >
            <Icon className={cn("size-[22px]", active && "fill-current")} strokeWidth={active ? 2.2 : 1.7} />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppShell as PhoneShell };
