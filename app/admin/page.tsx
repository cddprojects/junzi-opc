import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { getAdminHomeStats } from "@/lib/user-store";
import { formatMyrSen } from "@/lib/referral";
import { isBillplzConfigured } from "@/lib/billplz";
import { formatMoneyAmount } from "@/lib/currency";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const locale = await getRequestLocale();
  const { products, posters, videos } = await getCatalog();
  const stats = await getAdminHomeStats();
  const billplzReady = isBillplzConfigured();

  return (
    <div>
      <h1>{locale === "en" ? "Today" : "今日概览"}</h1>
      <p className="jx-lede">
        {locale === "en"
          ? "Live counts from this workspace. Storefront reads the same catalog."
          : "以下数字来自当前工作区真实数据，与前台目录同一份。"}
      </p>

      <div className="jx-ledger mt-6">
        <Link href="/admin/products" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminProducts")}</p>
          <p className="jx-ledger-value">{products.length}</p>
        </Link>
        <Link href="/admin/users" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminUsers")}</p>
          <p className="jx-ledger-value">{stats.userCount}</p>
        </Link>
        <Link href="/admin/orders" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminOrders")}</p>
          <p className="jx-ledger-value">{stats.orderCount}</p>
        </Link>
        <Link href="/admin/orders" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{locale === "en" ? "Collected (MYR)" : "已收令吉"}</p>
          <p className="jx-ledger-value is-seal">{formatMoneyAmount(stats.paidMyr, "MYR")}</p>
        </Link>
        <Link href="/admin/posters" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminPosters")}</p>
          <p className="jx-ledger-value">{posters.length}</p>
        </Link>
        <Link href="/admin/videos" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminVideos")}</p>
          <p className="jx-ledger-value">{videos.length}</p>
        </Link>
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{locale === "en" ? "Paid / pending" : "已付 / 待付"}</p>
          <p className="jx-ledger-value">
            {stats.paidCount}
            <span className="text-[16px] text-[var(--mute)]"> / {stats.pendingCount}</span>
          </p>
        </div>
        <Link href="/admin/billplz" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminBillplz")}</p>
          <p className={`jx-ledger-value ${billplzReady ? "" : "is-seal"}`}>{billplzReady ? "ON" : "OFF"}</p>
        </Link>
        <Link href="/admin/finance" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminCommissionAccrued")}</p>
          <p className="jx-ledger-value is-seal">{formatMyrSen(stats.accruedSen)}</p>
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Link href="/admin/billplz" className="jx-insight block">
          <p className="jx-serif text-[15px] font-semibold">{t(locale, "adminBillplz")}</p>
          <p className="mt-1">{billplzReady ? t(locale, "adminBillplzConfigured") : t(locale, "adminBillplzNotConfigured")}</p>
        </Link>
        <div className="jx-insight">
          <p className="jx-serif text-[15px] font-semibold">{locale === "en" ? "Catalog" : "目录"}</p>
          <p className="mt-1">
            {locale === "en"
              ? `${products.length} products · ${posters.length} posters · ${videos.length} videos. Edit from the sidebar.`
              : `${products.length} 个商品 · ${posters.length} 张海报 · ${videos.length} 个视频。从左侧进入编辑。`}
          </p>
        </div>
      </div>
    </div>
  );
}
