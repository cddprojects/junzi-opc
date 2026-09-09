"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMyrSen, type CommissionEntry, type OrderReferralSettled, type Withdrawal } from "@/lib/referral";
import { useLocale } from "@/components/locale-provider";

type Desk = {
  accruedSen: number;
  pendingWithdrawSen: number;
  earnings: (CommissionEntry & {
    userName?: string;
    userAccount?: string;
    orderTitle?: string;
    chain?: OrderReferralSettled;
  })[];
  withdrawals: (Withdrawal & { userName?: string; userAccount?: string; balanceSen?: number })[];
};

function reasonLabel(reason: string | undefined, t: (key: "adminReasonMissing" | "adminReasonInactive" | "adminReasonOff" | "adminReasonZero") => string) {
  if (reason === "missing") return t("adminReasonMissing");
  if (reason === "inactive") return t("adminReasonInactive");
  if (reason === "tier_off") return t("adminReasonOff");
  if (reason === "zero") return t("adminReasonZero");
  return reason || "";
}

export function CommissionDesk() {
  const { locale, t } = useLocale();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/admin/commission")
      .then((res) => res.json())
      .then((data: Desk) => setDesk(data))
      .catch(() => setError(t("errorGeneric")));
  }, [t]);

  async function act(id: string, action: "settle" | "reject") {
    setBusy(id + action);
    setError("");
    const res = await fetch(`/api/admin/commission/withdrawals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as Desk & { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setDesk(data);
  }

  if (!desk) {
    return <p className="text-[13px] text-[var(--mute)]">{error || t("loading")}</p>;
  }

  const earnRows = desk.earnings.filter((row) => row.kind === "earn");

  return (
    <div className="space-y-6">
      <div>
        <h1>{t("adminCommission")}</h1>
        <p className="jx-lede">{t("adminCommissionIntro")}</p>
      </div>
      {error ? <p className="text-[13px] text-[var(--seal)]">{error}</p> : null}

      <div className="jx-ledger">
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t("adminCommissionAccrued")}</p>
          <p className="jx-ledger-value is-seal">{formatMyrSen(desk.accruedSen)}</p>
        </div>
        <div className="jx-panel jx-ledger-card">
          <p className="jx-ledger-label">{t("adminCommissionPendingWd")}</p>
          <p className="jx-ledger-value">{formatMyrSen(desk.pendingWithdrawSen)}</p>
        </div>
      </div>

      <section className="jx-panel overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t("referralWithdraw")}</th>
              <th>{t("adminUsers")}</th>
              <th>{t("referralBalance")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {desk.withdrawals.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("referralWithdrawList")}: —</td>
              </tr>
            ) : (
              desk.withdrawals.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="jx-price">{formatMyrSen(row.amountSen)}</span>
                    <p className="text-[12px] text-[var(--mute)]">
                      {row.status === "settled"
                        ? t("referralStatusSettled")
                        : row.status === "rejected"
                          ? t("referralStatusRejected")
                          : t("referralStatusRequested")}
                      · {new Date(row.createdAt).toLocaleString(locale === "en" ? "en-MY" : "zh-CN")}
                    </p>
                  </td>
                  <td>
                    <Link href={`/admin/users/${row.userId}`} className="jx-link">
                      {row.userName || row.userId}
                    </Link>
                    <p className="text-[12px] text-[var(--mute)]">{row.userAccount}</p>
                  </td>
                  <td>{formatMyrSen(row.balanceSen || 0)}</td>
                  <td>
                    {row.status === "requested" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="jx-btn"
                          disabled={Boolean(busy)}
                          onClick={() => act(row.id, "settle")}
                        >
                          {t("adminSettle")}
                        </button>
                        <button
                          type="button"
                          className="jx-btn-ghost"
                          disabled={Boolean(busy)}
                          onClick={() => act(row.id, "reject")}
                        >
                          {t("adminReject")}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="jx-panel overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t("referralHistory")}</th>
              <th>{t("adminReferralTier", { n: "" })}</th>
              <th>{t("referralBuyer")}</th>
              <th>{t("adminUpline")}</th>
            </tr>
          </thead>
          <tbody>
            {earnRows.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("referralHistoryEmpty")}</td>
              </tr>
            ) : (
              earnRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.userId ? (
                      <Link href={`/admin/users/${row.userId}`} className="jx-link">
                        {row.userName || row.userId}
                      </Link>
                    ) : (
                      <span className="text-[var(--mute)]">—</span>
                    )}
                    <p className="text-[12px] text-[var(--mute)]">
                      {row.orderTitle || row.orderId} · {formatMyrSen(row.baseSen || 0)}
                    </p>
                  </td>
                  <td>
                    <p>
                      {t("referralTierN", { n: row.tier || 1 })} · {row.ratePercent}%
                    </p>
                    <p className={row.paid ? "jx-price" : "text-[var(--mute)]"}>
                      {formatMyrSen(row.amountSen)} · {row.paid ? t("adminPaid") : t("adminUnpaid")}
                      {row.reason ? ` · ${reasonLabel(row.reason, t)}` : ""}
                    </p>
                  </td>
                  <td>{row.buyerName || row.buyerId}</td>
                  <td>
                    {row.chain?.tiers?.length ? (
                      <ol className="text-[12px] text-[var(--mute)]">
                        {row.chain.tiers.map((slot) => (
                          <li key={slot.tier}>
                            L{slot.tier} {slot.name || "—"} {formatMyrSen(slot.amountSen)}
                            {slot.paid ? "" : ` (${reasonLabel(slot.reason, t) || t("adminUnpaid")})`}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
