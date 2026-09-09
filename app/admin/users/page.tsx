import Link from "next/link";
import { listCustomers } from "@/lib/user-store";
import { formatMyrSen } from "@/lib/referral";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

function formatJoined(iso: string, locale: "zh" | "en") {
  const date = new Date(iso);
  const day = date.toLocaleDateString(locale === "en" ? "en-CA" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = date.toLocaleTimeString(locale === "en" ? "en-GB" : "zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { day, time };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getRequestLocale();
  const { q = "" } = await searchParams;
  const users = listCustomers(q);

  return (
    <div>
      <h1>{t(locale, "adminUsers")}</h1>
      <p className="jx-lede">{t(locale, "adminUsersIntro")}</p>
      <form className="jx-toolbar">
        <input name="q" defaultValue={q} placeholder={t(locale, "adminUsersSearch")} />
        <button type="submit" className="jx-btn">
          {t(locale, "search")}
        </button>
      </form>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table jx-table-users">
          <thead>
            <tr>
              <th>{t(locale, "adminColName")}</th>
              <th>{t(locale, "adminColAccount")}</th>
              <th>{t(locale, "adminReferralCode")}</th>
              <th>{t(locale, "adminReferrer")}</th>
              <th>{t(locale, "adminColStatus")}</th>
              <th>{t(locale, "adminColMember")}</th>
              <th className="jx-num">{t(locale, "adminColOrders")}</th>
              <th className="jx-num">{t(locale, "adminColBalance")}</th>
              <th>{t(locale, "adminColJoined")}</th>
              <th>{t(locale, "adminColAction")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={10}>{t(locale, "adminNoUsers")}</td>
              </tr>
            ) : (
              users.map((user) => {
                const joined = formatJoined(user.createdAt, locale);
                return (
                  <tr key={user.id}>
                    <td className="jx-serif">{user.name}</td>
                    <td className="text-[13px] text-[var(--mute)]">{user.email || user.phone}</td>
                    <td className="jx-mono">{user.referralCode || "—"}</td>
                    <td>
                      {user.referrerId ? (
                        <Link href={`/admin/users/${user.referrerId}`} className="jx-link">
                          {user.referrerName || user.referrerId}
                        </Link>
                      ) : (
                        <span className="text-[var(--faint)]">—</span>
                      )}
                    </td>
                    <td>
                      <span className={user.status === "disabled" ? "jx-chip jx-chip-wait" : "jx-chip jx-chip-ok"}>
                        {user.status === "disabled" ? t(locale, "adminUserDisabled") : t(locale, "adminUserActive")}
                      </span>
                    </td>
                    <td className="text-[13px] text-[var(--mute)]">
                      {user.memberActive ? t(locale, "adminMemberOn") : t(locale, "adminMemberOff")}
                    </td>
                    <td className="jx-num">
                      <span>{user.orderCount}</span>
                      {user.orderCount === 0 ? null : user.paidOrderCount > 0 && user.billplzPaidCount === 0 && user.accruedOrderCount === 0 ? (
                        <span className="block text-[11px] font-normal text-[var(--faint)]">
                          {t(locale, "adminOrdersNoCommission")}
                        </span>
                      ) : user.paidOrderCount !== user.orderCount ? (
                        <span className="block text-[11px] font-normal text-[var(--faint)]">
                          {t(locale, "adminOrdersPaidOf", { paid: user.paidOrderCount, total: user.orderCount })}
                        </span>
                      ) : null}
                    </td>
                    <td className="jx-num">
                      <span className="jx-price">{formatMyrSen(user.commissionBalanceSen || 0)}</span>
                    </td>
                    <td className="jx-joined">
                      <span>{joined.day}</span>
                      <span>{joined.time}</span>
                    </td>
                    <td>
                      <Link href={`/admin/users/${user.id}`} className="jx-link">
                        {t(locale, "adminManage")}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
