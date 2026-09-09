"use client";

import Link from "next/link";
import {
  formatMyrSen,
  formatTierRateLabel,
  MAX_COMMISSION_LEVELS,
  type GenealogyPerson,
  type ReferralChainSlot,
} from "@/lib/referral";
import {
  COMMISSION_STATUS_KEY,
  commissionStatusClass,
  commissionUiStatus,
  t4Plus,
} from "@/lib/commission-ui";
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";

export function ReferralChainDrawer({
  open,
  onClose,
  buyerName,
  orderTitle,
  tiers,
  genealogy,
}: {
  open: boolean;
  onClose: () => void;
  buyerName?: string;
  orderTitle?: string;
  tiers?: ReferralChainSlot[];
  genealogy?: GenealogyPerson[];
}) {
  const t = useT();
  const extra = t4Plus(genealogy);
  if (!open) return null;

  return (
    <div className="admin-drawer-root">
      <button type="button" className="admin-drawer-mask" aria-label={t("close")} onClick={onClose} />
      <aside className="admin-chain-drawer" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2>{t("adminViewFullChain")}</h2>
            <p className="mt-1 text-[13px] text-[var(--mute)]">
              {buyerName || "—"}
              {orderTitle ? ` · ${orderTitle}` : ""}
            </p>
          </div>
          <button type="button" className="jx-btn-ghost" onClick={onClose}>
            {t("close")}
          </button>
        </div>
        <p className="mt-4 text-[12px] text-[var(--gold)]">↑ {buyerName || t("adminColBuyer")}</p>
        <ol className="mt-2 space-y-2">
          {(tiers || []).map((slot) => {
            const status = commissionUiStatus(slot);
            return (
              <li key={slot.tier} className="rounded-md border border-[var(--line)] bg-[var(--paper-dim)] px-3 py-2 text-[13px]">
                <span className="jx-serif">T{slot.tier}</span>{" "}
                {slot.userId ? (
                  <Link href={`/admin/users/${slot.userId}`} className="jx-link">
                    {slot.name} ({slot.code})
                  </Link>
                ) : (
                  <span className="text-[var(--mute)]">—</span>
                )}
                <span className="ml-2 text-[12px] text-[var(--mute)]">
                  {formatTierRateLabel(slot)} · {formatMyrSen(slot.amountSen)}
                </span>
                <span className={`ml-2 ${commissionStatusClass(status)}`}>
                  {t(COMMISSION_STATUS_KEY[status] as MessageKey)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 rounded-md bg-[var(--paper-dim)] px-3 py-2 text-[12px] text-[var(--mute)]">
          {t("adminCommissionLimit")} ({MAX_COMMISSION_LEVELS})
        </p>
        {extra.length ? (
          <ol className="mt-3 space-y-1 text-[13px] text-[var(--mute)]">
            {extra.map((row) => (
              <li key={`${row.depth}-${row.userId}`}>
                T{row.depth}{" "}
                <Link href={`/admin/users/${row.userId}`} className="jx-link">
                  {row.name} ({row.code})
                </Link>{" "}
                {t("adminStatusOverDepth")} · {t("adminNoCommission")}
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
    </div>
  );
}
