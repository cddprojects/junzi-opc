"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";

const LINKS: { href: string; key: MessageKey }[] = [
  { href: "/admin", key: "adminOverview" },
  { href: "/admin/products", key: "adminProducts" },
  { href: "/admin/posters", key: "adminPosters" },
  { href: "/admin/videos", key: "adminVideos" },
  { href: "/admin/orders", key: "adminOrders" },
  { href: "/admin/users", key: "adminUsers" },
  { href: "/admin/currency", key: "adminCurrency" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
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
          <p className="font-serif text-[18px]">{t("adminBrand")}</p>
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
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-2 text-[13px]">
            <LocaleSwitcher />
            <Link href="/" className="text-[#8a5a20]">
              {t("adminFront")}
            </Link>
            <button type="button" onClick={logout} className="text-left text-[#888]">
              {t("adminLogout")}
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e6dcc8] bg-[#fffdf8] px-4 py-3 md:hidden">
            <p className="font-serif">{t("adminBackend")}</p>
            <div className="flex items-center gap-2">
              <LocaleSwitcher compact />
              <Link href="/" className="text-[13px] text-[#8a5a20]">
                {t("adminFrontShort")}
              </Link>
            </div>
          </header>
          <nav className="flex gap-3 overflow-x-auto border-b border-[#e6dcc8] bg-[#fffdf8] px-4 py-2 text-[13px] md:hidden">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap">
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
