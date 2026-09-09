import Link from "next/link";
import { listCommissionDesk, listCustomers } from "@/lib/user-store";
import { formatMyrSen } from "@/lib/wallet";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const locale = await getRequestLocale();
  const desk = listCommissionDesk();
  const users = listCustomers();

  return (
    <div>
      <h1>{t(locale, "adminFinanceOverview")}</h1>
      <p className="jx-lede">{t(locale, "adminFinanceIntro")}</p>
      <div className="jx-ledger mt-6">
        <Link href="/admin/ledger" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiAccrued")}</p>
          <p className="jx-ledger-value is-seal">{formatMyrSen(desk.accruedSen)}</p>
        </Link>
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiCommissionBal")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.commissionBalanceSen || 0)}</p>
        </div>
        <Link href="/admin/withdrawals" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiPendingWd")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.pendingWithdrawSen)}</p>
        </Link>
        <Link href="/admin/withdrawals" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiPaidOut")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.paidWithdrawSen || 0)}</p>
        </Link>
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiMonth")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.monthCommissionSen || 0)}</p>
        </div>
        <Link href="/admin/network" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminKpiReferrals")}</p>
          <p className="jx-ledger-value">{desk.referralCount || 0}</p>
        </Link>
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminWalletTopUp")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.topUpBalanceSen || 0)}</p>
        </div>
        <Link href="/admin/users" className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t(locale, "adminUsers")}</p>
          <p className="jx-ledger-value">{users.length}</p>
        </Link>
      </div>
    </div>
  );
}
