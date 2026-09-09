import Link from "next/link";
import { listCommissionDesk } from "@/lib/user-store";
import { formatMyrSen, formatTierRateLabel } from "@/lib/referral";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { CommissionChain } from "@/components/admin/commission-chain";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  const locale = await getRequestLocale();
  const desk = listCommissionDesk();
  const earns = desk.earnings.filter((row) => row.kind === "earn");

  return (
    <div>
      <h1>{t(locale, "adminLedger")}</h1>
      <p className="jx-lede">{t(locale, "adminCommissionIntro")}</p>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t(locale, "referralBuyer")}</th>
              <th>{t(locale, "adminColName")}</th>
              <th>{t(locale, "adminReferralTier", { n: "" })}</th>
              <th>{t(locale, "adminColPaidAmount")}</th>
              <th>{t(locale, "adminColStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {earns.length === 0 ? (
              <tr>
                <td colSpan={5}>{t(locale, "referralHistoryEmpty")}</td>
              </tr>
            ) : (
              earns.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.buyerName || "—"}
                    {row.orderId ? (
                      <span className="block text-[12px] text-[var(--mute)]">{row.orderTitle}</span>
                    ) : null}
                  </td>
                  <td>
                    {row.userId ? (
                      <Link href={`/admin/users/${row.userId}`} className="jx-link">
                        {row.userName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {row.tier ? `${t(locale, "referralTierN", { n: row.tier })} · ${formatTierRateLabel(row)}` : row.kind}
                  </td>
                  <td className="jx-price">{formatMyrSen(row.amountSen)}</td>
                  <td>
                    <span className={row.paid ? "jx-chip jx-chip-ok" : "jx-chip"}>
                      {row.paid ? t(locale, "adminCredited") : t(locale, "adminNotCredited")}
                    </span>
                    {row.chain ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[12px] text-[var(--gold)]">T1–T3+</summary>
                        <CommissionChain tiers={row.chain.tiers} genealogy={row.genealogy} />
                      </details>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
