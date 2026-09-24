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
      <section className="border-t border-[var(--front-border)] bg-[var(--front-surface)] p-8">
        <h2 className="font-serif text-[15px]">{t("referralTitle")}</h2>
        <p className="mt-1 text-[13px] text-[#777]">{t("referralWithdrawNeedLogin")}</p>
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="border-t border-[var(--front-border)] bg-white p-8">
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
      <div className="rounded-md border border-[var(--front-border)] bg-white px-5 py-8">
        <h1 className="font-serif text-[22px] font-semibold">{t("agentTitle")}</h1>
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

  const teamTotal = (data.team?.[1] ?? 0) + (data.team?.[2] ?? 0) + (data.team?.[3] ?? 0);
  const dateLocale = locale === "en" ? "en-MY" : "zh-CN";

  return (
    <div className="pb-6 md:-mx-6">
      <section className="flex flex-col gap-6 border-b border-[var(--front-border)] bg-white px-[22px] py-[26px] md:flex-row md:items-center md:justify-between md:px-10 md:py-[34px]">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-[#333]">{t("agentTitle")}</h1>
          <p className="mt-1.5 max-w-[440px] text-[13px] leading-[1.6] text-[#777]">{t("agentBody")}</p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-5 md:w-auto md:justify-end md:gap-[22px]">
          <div>
            <p className="mb-1 text-[11.5px] text-[#777]">{t("referralCodeLabel")}</p>
            <p className="font-serif text-[19px] font-bold tracking-wide text-[#3a2c10] md:text-[22px]">{data.referralCode}</p>
          </div>
          <CopyShare code={data.referralCode} variant="hero" />
        </div>
      </section>

      <div className="mx-auto flex max-w-[1040px] flex-col gap-6 px-4 py-[22px] md:px-6 md:py-7">
        <div className="grid grid-cols-1 divide-y divide-[var(--front-border)] overflow-hidden rounded-lg border border-[var(--front-border)] bg-[var(--front-border)] md:grid-cols-3 md:gap-px md:divide-y-0">
          <StatCell label={t("referralBalance")} value={formatMyrSen(data.availableSen)} money />
          <StatCell label={t("referralPending")} value={formatMyrSen(data.pendingSen)} money />
          <StatCell label={t("referralTeamTotal")} value={t("referralTeamPeople", { n: teamTotal })} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("referralTeam")}</h2>
            <div className="flex flex-col gap-3">
              {([1, 2, 3] as const).map((depth) => (
                <div key={depth} className="flex items-center justify-between rounded-md bg-[#faf6ee] px-3.5 py-3">
                  <span className="text-[13.5px] text-[#333]">
                    {depth === 1 ? t("referralTeamL1") : depth === 2 ? t("referralTeamL2") : t("referralTeamL3")}
                  </span>
                  <span className="font-serif text-[16px] font-semibold text-[#3a2c10]">
                    {t("referralTeamPeople", { n: data.team?.[depth] ?? 0 })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("referralTiers")}</h2>
            <div className="mb-[18px] flex flex-wrap gap-2">
              {data.tiers.map((tier) => (
                <span key={tier.tier} className="rounded-full bg-[#f3ead8] px-3.5 py-1 text-[12.5px] text-[#8a5a20]">
                  {t("referralTierN", { n: tier.tier })} · {formatTierRateLabel(tier)}
                </span>
              ))}
            </div>
            <h2 className="mb-3 font-serif text-[14px] font-semibold text-[#333]">{t("referralWithdraw")}</h2>
            {error ? <p className="mb-2 text-[13px] text-[#fa3534]">{error}</p> : null}
            <form onSubmit={withdraw} className="flex gap-2">
              <input
                name="amountMyr"
                type="number"
                min="0.01"
                step="0.01"
                max={senToMyr(data.availableSen)}
                required
                placeholder="MYR"
                className="h-10 min-w-0 flex-1 rounded border border-[var(--front-border)] bg-white px-3 text-[13.5px] text-[#333]"
              />
              <button
                type="submit"
                disabled={busy || data.availableSen < 1}
                className="h-10 shrink-0 rounded bg-[#8a5a20] px-[18px] text-[13px] whitespace-nowrap text-white disabled:opacity-50"
              >
                {busy ? t("pleaseWait") : t("referralWithdrawSubmit")}
              </button>
            </form>
            {data.withdrawals.length > 0 ? (
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#777]">
                {data.withdrawals.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span>
                      {formatMyrSen(row.amountSen)} · {withdrawalLabel(normalizeWithdrawalStatus(row.status), t)}
                    </span>
                    <span>{new Date(row.createdAt).toLocaleDateString(dateLocale)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("referralHistory")}</h2>
            {data.earnings.length === 0 ? (
              <p className="text-[13px] text-[#777]">{t("referralHistoryEmpty")}</p>
            ) : (
              <ol className="relative ml-1 border-l border-[var(--front-border)] pl-[18px]">
                {data.earnings.map((row) => (
                  <li key={row.id} className="relative pb-5 last:pb-0">
                    <span className="absolute top-1 -left-[22px] size-[7px] rounded-full bg-[var(--front-accent)]" />
                    <p className="mb-0.5 text-[13.5px] text-[#333]">
                      {t("referralTierN", { n: row.tier || 1 })} · {formatTierRateLabel(row)}
                    </p>
                    <p className="mb-0.5 text-[12px] text-[#777]">
                      {row.buyerName || "—"}
                      {row.orderTitle ? ` · ${row.orderTitle}` : ""}
                    </p>
                    <p className="mb-0.5 text-[12px] text-[#777]">
                      {row.baseSen ? formatMyrSen(row.baseSen) : ""}
                      {row.orderId ? `${row.baseSen ? " · " : ""}${t("referralOrder")} ${row.orderId.slice(-6)}` : ""}
                    </p>
                    <p className="opc-price font-serif text-[14.5px] font-semibold">{formatMyrSen(row.amountSen)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-lg border border-[var(--front-border)] bg-white px-4 py-[18px] md:px-6 md:py-[22px]">
            <h2 className="mb-4 font-serif text-[16px] font-semibold text-[#333]">{t("referralDownline")}</h2>
            {data.downline.length === 0 ? (
              <p className="text-[13px] text-[#777]">{t("referralDownlineEmpty")}</p>
            ) : (
              <ul>
                {data.downline.map((row) => (
                  <li
                    key={row.id}
                    className="flex justify-between gap-3 border-b border-[var(--front-border)] py-2.5 text-[13.5px] last:border-b-0"
                  >
                    <span>{row.name}</span>
                    <span className="text-[12.5px] text-[#777]">
                      {new Date(row.createdAt).toLocaleDateString(dateLocale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="bg-white px-[22px] py-5">
      <p className="mb-1.5 text-[12px] text-[#777]">{label}</p>
      <p className={money ? "opc-price font-serif text-[20px] font-semibold" : "font-serif text-[20px] font-semibold text-[#3a2c10]"}>
        {value}
      </p>
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

function CopyShare({ code, stretch, variant }: { code: string; stretch?: boolean; variant?: "default" | "stretch" | "hero" }) {
  const { t } = useLocale();
  const link = shareUrl(code);
  const mode = variant || (stretch ? "stretch" : "default");

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

  const wrap =
    mode === "hero"
      ? "flex gap-2 max-[420px]:w-full max-[420px]:flex-col"
      : mode === "stretch"
        ? "flex w-full gap-2"
        : "mt-3 flex flex-wrap gap-2";
  const ghost =
    mode === "hero"
      ? "rounded bg-[#f3ead8] px-4 py-[9px] text-[12.5px] text-[#8a5a20] max-[420px]:w-full max-[420px]:text-center"
      : mode === "stretch"
        ? "flex-1 rounded-md bg-[#f3ead8] px-3 py-1.5 text-[12.5px] text-[#8a5a20]"
        : "rounded-md bg-[#f3ead8] px-3 py-1.5 text-[13px] text-[#8a5a20]";
  const solid =
    mode === "hero"
      ? "rounded bg-[#8a5a20] px-4 py-[9px] text-[12.5px] text-white max-[420px]:w-full max-[420px]:text-center"
      : mode === "stretch"
        ? "flex-1 rounded-md bg-[#8a5a20] px-3 py-1.5 text-[12.5px] text-white"
        : "rounded-md bg-[#8a5a20] px-3 py-1.5 text-[13px] text-white";

  return (
    <div className={wrap}>
      <button type="button" onClick={copy} className={ghost}>
        {t("copy")}
      </button>
      <button type="button" onClick={share} className={solid}>
        {t("referralShare")}
      </button>
      {link ? <span className="sr-only">{link}</span> : null}
    </div>
  );
}

export function ReferralSidebarCards() {
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

  if (loading || !user || !data) return null;

  return (
    <>
      <section className="rounded-md border border-[var(--front-border)] bg-white px-5 py-[18px]">
        <p className="mb-2 text-[12px] text-[#777]">{t("referralCodeLabel")}</p>
        <p className="mb-3 font-serif text-[19px] font-semibold tracking-wide text-[#3a2c10]">{data.referralCode}</p>
        <CopyShare code={data.referralCode} stretch />
      </section>
      <section className="rounded-md border border-[var(--front-border)] bg-white px-5 py-[18px]">
        <p className="mb-2 text-[12px] text-[#777]">{t("referralBalance")}</p>
        <p className="opc-price font-serif text-[24px] font-bold text-[#8a5a20]">{formatMyrSen(data.availableSen)}</p>
      </section>
    </>
  );
}
