"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTierRateLabel, type DownlineNode, type ReferralTierPlan } from "@/lib/referral";
import { useT } from "@/components/locale-provider";

export function DownlineTree({
  nodes,
  rates,
  lazyAfter = 2,
}: {
  nodes: DownlineNode[];
  rates: ReferralTierPlan[];
  lazyAfter?: number;
}) {
  return (
    <ul className="mt-1 space-y-1 text-[13px]">
      {nodes.map((node) => (
        <DownlineNodeRow key={node.userId} node={node} rates={rates} lazyAfter={lazyAfter} />
      ))}
    </ul>
  );
}

function DownlineNodeRow({
  node,
  rates,
  lazyAfter,
}: {
  node: DownlineNode;
  rates: ReferralTierPlan[];
  lazyAfter: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(node.depth <= lazyAfter);
  return (
    <li>
      {node.children.length > 0 ? (
        <button type="button" className="mr-1 text-[12px] text-[var(--gold)]" onClick={() => setOpen((v) => !v)}>
          {open ? "−" : "+"}
        </button>
      ) : (
        <span className="mr-1 inline-block w-3" />
      )}
      L{node.depth}{" "}
      <Link href={`/admin/users/${node.userId}`} className="jx-link">
        {node.name} ({node.code})
        {node.status === "disabled" ? ` · ${t("adminReasonInactive")}` : ""}
      </Link>
      <span className="ml-1 text-[12px] text-[var(--mute)]">
        {node.payable
          ? t("adminPaysSpec", {
              spec: formatTierRateLabel(rates.find((row) => row.tier === node.depth) || { ratePercent: 0 }),
            })
          : t("adminNoCommission")}
      </span>
      {node.children.length > 0 ? (
        <div className={open ? "jx-expand is-open" : "jx-expand"}>
          <div className="jx-expand-inner ml-4 border-l border-[var(--line)] pl-3">
            <DownlineTree nodes={node.children} rates={rates} lazyAfter={lazyAfter} />
          </div>
        </div>
      ) : null}
    </li>
  );
}
