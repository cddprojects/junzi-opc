"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMyrSen, type Withdrawal } from "@/lib/referral";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import { useT } from "@/components/locale-provider";

type Row = Withdrawal & { userName?: string; userAccount?: string; balanceSen?: number };
type Desk = { withdrawals: Row[] };

const TABS = ["pending", "approved", "paid", "rejected"] as const;

export function WithdrawalDesk() {
  const t = useT();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [open, setOpen] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/admin/commission")
      .then((res) => res.json())
      .then((data: Desk) => setDesk(data))
      .catch(() => setError(t("errorGeneric")));
  }, [t]);

  const rows = useMemo(
    () => (desk?.withdrawals || []).filter((row) => normalizeWithdrawalStatus(row.status) === tab),
    [desk, tab],
  );

  async function act(id: string, action: "approve" | "reject" | "pay") {
    if (action === "pay" && !confirm(t("adminConfirmPaid"))) return;
    setBusy(action + id);
    setError("");
    const res = await fetch(`/api/admin/commission/withdrawals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const data = (await res.json()) as Desk & { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setDesk(data);
    setOpen(null);
    setNote("");
  }

  const label = {
    pending: t("adminWdPending"),
    approved: t("adminWdApproved"),
    paid: t("adminWdPaid"),
    rejected: t("adminWdRejected"),
  };

  return (
    <div>
      <h1>{t("adminWithdrawals")}</h1>
      <p className="jx-lede">{t("adminFinanceIntro")}</p>
      {error ? <p className="mt-3 text-[13px] text-[var(--seal)]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={item === tab ? "jx-btn" : "jx-btn-ghost"}
            onClick={() => setTab(item)}
          >
            {label[item]}
          </button>
        ))}
      </div>
      <div className="jx-panel mt-4 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t("adminColName")}</th>
              <th>{t("adminColPaidAmount")}</th>
              <th>{t("adminColStatus")}</th>
              <th>{t("adminColAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("adminNoUsers")}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/users/${row.userId}`} className="jx-link">
                      {row.userName}
                    </Link>
                  </td>
                  <td className="jx-price">{formatMyrSen(row.amountSen)}</td>
                  <td>
                    <span className="jx-chip">{label[normalizeWithdrawalStatus(row.status)]}</span>
                  </td>
                  <td>
                    <button type="button" className="jx-link" onClick={() => setOpen(row)}>
                      {t("adminManage")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {open ? (
        <div className="jx-panel mt-4 p-5">
          <h2>
            {open.userName} · {formatMyrSen(open.amountSen)}
          </h2>
          <p className="mt-2 text-[13px] text-[var(--mute)]">
            {t("adminPayoutBank")}: {open.payout?.bank || "—"} · {t("adminPayoutHolder")}: {open.payout?.holder || "—"} ·{" "}
            {t("adminPayoutAccount")}: {open.payout?.account || "—"}
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-3 min-h-20 w-full rounded-md border px-3 py-2"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {normalizeWithdrawalStatus(open.status) === "pending" ? (
              <button type="button" className="jx-btn" disabled={Boolean(busy)} onClick={() => act(open.id, "approve")}>
                {t("adminApprove")}
              </button>
            ) : null}
            {isHeld(open.status) ? (
              <button type="button" className="jx-btn" disabled={Boolean(busy)} onClick={() => act(open.id, "pay")}>
                {t("adminConfirmPaid")}
              </button>
            ) : null}
            {isHeld(open.status) ? (
              <button type="button" className="jx-btn-ghost" disabled={Boolean(busy)} onClick={() => act(open.id, "reject")}>
                {t("adminReject")}
              </button>
            ) : null}
            <button type="button" className="jx-btn-ghost" onClick={() => setOpen(null)}>
              {t("close")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isHeld(status: string) {
  const canonical = normalizeWithdrawalStatus(status);
  return canonical === "pending" || canonical === "approved";
}
