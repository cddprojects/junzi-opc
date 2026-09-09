"use client";

import { useEffect, useState } from "react";
import { DEFAULT_REFERRAL_PLAN, senToMyr, myrToSen, type ReferralPlan } from "@/lib/referral";
import { useLocale } from "@/components/locale-provider";

export function ReferralPlanForm() {
  const { t } = useLocale();
  const [plan, setPlan] = useState<ReferralPlan>(DEFAULT_REFERRAL_PLAN);
  const [cap, setCap] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/referral")
      .then((res) => res.json())
      .then((data: ReferralPlan) => {
        if (data?.tiers) {
          setPlan(data);
          setCap(data.maxPayoutSen ? String(senToMyr(data.maxPayoutSen)) : "");
        }
      })
      .catch(() => setError(t("errorGeneric")));
  }, [t]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const maxPayoutSen = cap.trim() ? myrToSen(Number(cap)) : null;
    const res = await fetch("/api/admin/referral", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...plan, maxPayoutSen }),
    });
    const data = (await res.json()) as ReferralPlan & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t("errorGeneric"));
      return;
    }
    setPlan(data);
    setCap(data.maxPayoutSen ? String(senToMyr(data.maxPayoutSen)) : "");
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <h1>{t("adminReferral")}</h1>
      <p className="jx-lede">{t("adminReferralIntro")}</p>
      {error ? <p className="text-[13px] text-[var(--seal)]">{error}</p> : null}
      {saved ? <p className="text-[13px] text-[var(--green)]">{t("saved")}</p> : null}

      <div className="jx-panel overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t("adminReferralTier", { n: "#" })}</th>
              <th>{t("adminReferralType")}</th>
              <th>{t("adminReferralRate")}</th>
              <th>{t("adminReferralActive")}</th>
            </tr>
          </thead>
          <tbody>
            {plan.tiers.map((tier, index) => (
              <tr key={tier.tier}>
                <td className="jx-serif">{t("adminReferralTier", { n: tier.tier })}</td>
                <td>
                  <select
                    value={tier.type}
                    onChange={() => undefined}
                    className="h-9 rounded-md border border-[var(--line)] bg-white px-2"
                  >
                    <option value="percentage">{t("adminReferralPercent")}</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={tier.ratePercent}
                    onChange={(event) => {
                      const next = [...plan.tiers];
                      next[index] = { ...tier, ratePercent: Number(event.target.value) };
                      setPlan({ ...plan, tiers: next });
                    }}
                    className="h-9 w-24 rounded-md border border-[var(--line)] px-2"
                  />
                </td>
                <td>
                  <label className="inline-flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={tier.active}
                      onChange={(event) => {
                        const next = [...plan.tiers];
                        next[index] = { ...tier, active: event.target.checked };
                        setPlan({ ...plan, tiers: next });
                      }}
                    />
                    {t("adminReferralActive")}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="flex items-start gap-2 text-[13px]">
        <input
          type="checkbox"
          className="mt-1"
          checked={plan.compression}
          onChange={(event) => setPlan({ ...plan, compression: event.target.checked })}
        />
        <span>{t("adminReferralCompression")}</span>
      </label>

      <label className="block text-[13px]">
        {t("adminReferralCap")}
        <input
          value={cap}
          onChange={(event) => setCap(event.target.value)}
          type="number"
          min="0"
          step="0.01"
          className="mt-1 h-9 w-full max-w-xs rounded-md border border-[var(--line)] px-3"
        />
      </label>

      <button type="submit" disabled={busy} className="jx-btn">
        {busy ? t("saving") : t("adminReferralSave")}
      </button>
    </form>
  );
}
