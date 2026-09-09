"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CircleDollarSign,
  Coins,
  CreditCard,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AdminSearch } from "@/components/admin/admin-search";
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";
import { cn } from "@/lib/utils";

const GROUPS_KEY = "opc-admin-groups";
const COLLAPSE_KEY = "opc-admin-side-collapsed";

type NavLink = { href: string; key: MessageKey; icon: typeof LayoutDashboard };
type NavGroup = { id: string; label: MessageKey; links: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    id: "content",
    label: "adminContentGroup",
    links: [
      { href: "/admin/products", key: "adminProducts", icon: Package },
      { href: "/admin/posters", key: "adminPosters", icon: Image },
      { href: "/admin/videos", key: "adminVideos", icon: Video },
    ],
  },
  {
    id: "customers",
    label: "adminCustomerGroup",
    links: [
      { href: "/admin/users", key: "adminUsers", icon: Users },
      { href: "/admin/orders", key: "adminOrders", icon: ShoppingBag },
    ],
  },
  {
    id: "finance",
    label: "adminFinanceGroup",
    links: [
      { href: "/admin/finance", key: "adminFinanceOverview", icon: Wallet },
      { href: "/admin/network", key: "adminNetwork", icon: Network },
      { href: "/admin/withdrawals", key: "adminWithdrawals", icon: Coins },
      { href: "/admin/ledger", key: "adminLedger", icon: BookOpen },
      { href: "/admin/referral", key: "adminRules", icon: SlidersHorizontal },
      { href: "/admin/anomalies", key: "adminAnomalies", icon: AlertTriangle },
    ],
  },
  {
    id: "system",
    label: "adminSystemGroup",
    links: [
      { href: "/admin/currency", key: "adminCurrency", icon: CircleDollarSign },
      { href: "/admin/billplz", key: "adminBillplz", icon: CreditCard },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContains(group: NavGroup, pathname: string) {
  return group.links.some((link) => isActive(pathname, link.href));
}

function readStoredGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(readStoredGroups);
  const [sideCollapsed, setSideCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  if (pathname === "/admin/login") {
    return <div className="admin-app">{children}</div>;
  }

  function persistGroups(next: Record<string, boolean>) {
    setOpenGroups(next);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
  }

  function toggleGroup(id: string, forceOpen?: boolean) {
    persistGroups({ ...openGroups, [id]: forceOpen ?? !openGroups[id] });
  }

  function toggleSide() {
    const next = !sideCollapsed;
    setSideCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function renderLink(link: NavLink, compact: boolean) {
    const Icon = link.icon;
    const label = t(link.key);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-label={compact ? label : undefined}
        data-tip={compact ? label : undefined}
        onClick={() => setMobileOpen(false)}
        className={cn(compact && "is-icon", isActive(pathname, link.href) && "is-active")}
      >
        <Icon size={16} strokeWidth={1.75} />
        {!compact && <span>{label}</span>}
      </Link>
    );
  }

  function renderNav(compact: boolean) {
    return (
      <nav className="admin-nav">
        <Link
          href="/admin"
          aria-label={compact ? t("adminOverview") : undefined}
          data-tip={compact ? t("adminOverview") : undefined}
          onClick={() => setMobileOpen(false)}
          className={cn(compact && "is-icon", isActive(pathname, "/admin") && "is-active")}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
          {!compact && <span>{t("adminOverview")}</span>}
        </Link>

        {GROUPS.map((group) => {
          const current = groupContains(group, pathname);
          const expanded = compact ? false : Boolean(openGroups[group.id] || current);
          return (
            <div key={group.id} className={cn("admin-nav-group", expanded && "is-open", current && "has-current")}>
              {compact ? (
                <div className="admin-nav-icons">{group.links.map((link) => renderLink(link, true))}</div>
              ) : (
                <>
                  <button
                    type="button"
                    className="admin-nav-toggle"
                    aria-expanded={expanded}
                    onClick={() => toggleGroup(group.id, current ? true : undefined)}
                  >
                    <span>{t(group.label)}</span>
                    <span className="admin-nav-chevron" aria-hidden>
                      {expanded ? "–" : "+"}
                    </span>
                  </button>
                  {expanded ? <div className="admin-nav-items">{group.links.map((link) => renderLink(link, false))}</div> : null}
                </>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="admin-app">
      <div className={cn("admin-frame", sideCollapsed && "is-collapsed")}>
        <aside className="admin-side">
          <div className="admin-side-head">
            <p className="admin-brand">{sideCollapsed ? "雅" : t("adminBrand")}</p>
            <button
              type="button"
              className="admin-side-collapse"
              onClick={toggleSide}
              title={sideCollapsed ? t("adminSideExpand") : t("adminSideCollapse")}
            >
              {sideCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          {renderNav(sideCollapsed)}
          <div className="admin-side-foot">
            {!sideCollapsed ? <LocaleSwitcher /> : null}
            <Link
              href="/"
              aria-label={t("adminFront")}
              data-tip={sideCollapsed ? t("adminFront") : undefined}
              className={cn(sideCollapsed && "is-icon")}
            >
              <Home size={16} strokeWidth={1.75} />
              {!sideCollapsed && <span>{t("adminFront")}</span>}
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label={t("adminLogout")}
              data-tip={sideCollapsed ? t("adminLogout") : undefined}
              className={cn(sideCollapsed && "is-icon")}
            >
              <LogOut size={16} strokeWidth={1.75} />
              {!sideCollapsed && <span>{t("adminLogout")}</span>}
            </button>
            {sideCollapsed ? (
              <button
                type="button"
                className="admin-side-reopen is-icon"
                onClick={toggleSide}
                aria-label={t("adminSideExpand")}
                data-tip={t("adminSideExpand")}
              >
                <PanelLeftOpen size={16} />
              </button>
            ) : null}
          </div>
        </aside>

        {mobileOpen ? (
          <div
            className="admin-drawer-root admin-nav-drawer"
            onKeyDown={(event) => {
              if (event.key === "Escape") setMobileOpen(false);
            }}
          >
            <button type="button" className="admin-drawer-mask" aria-label={t("close")} onClick={() => setMobileOpen(false)} />
            <aside className="admin-mobile-drawer" tabIndex={-1} autoFocus>
              <div className="admin-side-head">
                <p className="admin-brand">{t("adminBrand")}</p>
                <button type="button" className="admin-drawer-close" onClick={() => setMobileOpen(false)} aria-label={t("close")}>
                  <X size={16} />
                </button>
              </div>
              {renderNav(false)}
              <div className="admin-side-foot">
                <LocaleSwitcher />
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  {t("adminFront")}
                </Link>
                <button type="button" onClick={logout}>
                  {t("adminLogout")}
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="admin-main">
          <div className="admin-mobile-bar">
            <button type="button" className="admin-hamburger" aria-label={t("adminMenu")} onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <p className="jx-serif text-[17px]">{t("adminBrand")}</p>
            <div className="flex items-center gap-3 text-[13px] text-[var(--paper-mute)]">
              <LocaleSwitcher compact />
              <Link href="/">{t("adminFrontShort")}</Link>
            </div>
          </div>
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
