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
          isProduct ? "pb-[72px] md:pb-20" : "pb-[64px] md:pb-20",
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
    <header className="sticky top-0 z-40 hidden border-b border-[var(--front-border)] bg-[color-mix(in_srgb,var(--front-surface)_92%,transparent)] backdrop-blur-md md:block">
      <div className="front-wrap flex h-[76px] flex-nowrap items-center gap-5 px-6">
        <Link href="/" className="shrink-0 font-serif text-[22px] tracking-wide whitespace-nowrap text-[var(--front-text)]">
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
            className="h-11 w-full min-w-0 rounded-[var(--front-radius-sm)] border border-[var(--front-border)] bg-[var(--front-surface-soft)] pr-3 pl-10 text-[14px] text-[var(--front-text)] outline-none placeholder:text-[var(--front-text-muted)]"
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
    <footer className="hidden border-t border-[var(--front-border)] bg-[var(--front-surface)] py-14 text-center text-[14px] text-[var(--front-text-soft)] md:block">
      <p className="font-serif text-[20px] text-[var(--front-text)]">{localized(locale, brand.mottoWay, brand.mottoWayEn)}</p>
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
    <header className="sticky top-0 z-30 border-b border-[var(--front-border)] bg-[color-mix(in_srgb,var(--front-surface)_94%,transparent)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3">
        {!isHome && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-10 shrink-0 items-center justify-center text-[var(--front-text)]"
            aria-label={t("back")}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <Link href="/" className="min-w-0 flex-1 truncate font-serif text-[18px] text-[var(--front-text)]">
          {isHome ? brand.name : title}
        </Link>
        <Link href="/search" className="text-[var(--front-text-soft)]" aria-label={t("search")}>
          <Search className="size-5" />
        </Link>
        <Link href="/cart" className="relative text-[var(--front-text-soft)]" aria-label={t("cart")}>
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--front-accent)] px-1 text-[10px] text-white">
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
    <nav className="fixed bottom-0 left-0 z-40 flex h-[58px] w-full border-t border-[var(--front-border)] bg-[var(--front-surface)] md:hidden">
      {TAB_HREFS.map((tab) => {
        const active = isTabActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-[var(--front-accent)]" : "text-[var(--front-text-muted)]",
            )}
          >
            <Icon className={cn("size-[22px]", active && "fill-[var(--front-accent)]")} strokeWidth={active ? 2.2 : 1.7} />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppShell as PhoneShell };
