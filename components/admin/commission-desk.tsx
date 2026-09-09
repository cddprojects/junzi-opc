"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatMyrSen,
  formatTierRateLabel,
  type CommissionEntry,
  type GenealogyPerson,
  type OrderReferralSettled,
  type Withdrawal,
} from "@/lib/referral";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import { useLocale } from "@/components/locale-provider";

type Desk = {
  accruedSen: number;
  pendingWithdrawSen: number;
  earnings: (CommissionEntry & {
    userName?: string;
    userAccount?: string;
    orderTitle?: string;
    chain?: OrderReferralSettled;
    genealogy?: GenealogyPerson[];
  })[];
  withdrawals: (Withdrawal & { userName?: string; userAccount?: string; balanceSen?: number })[];
  skippedOrders?: {
    id: string;
    userId: string;
    userName?: string;
    productTitle: string;
    payMethod?: string;
    amountSen: number;
    amountMyr?: number;
    createdAt: string;
    reason: "grant" | "demo" | "not_billplz" | "no_upline";
    canAccrue?: boolean;
  }[];
};

function skipLabel(
  reason: "grant" | "demo" | "not_billplz" | "no_upline",
  t: (key: "adminSkipGrant" | "adminSkipDemo" | "adminSkipNotBillplz" | "adminSkipNoUpline") => string,
) {
  if (reason === "grant") return t("adminSkipGrant");
  if (reason === "demo") return t("adminSkipDemo");
  if (reason === "not_billplz") return t("adminSkipNotBillplz");
  return t("adminSkipNoUpline");
}

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

  async function accrue(orderId: string) {
    setBusy("accrue" + orderId);
    setError("");
    const res = await fetch("/api/admin/commission/accrue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = (await res.json()) as Desk & { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setDesk(data);
  }

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

      {(desk.skippedOrders?.length || 0) > 0 ? (
        <section className="jx-panel overflow-x-auto">
          <div className="px-4 pt-4">
            <h2>{t("adminSkippedOrders")}</h2>
            <p className="jx-lede mt-1">{t("adminSkippedHint")}</p>
          </div>
          <table className="jx-table">
            <thead>
              <tr>
                <th>{t("referralBuyer")}</th>
                <th>{t("referralOrder")}</th>
                <th className="jx-num">{t("adminColPaidAmount")}</th>
                <th>{t("adminColSkipReason")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {desk.skippedOrders!.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/users/${row.userId}`} className="jx-link">
                      {row.userName || row.userId}
                    </Link>
                  </td>
                  <td>
                    {row.productTitle}
                    <p className="text-[12px] text-[var(--mute)]">{row.id.slice(-8)}</p>
                  </td>
                  <td className="jx-num">
                    {row.amountSen || row.amountMyr != null
                      ? formatMyrSen(row.amountSen || Math.round((row.amountMyr || 0) * 100))
                      : "—"}
                  </td>
                  <td className="text-[13px] text-[var(--mute)]">{skipLabel(row.reason, t)}</td>
                  <td>
                    {row.canAccrue ? (
                      <button
                        type="button"
                        className="jx-btn-ghost"
                        disabled={Boolean(busy)}
                        onClick={() => accrue(row.id)}
                      >
                        {t("adminBackfill")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

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
                      {normalizeWithdrawalStatus(row.status) === "paid"
                        ? t("adminWdPaid")
                        : normalizeWithdrawalStatus(row.status) === "rejected"
                          ? t("adminWdRejected")
                          : normalizeWithdrawalStatus(row.status) === "approved"
                            ? t("adminWdApproved")
                            : t("adminWdPending")}
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
                    {normalizeWithdrawalStatus(row.status) === "pending" ||
                    normalizeWithdrawalStatus(row.status) === "approved" ? (
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
                      {t("referralTierN", { n: row.tier || 1 })} · {formatTierRateLabel(row)}
                    </p>
                    <p className={row.paid ? "jx-price" : "text-[var(--mute)]"}>
                      {formatMyrSen(row.amountSen)} · {row.paid ? t("adminPaid") : t("adminUnpaid")}
                      {row.reason ? ` · ${reasonLabel(row.reason, t)}` : ""}
                    </p>
                  </td>
                  <td>{row.buyerName || row.buyerId}</td>
                  <td>
                    {row.genealogy && row.genealogy.length > 0 ? (
                      <ol className="text-[12px] text-[var(--mute)]">
                        {row.genealogy.map((slot) => (
                          <li key={`${slot.depth}-${slot.userId}`}>
                            L{slot.depth}{" "}
                            <Link href={`/admin/users/${slot.userId}`} className="jx-link">
                              {slot.name}
                            </Link>{" "}
                            {slot.payable
                              ? t("adminPaysSpec", {
                                  spec: formatTierRateLabel(
                                    row.chain?.tiers.find((tier) => tier.tier === slot.depth) || { ratePercent: 0 },
                                  ),
                                })
                              : t("adminNoCommission")}
                          </li>
                        ))}
                      </ol>
                    ) : row.chain?.tiers?.length ? (
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
