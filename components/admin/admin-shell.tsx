"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AdminSearch } from "@/components/admin/admin-search";
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";

type NavLink = { href: string; key: MessageKey };

const GROUPS: { label: MessageKey; links: NavLink[] }[] = [
  {
    label: "adminOverview",
    links: [{ href: "/admin", key: "adminOverview" }],
  },
  {
    label: "adminContentGroup",
    links: [
      { href: "/admin/products", key: "adminProducts" },
      { href: "/admin/posters", key: "adminPosters" },
      { href: "/admin/videos", key: "adminVideos" },
    ],
  },
  {
    label: "adminCustomerGroup",
    links: [
      { href: "/admin/users", key: "adminUsers" },
      { href: "/admin/orders", key: "adminOrders" },
    ],
  },
  {
    label: "adminFinanceGroup",
    links: [
      { href: "/admin/finance", key: "adminFinanceOverview" },
      { href: "/admin/network", key: "adminNetwork" },
      { href: "/admin/withdrawals", key: "adminWithdrawals" },
      { href: "/admin/ledger", key: "adminLedger" },
      { href: "/admin/referral", key: "adminRules" },
      { href: "/admin/anomalies", key: "adminAnomalies" },
    ],
  },
  {
    label: "adminSystemGroup",
    links: [
      { href: "/admin/currency", key: "adminCurrency" },
      { href: "/admin/billplz", key: "adminBillplz" },
    ],
  },
];

const ALL_LINKS = GROUPS.flatMap((group) => group.links);

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/commission") return pathname.startsWith("/admin/commission") || pathname.startsWith("/admin/ledger");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function titleKey(pathname: string): MessageKey {
  if (pathname.startsWith("/admin/products")) return "adminProducts";
  if (pathname.startsWith("/admin/posters")) return "adminPosters";
  if (pathname.startsWith("/admin/videos")) return "adminVideos";
  if (pathname.startsWith("/admin/orders")) return "adminOrders";
  if (pathname.startsWith("/admin/users")) return "adminUsers";
  if (pathname.startsWith("/admin/network")) return "adminNetwork";
  if (pathname.startsWith("/admin/withdrawals")) return "adminWithdrawals";
  if (pathname.startsWith("/admin/ledger") || pathname.startsWith("/admin/commission")) return "adminLedger";
  if (pathname.startsWith("/admin/referral")) return "adminRules";
  if (pathname.startsWith("/admin/anomalies")) return "adminAnomalies";
  if (pathname.startsWith("/admin/finance")) return "adminFinanceOverview";
  if (pathname.startsWith("/admin/currency")) return "adminCurrency";
  if (pathname.startsWith("/admin/billplz")) return "adminBillplz";
  return "adminOverview";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  if (pathname === "/admin/login") {
    return <div className="admin-app">{children}</div>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-app">
      <div className="admin-frame">
        <aside className="admin-side">
          <p className="admin-brand">{t("adminBrand")}</p>
          <nav className="admin-nav">
            {GROUPS.map((group) => (
              <div key={group.label} className="admin-nav-group">
                {group.label !== "adminOverview" ? (
                  <p className="admin-nav-label">{t(group.label)}</p>
                ) : null}
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(isActive(pathname, link.href) && "is-active")}
                  >
                    {t(link.key)}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="admin-side-foot">
            <LocaleSwitcher />
            <Link href="/">{t("adminFront")}</Link>
            <button type="button" onClick={logout}>
              {t("adminLogout")}
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <div className="admin-mobile-bar">
            <p className="jx-serif text-[17px]">{t("adminBrand")}</p>
            <div className="flex items-center gap-3 text-[13px] text-[var(--paper-mute)]">
              <LocaleSwitcher compact />
              <Link href="/">{t("adminFrontShort")}</Link>
            </div>
          </div>
          <nav className="admin-mobile-nav">
            {ALL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("shrink-0", isActive(pathname, link.href) && "is-active")}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <header className="admin-topbar">
            <p className="admin-topbar-title">{t(titleKey(pathname))}</p>
            <AdminSearch />
          </header>
          <div className="admin-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
