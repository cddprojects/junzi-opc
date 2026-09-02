"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Home, Search, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/data";
import { cartCount, useDemoStore } from "@/components/demo-store";
import { useAuth } from "@/components/auth-provider";
import { CurrencySwitcher } from "@/components/currency-switcher";

const TABS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/categories", label: "分类", icon: Bookmark },
  { href: "/mine", label: "我的", icon: UserRound },
] as const;

const DESKTOP_NAV = [
  { href: "/", label: "首页" },
  { href: "/categories", label: "分类" },
  { href: "/courses/recorded", label: "录播课" },
  { href: "/courses/live", label: "直播课" },
  { href: "/member", label: "年度会员" },
  { href: "/guides", label: "操作指南" },
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
    <div className="min-h-dvh bg-[#f4f0e6] text-[#222]">
      <DesktopHeader />
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <main
        className={cn(
          "mx-auto w-full bg-[#f7f7f7] md:max-w-6xl md:bg-transparent md:px-6 md:pt-6 md:pb-16",
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
      登录
    </Link>
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const { cart } = useDemoStore();
  const count = cartCount(cart);

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[#e6dcc8] bg-[#fffdf8]/96 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="font-serif text-[20px] tracking-wide text-[#3a2c10]">
          {brand.name}
        </Link>
        <nav className="flex flex-1 items-center gap-5 text-[14px]">
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:text-[#b8863b]",
                isTabActive(pathname, item.href) ? "font-medium text-[#b8863b]" : "text-[#444]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/search" className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
          <input
            name="q"
            placeholder="搜索课程"
            className="h-9 w-full rounded-full bg-[#f3efe6] pr-3 pl-9 text-[13px] outline-none"
          />
        </form>
        <CurrencySwitcher />
        <Link href="/cart" className="relative text-[#444]">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
        <AccountLink />
      </div>
    </header>
  );
}

function DesktopFooter() {
  return (
    <footer className="hidden border-t border-[#e6dcc8] bg-[#fffdf8] py-8 text-center text-[13px] text-[#7a6a50] md:block">
      <p className="font-serif text-[16px] text-[#3a2c10]">{brand.mottoWay}</p>
      <p className="mt-2">演示结算不扣款 · 购买后发放加密课程码</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <CurrencySwitcher />
        <Link href="/verify" className="text-[#b8863b]">
          验证课程码
        </Link>
        <Link href="/admin" className="text-[#b8863b]">
          管理后台
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
  const isHome = pathname === "/";
  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-[#ece4d4] bg-[#fffdf8]/96 backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-3">
        {!isHome && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-8 shrink-0 items-center justify-center text-[#333]"
            aria-label="返回"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <Link href="/" className="min-w-0 flex-1 truncate font-serif text-[17px] text-[#3a2c10]">
          {isHome ? brand.name : title}
        </Link>
        <Link href="/search" className="text-[#444]" aria-label="搜索">
          <Search className="size-5" />
        </Link>
        <Link href="/cart" className="relative text-[#444]" aria-label="购物车">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
        <CurrencySwitcher compact />
        <AccountLink compact />
      </div>
    </header>
  );
}

function pageTitle(pathname: string) {
  const map: Record<string, string> = {
    "/": brand.name,
    "/categories": "商品分类",
    "/mine": "我的",
    "/courses/recorded": "录播课",
    "/courses/live": "直播课",
    "/workshop": "线下工作坊",
    "/member": "会员中心",
    "/events": "活动报名",
    "/guides": "操作指南",
    "/guides/opc": "操作指南一",
    "/guides/ai": "操作指南二",
    "/tools": "AI工具",
    "/search": "搜索",
    "/cart": "购物车",
    "/orders": "学习订单",
    "/agent": "代理中心",
    "/learning": "我的学习",
    "/help": "帮助中心",
    "/profile": "修改资料",
    "/about": "关于我们",
    "/feedback": "用户反馈",
    "/service": "客服",
    "/login": "登录",
    "/register": "注册",
    "/verify": "验证课程码",
  };
  if (pathname.startsWith("/product/")) return "课程详情";
  return map[pathname] ?? brand.name;
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-[52px] w-full border-t border-[#ece4d4] bg-[#fffdf8] md:hidden">
      {TABS.map((tab) => {
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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppShell as PhoneShell };
