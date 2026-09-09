"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatMyrSen, senToMyr, type CommissionEntry, type ReferralTierPlan, type Withdrawal } from "@/lib/referral";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

type Dashboard = {
  referralCode: string;
  balanceSen: number;
  pendingSen: number;
  availableSen: number;
  tiers: ReferralTierPlan[];
  earnings: CommissionEntry[];
  downline: { id: string; name: string; createdAt: string }[];
  withdrawals: Withdrawal[];
};

function shareUrl(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
}

export function ReferralSummary() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    fetch("/api/referral/me")
      .then((res) => res.json())
      .then((row: Dashboard) => {
        if (row?.referralCode) setData(row);
      })
      .catch(() => undefined);
  }, [user]);

  if (loading) return null;
  if (!user) {
    return (
      <section className="border-t border-[#f3eee4] bg-white px-3 py-4 md:px-8">
        <h2 className="font-serif text-[15px]">{t("referralTitle")}</h2>
        <p className="mt-1 text-[13px] text-[#777]">{t("referralWithdrawNeedLogin")}</p>
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="border-t border-[#f3eee4] bg-[#fffdf8] px-3 py-4 md:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[15px]">{t("referralTitle")}</h2>
          <p className="mt-1 text-[12px] text-[#777]">{t("referralCodeLabel")}</p>
          <p className="font-serif text-[20px] tracking-wide text-[#3a2c10]">{data.referralCode}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-[#777]">{t("referralBalance")}</p>
          <p className="opc-price text-[20px] text-[#8a5a20]">{formatMyrSen(data.availableSen)}</p>
        </div>
      </div>
      <CopyShare code={data.referralCode} />
      <Link href="/agent" className="mt-3 inline-block text-[13px] text-[#8a5a20]">
        {t("mineAgent")} →
      </Link>
    </section>
  );
}

export function ReferralCenter() {
  const { user, loading } = useAuth();
  const { locale, t } = useLocale();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/referral/me");
    const row = (await res.json()) as Dashboard & { error?: string };
    if (!res.ok) throw new Error(row.error || t("errorGeneric"));
    setData(row);
  }, [t]);

  useEffect(() => {
    if (!user) return;
    load().catch((err) => setError(translateApiError(locale, err instanceof Error ? err.message : "", "errorGeneric")));
  }, [user, load, locale]);

  async function withdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/referral/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMyr: Number(form.get("amountMyr") || 0) }),
    });
    const row = (await res.json()) as Dashboard & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(locale, row.error, "errorGeneric"));
      return;
    }
    setData(row);
    toast.success(t("saved"));
    (event.currentTarget as HTMLFormElement).reset();
  }

  if (loading) {
    return <p className="px-4 py-8 text-[13px] text-[#888]">{t("loading")}</p>;
  }
  if (!user) {
    return (
      <div className="rounded-2xl bg-white px-5 py-8">
        <h1 className="font-serif text-[24px]">{t("agentTitle")}</h1>
        <p className="mt-2 text-[13px] text-[#666]">{t("referralWithdrawNeedLogin")}</p>
        <Link href="/login?next=/agent" className="mt-4 inline-block text-[14px] text-[#8a5a20]">
          {t("login")}
        </Link>
      </div>
    );
  }
  if (!data) {
    return <p className="px-4 py-8 text-[13px] text-[#888]">{error || t("loading")}</p>;
  }

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h1 className="font-serif text-[24px]">{t("agentTitle")}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#666]">{t("agentBody")}</p>
        <p className="mt-4 text-[12px] text-[#777]">{t("referralCodeLabel")}</p>
        <p className="font-serif text-[28px] tracking-wide text-[#3a2c10]">{data.referralCode}</p>
        <CopyShare code={data.referralCode} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#faf6ee] px-3 py-3">
            <p className="text-[12px] text-[#777]">{t("referralBalance")}</p>
            <p className="opc-price mt-1 text-[22px] text-[#8a5a20]">{formatMyrSen(data.availableSen)}</p>
          </div>
          <div className="rounded-xl bg-[#faf6ee] px-3 py-3">
            <p className="text-[12px] text-[#777]">{t("referralPending")}</p>
            <p className="opc-price mt-1 text-[22px] text-[#3a2c10]">{formatMyrSen(data.pendingSen)}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[12px] text-[#777]">{t("referralTiers")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.tiers.map((tier) => (
              <span key={tier.tier} className="rounded-full bg-[#f3ead8] px-3 py-1 text-[12px] text-[#8a5a20]">
                {t("referralTierN", { n: tier.tier })} · {t("referralTierRate", { n: tier.ratePercent })}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("referralWithdraw")}</h2>
        <p className="mt-1 text-[13px] text-[#777]">{t("referralWithdrawHint")}</p>
        {error ? <p className="mt-2 text-[13px] text-[#fa3534]">{error}</p> : null}
        <form onSubmit={withdraw} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-[13px]">
            MYR
            <input
              name="amountMyr"
              type="number"
              min="0.01"
              step="0.01"
              max={senToMyr(data.availableSen)}
              required
              className="mt-1 h-10 w-36 rounded-md border border-[#eadfca] px-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy || data.availableSen < 1}
            className="h-10 rounded-md bg-[#8a5a20] px-4 text-[14px] text-white disabled:opacity-50"
          >
            {busy ? t("pleaseWait") : t("referralWithdrawSubmit")}
          </button>
        </form>
        {data.withdrawals.length > 0 ? (
          <ul className="mt-4 space-y-2 text-[13px]">
            {data.withdrawals.map((row) => (
              <li key={row.id} className="flex justify-between gap-3 border-t border-[#f3eee4] pt-2">
                <span>
                  {formatMyrSen(row.amountSen)} ·{" "}
                  {row.status === "settled"
                    ? t("referralStatusSettled")
                    : row.status === "rejected"
                      ? t("referralStatusRejected")
                      : t("referralStatusRequested")}
                </span>
                <span className="text-[#999]">{new Date(row.createdAt).toLocaleDateString(locale === "en" ? "en-MY" : "zh-CN")}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("referralHistory")}</h2>
        {data.earnings.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#777]">{t("referralHistoryEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.earnings.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 border-b border-[#f3eee4] pb-3 last:border-0">
                <div>
                  <p className="text-[14px]">
                    {t("referralTierN", { n: row.tier || 1 })} · {t("referralTierRate", { n: row.ratePercent || 0 })}
                  </p>
                  <p className="mt-1 text-[12px] text-[#888]">
                    {t("referralBuyer")}: {row.buyerName || "—"}
                    {row.orderId ? ` · ${t("referralOrder")} ${row.orderId.slice(-6)}` : ""}
                  </p>
                </div>
                <p className="opc-price text-[16px] text-[#8a5a20]">{formatMyrSen(row.amountSen)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white px-4 py-5 md:px-6">
        <h2 className="font-serif text-[18px]">{t("referralDownline")}</h2>
        {data.downline.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#777]">{t("referralDownlineEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-[14px]">
            {data.downline.map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span>{row.name}</span>
                <span className="text-[12px] text-[#999]">
                  {new Date(row.createdAt).toLocaleDateString(locale === "en" ? "en-MY" : "zh-CN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CopyShare({ code }: { code: string }) {
  const { t } = useLocale();
  const link = shareUrl(code);

  async function copy() {
    await navigator.clipboard.writeText(code);
    toast.success(t("copied"));
  }

  async function share() {
    const url = shareUrl(code);
    try {
      if (navigator.share) {
        await navigator.share({ title: t("agentTitle"), url, text: code });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(url);
    toast.success(t("referralCopiedLink"));
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={copy} className="rounded-md bg-[#f3ead8] px-3 py-1.5 text-[13px] text-[#8a5a20]">
        {t("copy")}
      </button>
      <button type="button" onClick={share} className="rounded-md bg-[#8a5a20] px-3 py-1.5 text-[13px] text-white">
        {t("referralShare")}
      </button>
      {link ? <span className="sr-only">{link}</span> : null}
    </div>
  );
}
