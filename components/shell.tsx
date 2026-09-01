"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Home, Search, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/data";
import { cartCount, useDemoStore } from "@/components/demo-store";

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
    <div className="min-h-dvh bg-[#efe8d8] text-[#222] md:bg-[#f4f0e6]">
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
        <Link href="/cart" className="relative text-[#444]">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
        <Link href="/mine" className="text-[14px] text-[#444] hover:text-[#b8863b]">
          我的
        </Link>
      </div>
    </header>
  );
}

function DesktopFooter() {
  return (
    <footer className="hidden border-t border-[#e6dcc8] bg-[#fffdf8] py-8 text-center text-[13px] text-[#7a6a50] md:block">
      <p className="font-serif text-[16px] text-[#3a2c10]">{brand.mottoWay}</p>
      <p className="mt-2">演示站不支持支付 · 一人公司研习社公开浏览</p>
      <Link href="/admin" className="mt-3 inline-block text-[#b8863b]">
        管理后台
      </Link>
    </footer>
  );
}

function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isTabPage = pathname === "/" || pathname === "/categories" || pathname === "/mine";
  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/96 backdrop-blur">
      <div className="flex h-11 items-center px-2">
        <div className="flex w-16 items-center">
          {!isTabPage && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center text-[#333]"
              aria-label="返回"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-[16px] font-medium">{title}</h1>
        <div className="flex w-16 justify-end pr-1">
          <div className="flex overflow-hidden rounded-full border border-black/10 bg-black/4">
            <span className="flex h-7 w-8 items-center justify-center text-[15px] text-[#333]">···</span>
            <span className="flex h-7 w-8 items-center justify-center border-l border-black/10 text-[13px] text-[#333]">
              ○
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function pageTitle(pathname: string) {
  const map: Record<string, string> = {
    "/": brand.name,
    "/categories": "商品分类",
    "/mine": "我的",
    "/courses/recorded": "君子小雅OPC录播课",
    "/courses/live": "君子小雅OPC直播课",
    "/workshop": "线下工作坊",
    "/member": "会员中心",
    "/events": "活动报名",
    "/guides": "操作指南 (必看)",
    "/guides/opc": "操作指南一",
    "/guides/ai": "操作指南二",
    "/tools": "AI工具小程序",
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
    "/product/qihang": "君子小雅OPC启航营",
    "/product/shizhan": "君子小雅OPC实战营",
    "/product/compute": "算力加餐包",
  };
  if (pathname.startsWith("/product/")) {
    return map[pathname] ?? "课程详情";
  }
  return map[pathname] ?? brand.name;
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-[52px] w-full border-t border-black/6 bg-white md:hidden">
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-[#07c160]" : "text-[#888]",
            )}
          >
            <Icon className={cn("size-[22px]", active && "fill-[#07c160]")} strokeWidth={active ? 2.2 : 1.7} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppShell as PhoneShell };
