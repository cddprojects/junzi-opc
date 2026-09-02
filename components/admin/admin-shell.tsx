"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/products", label: "商品 / 课程" },
  { href: "/admin/posters", label: "海报 / 轮播" },
  { href: "/admin/videos", label: "视频" },
  { href: "/admin/orders", label: "订单 / 课程码" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/admin/login") {
    return <div className="min-h-dvh bg-[#f4f0e6]">{children}</div>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-[#f4f0e6] text-[#222]">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-[#e6dcc8] bg-[#fffdf8] p-5 md:block">
          <p className="font-serif text-[18px]">君子小雅 · 后台</p>
          <nav className="mt-6 flex flex-col gap-1 text-[14px]">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2",
                  pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-[#f3ead8] font-medium text-[#8a5a20]"
                    : "text-[#555] hover:bg-[#f7f1e4]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-2 text-[13px]">
            <Link href="/" className="text-[#8a5a20]">
              返回前台
            </Link>
            <button type="button" onClick={logout} className="text-left text-[#888]">
              退出登录
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e6dcc8] bg-[#fffdf8] px-4 py-3 md:hidden">
            <p className="font-serif">管理后台</p>
            <Link href="/" className="text-[13px] text-[#8a5a20]">
              前台
            </Link>
          </header>
          <nav className="flex gap-3 overflow-x-auto border-b border-[#e6dcc8] bg-[#fffdf8] px-4 py-2 text-[13px] md:hidden">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
