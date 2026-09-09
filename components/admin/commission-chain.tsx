"use client";

import Link from "next/link";
import {
  formatMyrSen,
  formatTierRateLabel,
  MAX_COMMISSION_LEVELS,
  type GenealogyPerson,
  type ReferralChainSlot,
  type ReferralTierPlan,
} from "@/lib/referral";
import { useT } from "@/components/locale-provider";

export function CommissionChain({
  tiers,
  genealogy,
  plan,
}: {
  tiers?: ReferralChainSlot[];
  genealogy?: GenealogyPerson[];
  plan?: ReferralTierPlan[];
}) {
  const t = useT();
  const paidIds = new Set((tiers || []).filter((row) => row.userId).map((row) => `${row.tier}:${row.userId}`));
  const extra = (genealogy || []).filter((row) => row.depth > MAX_COMMISSION_LEVELS);

  return (
    <ol className="mt-2 space-y-1.5 text-[13px]">
      {(tiers || []).map((slot) => (
        <li
          key={`t-${slot.tier}`}
          className="rounded-md border border-[var(--line)] bg-[var(--paper-dim)] px-3 py-2"
        >
          <span className="jx-serif">T{slot.tier}</span>{" "}
          {slot.userId ? (
            <Link href={`/admin/users/${slot.userId}`} className="jx-link">
              {slot.name} ({slot.code})
            </Link>
          ) : (
            <span className="text-[var(--mute)]">—</span>
          )}
          <span className="ml-2 text-[12px] text-[var(--mute)]">
            {formatTierRateLabel(slot)} · {formatMyrSen(slot.amountSen)} ·{" "}
            {slot.paid ? t("adminCredited") : t("adminNotCredited")}
          </span>
        </li>
      ))}
      {extra.map((row) => (
        <li key={`g-${row.depth}-${row.userId}`} className="px-3 py-1 text-[var(--mute)]">
          T{row.depth}{" "}
          <Link href={`/admin/users/${row.userId}`} className="jx-link">
            {row.name} ({row.code})
          </Link>
          <span className="ml-2">{t("adminNoCommission")}</span>
          {plan ? null : null}
          {!paidIds.has(`${row.depth}:${row.userId}`) ? null : null}
        </li>
      ))}
    </ol>
  );
}
