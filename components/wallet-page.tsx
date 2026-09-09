"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMyrSen, senToMyr, TOPUP_PRESETS_SEN } from "@/lib/wallet";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

type WalletData = {
  topUpBalanceSen: number;
  commissionBalanceSen: number;
  pendingWithdrawalSen: number;
  availableToWithdrawSen: number;
  totalSen: number;
  transactions: { id: string; amountSen: number; kind: string; createdAt: string; note?: string }[];
  withdrawals: { id: string; amountSen: number; status: string; createdAt: string }[];
};

export function WalletPage() {
  const { user, loading } = useAuth();
  const { locale, t } = useLocale();
  const [data, setData] = useState<WalletData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [otherMyr, setOtherMyr] = useState("");

  function load() {
    return fetch("/api/wallet/me")
      .then((res) => res.json())
      .then((row: WalletData & { error?: string }) => {
        if (row.error) throw new Error(row.error);
        setData(row);
      });
  }

  useEffect(() => {
    if (!user) return;
    load().catch((err) => setError(translateApiError(locale, err instanceof Error ? err.message : "", "errorGeneric")));
  }, [user, locale]);

  async function topUp(amountSen: number) {
    setBusy("topup");
    setError("");
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSen }),
    });
    const row = (await res.json()) as { error?: string; redirectUrl?: string };
    setBusy("");
    if (!res.ok) {
      setError(translateApiError(locale, row.error, "errorGeneric"));
      return;
    }
    if (row.redirectUrl) window.location.assign(row.redirectUrl);
  }

  async function withdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("wd");
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/referral/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountMyr: Number(form.get("amountMyr") || 0),
        bank: String(form.get("bank") || ""),
        holder: String(form.get("holder") || ""),
        account: String(form.get("account") || ""),
      }),
    });
    const row = (await res.json()) as { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(translateApiError(locale, row.error, "errorGeneric"));
      return;
    }
    (event.currentTarget as HTMLFormElement).reset();
    await load();
  }

  if (loading) return <p className="px-4 py-8 text-[13px] text-[#888]">{t("loading")}</p>;
  if (!user) {
    return (
      <div className="rounded-2xl bg-white px-5 py-8">
        <h1 className="font-serif text-[24px]">{t("walletTitle")}</h1>
        <p className="mt-2 text-[13px] text-[#777]">{t("referralWithdrawNeedLogin")}</p>
        <Link href="/login?next=/wallet" className="mt-4 inline-block text-[14px] text-[#8a5a20]">
          {t("login")}
        </Link>
      </div>
    );
  }
  if (!data) return <p className="px-4 py-8 text-[13px] text-[#888]">{error || t("loading")}</p>;

  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h1 className="font-serif text-[24px]">{t("walletTitle")}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#666]">{t("walletIntro")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Bucket label={t("adminWalletTopUp")} value={data.topUpBalanceSen} />
          <Bucket label={t("adminWalletCommission")} value={data.commissionBalanceSen} />
          <Bucket label={t("adminWalletPending")} value={data.pendingWithdrawalSen} />
          <Bucket label={t("adminWalletAvailable")} value={data.availableToWithdrawSen} />
          <Bucket label={t("adminWalletTotal")} value={data.totalSen} />
        </div>
        <p className="mt-3 text-[12px] text-[#888]">{t("walletSpendNote")}</p>
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("walletTopUp")}</h2>
        {error ? <p className="mt-2 text-[13px] text-[#fa3534]">{error}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {TOPUP_PRESETS_SEN.map((sen) => (
            <button
              key={sen}
              type="button"
              disabled={busy === "topup"}
              onClick={() => topUp(sen)}
              className="rounded-md border border-[#eadfca] px-3 py-2 text-[13px] text-[#8a5a20]"
            >
              {formatMyrSen(sen)}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            topUp(Math.round(Number(otherMyr || 0) * 100));
          }}
        >
          <label className="text-[13px]">
            {t("walletTopUpOther")}
            <input
              value={otherMyr}
              onChange={(event) => setOtherMyr(event.target.value)}
              type="number"
              min="1"
              step="0.01"
              className="mt-1 h-10 w-36 rounded-md border border-[#eadfca] px-3"
            />
          </label>
          <button type="submit" disabled={busy === "topup"} className="h-10 rounded-md bg-[#8a5a20] px-4 text-[14px] text-white">
            {t("walletTopUpSubmit")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("walletWithdraw")}</h2>
        <p className="mt-1 text-[13px] text-[#777]">{t("referralWithdrawHint")}</p>
        <form onSubmit={withdraw} className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="text-[13px]">
            MYR
            <input
              name="amountMyr"
              type="number"
              min="0.01"
              step="0.01"
              max={senToMyr(data.availableToWithdrawSen)}
              required
              className="mt-1 h-10 w-full rounded-md border border-[#eadfca] px-3"
            />
          </label>
          <label className="text-[13px]">
            {t("adminPayoutBank")}
            <input name="bank" className="mt-1 h-10 w-full rounded-md border border-[#eadfca] px-3" />
          </label>
          <label className="text-[13px]">
            {t("adminPayoutHolder")}
            <input name="holder" className="mt-1 h-10 w-full rounded-md border border-[#eadfca] px-3" />
          </label>
          <label className="text-[13px]">
            {t("adminPayoutAccount")}
            <input name="account" className="mt-1 h-10 w-full rounded-md border border-[#eadfca] px-3" />
          </label>
          <button
            type="submit"
            disabled={busy === "wd" || data.availableToWithdrawSen < 1}
            className="h-10 rounded-md bg-[#8a5a20] px-4 text-[14px] text-white disabled:opacity-50"
          >
            {t("referralWithdrawSubmit")}
          </button>
        </form>
        {data.withdrawals.length > 0 ? (
          <ul className="mt-4 space-y-2 text-[13px]">
            {data.withdrawals.map((row) => (
              <li key={row.id} className="flex justify-between border-t border-[#f3eee4] pt-2">
                <span>
                  {formatMyrSen(row.amountSen)} · {normalizeWithdrawalStatus(row.status)}
                </span>
                <span className="text-[#999]">{new Date(row.createdAt).toLocaleDateString(locale === "en" ? "en-MY" : "zh-CN")}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("walletTx")}</h2>
        {data.transactions.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#777]">{t("walletTxEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-[13px]">
            {data.transactions.map((row) => (
              <li key={row.id} className="flex justify-between gap-3 border-b border-[#f3eee4] pb-2">
                <span>
                  {row.kind}
                  {row.note ? ` · ${row.note}` : ""}
                </span>
                <span className="opc-price text-[#8a5a20]">{formatMyrSen(row.amountSen)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Bucket({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#faf6ee] px-3 py-3">
      <p className="text-[12px] text-[#777]">{label}</p>
      <p className="opc-price mt-1 text-[20px] text-[#8a5a20]">{formatMyrSen(value)}</p>
    </div>
  );
}
