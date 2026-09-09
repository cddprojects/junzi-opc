import Link from "next/link";
import { listAllOrders, listCommissionDesk } from "@/lib/user-store";
import { formatMyrSen, formatTierRateLabel, MAX_COMMISSION_LEVELS } from "@/lib/referral";
import type { Order } from "@/lib/account";
import { getRequestLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { t, type MessageKey } from "@/lib/messages";
import { adminOrderKind, publicOrderNo } from "@/lib/orders-ui";
import {
  COMMISSION_STATUS_KEY,
  commissionStatusClass,
  commissionUiStatus,
} from "@/lib/commission-ui";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  const locale = await getRequestLocale();
  const desk = listCommissionDesk();
  const ordersById = new Map(listAllOrders().map((order) => [order.id, order]));
  const earns = desk.earnings.filter(
    (row) => row.kind === "earn" && (!row.tier || row.tier <= MAX_COMMISSION_LEVELS),
  );
  const groups = new Map<string, typeof earns>();
  for (const row of earns) {
    const key = row.orderId || row.id;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }
  const grouped = [...groups.values()]
    .map((rows) =>
      [...rows].sort((a, b) => (a.tier || 0) - (b.tier || 0) || Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    )
    .sort((a, b) => Date.parse(b[0]?.createdAt || "") - Date.parse(a[0]?.createdAt || ""));

  return (
    <div>
      <h1>{t(locale, "adminLedger")}</h1>
      <p className="jx-lede">{t(locale, "adminCommissionIntro")}</p>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t(locale, "adminColBuyer")}</th>
              <th>{t(locale, "adminColEarner")}</th>
              <th>{t(locale, "adminColTier")}</th>
              <th>{t(locale, "adminColCommission")}</th>
              <th>{t(locale, "adminColStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td colSpan={5}>{t(locale, "referralHistoryEmpty")}</td>
              </tr>
            ) : (
              grouped.flatMap((rows) =>
                rows.map((row, index) => {
                  const status = commissionUiStatus(row);
                  return (
                    <tr
                      key={row.id}
                      className={[
                        index === 0 ? "jx-group-start" : "jx-group-cont",
                        index === rows.length - 1 ? "jx-group-end" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {index === 0 ? (
                        <td rowSpan={rows.length} className="jx-buyer-cell">
                          <p className="jx-buyer-name">{row.buyerName || "—"}</p>
                          {row.orderTitle ? <p className="jx-buyer-meta">{row.orderTitle}</p> : null}
                          <p className="jx-buyer-meta">
                            {new Date(row.createdAt).toLocaleDateString(locale === "en" ? "en-MY" : "zh-CN")}
                          </p>
                          {row.orderId ? (
                            <OrderRef
                              locale={locale}
                              orderId={row.orderId}
                              order={ordersById.get(row.orderId)}
                            />
                          ) : null}
                        </td>
                      ) : null}
                      <td>
                        {row.userId ? (
                          <Link href={`/admin/users/${row.userId}`} className="jx-link">
                            {row.userName || row.userId}
                          </Link>
                        ) : (
                          <span className="text-[var(--mute)]">—</span>
                        )}
                      </td>
                      <td>
                        {row.tier
                          ? `${t(locale, "referralTierN", { n: row.tier })} · ${formatTierRateLabel(row)}`
                          : row.kind}
                      </td>
                      <td className="jx-price">{formatMyrSen(row.amountSen)}</td>
                      <td>
                        <span className={commissionStatusClass(status)}>
                          {t(locale, COMMISSION_STATUS_KEY[status] as MessageKey)}
                        </span>
                      </td>
                    </tr>
                  );
                }),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRef({
  locale,
  orderId,
  order,
}: {
  locale: Locale;
  orderId: string;
  order?: Order;
}) {
  const publicNo = order ? publicOrderNo(order) : null;
  const kind = order ? adminOrderKind(order) : "customer";
  const badge = kind === "refverify" ? t(locale, "adminOrderRefVerify") : null;

  if (publicNo) {
    return (
      <p className="jx-buyer-meta">
        <Link href={`/admin/orders/${orderId}`} className="jx-link">
          {t(locale, "adminOrderShort")} {publicNo}
        </Link>
        {badge ? <span className="jx-chip ml-2">{badge}</span> : null}
      </p>
    );
  }

  return (
    <p className="jx-buyer-meta">
      <Link href={`/admin/orders/${orderId}`} className="jx-link">
        {badge || t(locale, "adminOrderDetail")}
      </Link>
    </p>
  );
}
