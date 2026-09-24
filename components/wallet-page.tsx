"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMyrSen, senToMyr, TOPUP_PRESETS_SEN } from "@/lib/wallet";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { PayBusyOverlay } from "@/components/pay-busy-overlay";
import { translateApiError } from "@/lib/messages";
import { canFollowPayRedirect, isAbortError } from "@/lib/pay-redirect";

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
  const topUpLock = useRef(false);
  const topUpAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

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

  useEffect(() => {
    mountedRef.current = true;
    const abortInFlight = () => topUpAbortRef.current?.abort();
    window.addEventListener("pagehide", abortInFlight);
    window.addEventListener("popstate", abortInFlight);
    return () => {
      mountedRef.current = false;
      abortInFlight();
      window.removeEventListener("pagehide", abortInFlight);
      window.removeEventListener("popstate", abortInFlight);
    };
  }, []);

  function cancelTopUp() {
    topUpAbortRef.current?.abort();
    topUpAbortRef.current = null;
    topUpLock.current = false;
    setBusy("");
  }

  async function topUp(amountSen: number) {
    if (topUpLock.current || busy) return;
    topUpLock.current = true;
    setBusy("topup");
    setError("");
    const controller = new AbortController();
    topUpAbortRef.current = controller;
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountSen }),
        signal: controller.signal,
      });
      const row = (await res.json()) as { error?: string; redirectUrl?: string };
      if (
        !canFollowPayRedirect({
          mounted: mountedRef.current,
          aborted: controller.signal.aborted,
        })
      ) {
        return;
      }
      if (!res.ok) {
        topUpLock.current = false;
        setBusy("");
        setError(translateApiError(locale, row.error, "errorGeneric"));
        return;
      }
      if (row.redirectUrl) {
        if (
          !canFollowPayRedirect({
            mounted: mountedRef.current,
            aborted: controller.signal.aborted,
          })
        ) {
          return;
        }
        window.location.assign(row.redirectUrl);
        return;
      }
      topUpLock.current = false;
      setBusy("");
    } catch (err) {
      if (isAbortError(err) || !mountedRef.current) {
        topUpLock.current = false;
        if (mountedRef.current) setBusy("");
        return;
      }
      topUpLock.current = false;
      setBusy("");
      setError(translateApiError(locale, err instanceof Error ? err.message : "", "errorGeneric"));
    }
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
      <div className="rounded-md border border-[var(--front-border)] bg-white px-5 py-8">
        <h1 className="font-serif text-[22px] font-semibold">{t("walletTitle")}</h1>
        <p className="mt-2 text-[13px] text-[#777]">{t("referralWithdrawNeedLogin")}</p>
        <Link href="/login?next=/wallet" className="mt-4 inline-block text-[14px] text-[#8a5a20]">
          {t("login")}
        </Link>
      </div>
    );
  }
  if (!data) return <p className="px-4 py-8 text-[13px] text-[#888]">{error || t("loading")}</p>;

  const dateLocale = locale === "en" ? "en-MY" : "zh-CN";

  return (
    <div className="pb-6 md:-mx-6">
      {busy === "topup" ? (
        <PayBusyOverlay title={t("connectingPay")} cancelLabel={t("cancelPay")} onCancel={cancelTopUp} />
      ) : null}
      <section className="border-b border-[var(--front-border)] bg-white px-[22px] py-[26px] md:px-10 md:py-[34px]">
        <h1 className="font-serif text-[22px] font-semibold text-[#333]">{t("walletTitle")}</h1>
        <p className="mt-2 mb-[22px] max-w-[520px] text-[13px] leading-[1.6] text-[#777]">{t("walletIntro")}</p>
        <div className="flex flex-wrap">
          <HeroStat label={t("adminWalletTotal")} value={formatMyrSen(data.totalSen)} big />
          <HeroStat label={t("adminWalletTopUp")} value={formatMyrSen(data.topUpBalanceSen)} />
          <HeroStat label={t("adminWalletCommission")} value={formatMyrSen(data.commissionBalanceSen)} />
          <HeroStat label={t("adminWalletAvailable")} value={formatMyrSen(data.availableToWithdrawSen)} />
        </div>
      </section>

      <div className="mx-auto flex max-w-[1040px] flex-col gap-6 px-4 py-[22px] md:px-6 md:py-7">
        <div className="flex flex-col gap-1.5 text-[12.5px] text-[#888] md:flex-row md:justify-between md:gap-3">
          <span>
            {t("adminWalletPending")}: {formatMyrSen(data.pendingWithdrawalSen)}
          </span>
          <span>{t("walletSpendNote")}</span>
        </div>

        {error ? <p className="text-[13px] text-[#fa3534]">{error}</p> : null}

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("walletTopUp")}</h2>
            <div className="mb-3.5 flex flex-wrap gap-2">
              {TOPUP_PRESETS_SEN.map((sen) => (
                <button
                  key={sen}
                  type="button"
                  disabled={busy === "topup"}
                  onClick={() => topUp(sen)}
                  className="rounded-md border border-[var(--front-border)] bg-[#f5f5f5] px-4 py-2 text-[13.5px] text-[#333]"
                >
                  {formatMyrSen(sen)}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                topUp(Math.round(Number(otherMyr || 0) * 100));
              }}
            >
              <input
                value={otherMyr}
                onChange={(event) => setOtherMyr(event.target.value)}
                type="number"
                min="1"
                step="0.01"
                placeholder={t("walletTopUpOther")}
                className="h-10 min-w-0 flex-1 rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
              />
              <button
                type="submit"
                disabled={busy === "topup"}
                className="h-10 shrink-0 rounded bg-[#8a5a20] px-[18px] text-[13px] whitespace-nowrap text-white disabled:opacity-50"
              >
                {t("walletTopUpSubmit")}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("walletWithdraw")}</h2>
            <form onSubmit={withdraw}>
              <div className="mb-3.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-[12px] text-[#777]">
                  MYR
                  <input
                    name="amountMyr"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={senToMyr(data.availableToWithdrawSen)}
                    required
                    className="mt-1.5 h-10 w-full rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
                  />
                </label>
                <label className="text-[12px] text-[#777]">
                  {t("adminPayoutBank")}
                  <input
                    name="bank"
                    className="mt-1.5 h-10 w-full rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
                  />
                </label>
                <label className="text-[12px] text-[#777]">
                  {t("adminPayoutHolder")}
                  <input
                    name="holder"
                    className="mt-1.5 h-10 w-full rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
                  />
                </label>
                <label className="text-[12px] text-[#777]">
                  {t("adminPayoutAccount")}
                  <input
                    name="account"
                    className="mt-1.5 h-10 w-full rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy === "wd" || data.availableToWithdrawSen < 1}
                className="w-full rounded bg-[#8a5a20] py-3 text-[13.5px] text-white disabled:opacity-50"
              >
                {t("referralWithdrawSubmit")}
              </button>
            </form>
            {data.withdrawals.length > 0 ? (
              <div className="mt-3.5 space-y-2 text-[12.5px] text-[#777]">
                {data.withdrawals.map((row) => (
                  <div key={row.id} className="flex justify-between gap-3">
                    <span>
                      {formatMyrSen(row.amountSen)} · {normalizeWithdrawalStatus(row.status)}
                    </span>
                    <span>{new Date(row.createdAt).toLocaleDateString(dateLocale)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
          <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("walletTx")}</h2>
          {data.transactions.length === 0 ? (
            <p className="text-[13px] text-[#777]">{t("walletTxEmpty")}</p>
          ) : (
            <ol className="relative ml-1 border-l border-[var(--front-border)] pl-[18px]">
              {data.transactions.map((row) => (
                <li key={row.id} className="relative flex items-start justify-between gap-2.5 pb-[18px] last:pb-0">
                  <span className="absolute top-1 -left-[22px] size-[7px] rounded-full bg-[var(--front-accent)]" />
                  <span className="text-[13.5px] text-[#333]">
                    {row.kind}
                    {row.note ? ` · ${row.note}` : ""}
                  </span>
                  <span className="opc-price shrink-0 font-serif text-[14px] font-semibold">{formatMyrSen(row.amountSen)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function HeroStat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="min-w-[40%] flex-1 border-[var(--front-border)] px-3.5 first:border-l-0 first:pl-0 md:min-w-0 md:flex-none md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
      <p className="mb-1 text-[11.5px] text-[#777]">{label}</p>
      <p className={big ? "opc-price font-serif text-[20px] font-bold md:text-[24px]" : "font-serif text-[20px] font-bold text-[#333] md:text-[24px]"}>
        {value}
      </p>
    </div>
  );
}
