"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionPresence } from "@/components/motion-presence";
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
  const [view, setView] = useState({ buyerName, orderTitle, tiers, genealogy });
  if (open && (view.buyerName !== buyerName || view.orderTitle !== orderTitle || view.tiers !== tiers || view.genealogy !== genealogy)) {
    setView({ buyerName, orderTitle, tiers, genealogy });
  }
  const extra = t4Plus(view.genealogy);

  return (
    <MotionPresence open={open} className="admin-drawer-root">
      <button type="button" className="admin-drawer-mask" aria-label={t("close")} onClick={onClose} />
      <aside
        className="admin-chain-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-chain-title"
        tabIndex={-1}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="admin-chain-head">
          <div>
            <h2 id="admin-chain-title">{t("adminViewFullChain")}</h2>
            <p className="admin-chain-sub">
              {view.buyerName || "—"}
              {view.orderTitle ? ` · ${view.orderTitle}` : ""}
            </p>
          </div>
          <button type="button" className="jx-btn-ghost" onClick={onClose}>
            {t("close")}
          </button>
        </div>

        <ol className="admin-chain-spine">
          <li className="admin-chain-buyer">
            <span className="admin-chain-mark">↑</span>
            <div>
              <p className="admin-chain-kicker">{t("adminColBuyer")}</p>
              <p>{view.buyerName || "—"}</p>
            </div>
          </li>
          {(view.tiers || []).map((slot) => {
            const status = commissionUiStatus(slot);
            return (
              <li key={slot.tier} className="admin-chain-node">
                <span className="admin-chain-mark">T{slot.tier}</span>
                <div className="admin-chain-body">
                  {slot.userId ? (
                    <Link href={`/admin/users/${slot.userId}`} className="jx-link">
                      {slot.name}
                      {slot.code ? <span className="admin-chain-code"> {slot.code}</span> : null}
                    </Link>
                  ) : (
                    <span className="text-[var(--mute)]">—</span>
                  )}
                  <p className="admin-chain-meta">
                    {formatTierRateLabel(slot)} · {formatMyrSen(slot.amountSen)}
                  </p>
                </div>
                <span className={commissionStatusClass(status)}>{t(COMMISSION_STATUS_KEY[status] as MessageKey)}</span>
              </li>
            );
          })}
        </ol>

        <p className="admin-chain-limit">
          {t("adminCommissionLimit")} ({MAX_COMMISSION_LEVELS})
        </p>

        {extra.length ? (
          <ol className="admin-chain-beyond">
            {extra.map((row) => (
              <li key={`${row.depth}-${row.userId}`}>
                <span className="admin-chain-mark is-mute">T{row.depth}</span>
                <Link href={`/admin/users/${row.userId}`} className="jx-link">
                  {row.name}
                  {row.code ? <span className="admin-chain-code"> {row.code}</span> : null}
                </Link>
                <span className="jx-chip">{t("adminStatusOverDepth")}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
    </MotionPresence>
  );
}
