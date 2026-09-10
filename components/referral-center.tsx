"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatMyrSen, formatTierRateLabel, senToMyr, type CommissionEntry, type ReferralTierPlan, type Withdrawal } from "@/lib/referral";
import { normalizeWithdrawalStatus } from "@/lib/wallet";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { translateApiError } from "@/lib/messages";

type Dashboard = {
  referralCode: string;
  balanceSen: number;
  pendingSen: number;
  availableSen: number;
  tiers: ReferralTierPlan[];
  earnings: (CommissionEntry & { orderTitle?: string })[];
  team?: { 1: number; 2: number; 3: number };
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
    if (!user) return;
    let cancelled = false;
    fetch("/api/referral/me")
      .then((res) => res.json())
      .then((row: Dashboard) => {
        if (!cancelled && row?.referralCode) setData(row);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return null;
  if (!user) {
    return (
      <section className="border-t border-[var(--front-border)] bg-[var(--front-surface)] px-4 py-5 md:px-10">
        <h2 className="font-serif text-[15px]">{t("referralTitle")}</h2>
        <p className="mt-1 text-[13px] text-[#777]">{t("referralWithdrawNeedLogin")}</p>
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="border-t border-[var(--front-border)] bg-[var(--front-surface-soft)] px-4 py-5 md:px-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-[#777]">{t("referralCodeLabel")}</p>
          <p className="font-serif text-[20px] tracking-wide text-[#3a2c10]">{data.referralCode}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-[#777]">{t("referralBalance")}</p>
          <p className="opc-price text-[20px] text-[#8a5a20]">{formatMyrSen(data.availableSen)}</p>
        </div>
      </div>
      <CopyShare code={data.referralCode} />
    </section>
  );
}

export function ReferralCenter() {
  const { user, loading } = useAuth();
  const { locale, t } = useLocale();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/referral/me")
      .then(async (res) => {
        const row = (await res.json()) as Dashboard & { error?: string };
        if (!res.ok) throw new Error(row.error || t("errorGeneric"));
        if (!cancelled) setData(row);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(translateApiError(locale, err instanceof Error ? err.message : "", "errorGeneric"));
      });
    return () => {
      cancelled = true;
    };
  }, [user, locale, t]);

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
        <p className="mt-3 text-[13px]">
          <Link href="/wallet" className="text-[#8a5a20] underline">
            {t("pageWallet")}
          </Link>
        </p>
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
                {t("referralTierN", { n: tier.tier })} · {formatTierRateLabel(tier)}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[12px] text-[#777]">{t("referralTeam")}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((depth) => (
              <div key={depth} className="rounded-xl bg-[#faf6ee] px-3 py-3 text-center">
                <p className="text-[12px] text-[#777]">
                  {depth === 1 ? t("referralTeamL1") : depth === 2 ? t("referralTeamL2") : t("referralTeamL3")}
                </p>
                <p className="mt-1 font-serif text-[20px] text-[#3a2c10]">
                  {t("referralTeamPeople", { n: data.team?.[depth] ?? 0 })}
                </p>
              </div>
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
                  {withdrawalLabel(normalizeWithdrawalStatus(row.status), t)}
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
                  <p className="font-serif text-[15px] text-[#3a2c10]">
                    {t("referralTierN", { n: row.tier || 1 })} · {formatTierRateLabel(row)}
                  </p>
                  <p className="mt-1 text-[13px] text-[#555]">
                    {row.buyerName || "—"}
                    {row.orderTitle ? ` · ${row.orderTitle}` : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#999]">
                    {row.baseSen ? formatMyrSen(row.baseSen) : ""}
                    {row.orderId ? `${row.baseSen ? " · " : ""}${t("referralOrder")} ${row.orderId.slice(-6)}` : ""}
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

function withdrawalLabel(
  status: "pending" | "approved" | "paid" | "rejected",
  t: (key: "adminWdPending" | "adminWdApproved" | "adminWdPaid" | "adminWdRejected") => string,
) {
  if (status === "paid") return t("adminWdPaid");
  if (status === "approved") return t("adminWdApproved");
  if (status === "rejected") return t("adminWdRejected");
  return t("adminWdPending");
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
