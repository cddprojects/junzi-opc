"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/data";

const TABS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/categories", label: "分类", icon: Bookmark },
  { href: "/mine", label: "我的", icon: UserRound },
] as const;

function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PhoneShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProduct = pathname.startsWith("/product/");

  return (
    <div className="min-h-dvh bg-[#d8d8d8] text-[#222]">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f7f7f7] shadow-[0_0_40px_rgba(0,0,0,0.18)]",
        )}
      >
        <MiniHeader />
        <main className={cn("flex-1", isProduct ? "pb-[64px]" : "pb-[58px]")}>{children}</main>
        {isProduct ? null : <TabBar />}
      </div>
    </div>
  );
}

function MiniHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/96 backdrop-blur">
      <div className="flex h-11 items-center px-2">
        <div className="flex w-16 items-center">
          {!isHome && (
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
  return map[pathname] ?? brand.name;
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-[52px] w-full max-w-[430px] -translate-x-1/2 border-t border-black/6 bg-white">
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
