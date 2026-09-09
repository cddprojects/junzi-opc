import Link from "next/link";
import { listCommissionDesk } from "@/lib/user-store";
import { formatMyrSen } from "@/lib/wallet";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminAnomaliesPage() {
  const locale = await getRequestLocale();
  const desk = listCommissionDesk();

  return (
    <div>
      <h1>{t(locale, "adminAnomalies")}</h1>
      <p className="jx-lede">{t(locale, "adminSkippedHint")}</p>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t(locale, "referralOrder")}</th>
              <th>{t(locale, "adminColName")}</th>
              <th>{t(locale, "adminColPaidAmount")}</th>
              <th>{t(locale, "adminColSkipReason")}</th>
            </tr>
          </thead>
          <tbody>
            {!desk.skippedOrders?.length ? (
              <tr>
                <td colSpan={4}>{t(locale, "adminNoUsers")}</td>
              </tr>
            ) : (
              desk.skippedOrders.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.productTitle}
                    <span className="block text-[12px] text-[var(--mute)]">{row.id}</span>
                  </td>
                  <td>
                    <Link href={`/admin/users/${row.userId}`} className="jx-link">
                      {row.userName}
                    </Link>
                  </td>
                  <td className="jx-price">{formatMyrSen(row.amountSen)}</td>
                  <td>{row.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
