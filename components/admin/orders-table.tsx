"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { isOrderPaid, type Order } from "@/lib/account";
import { formatMoneyAmount, type Currency } from "@/lib/currency";
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
  orderCommissionSummary,
  payMethodLabel,
} from "@/lib/commission-ui";
import { ReferralChainDrawer } from "@/components/admin/referral-chain-drawer";
import { adminOrderKind, isRefVerifyOrder, publicOrderNo } from "@/lib/orders-ui";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/messages";

type AdminOrder = Order & {
  userName?: string;
  userAccount?: string;
};

type Filter = "all" | "customer" | "internal";

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const t = useT();
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [chain, setChain] = useState<AdminOrder | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "internal") return orders.filter((order) => isRefVerifyOrder(order));
    if (filter === "customer") return orders.filter((order) => !isRefVerifyOrder(order));
    return orders;
  }, [filter, orders]);

  function toggle(id: string) {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function kindLabel(order: AdminOrder) {
    const kind = adminOrderKind(order);
    if (kind === "refverify") return t("adminOrderRefVerify");
    if (kind === "demo") return t("adminOrderDemo");
    if (kind === "grant") return t("adminOrderGrant");
    return null;
  }

  return (
    <>
      <div className="jx-order-filters">
        {(
          [
            ["all", "adminOrderFilterAll"],
            ["customer", "adminOrderFilterCustomer"],
            ["internal", "adminOrderFilterInternal"],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            className={cn("jx-chip", filter === id && "is-on")}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="jx-panel mt-4 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t("adminOrderCourse")}</th>
              <th>学员</th>
              <th>金额</th>
              <th>状态</th>
              <th>{t("adminColPayMethod")}</th>
              <th>{t("adminColCommission")}</th>
              <th>课程码</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7}>暂无订单。</td>
              </tr>
            ) : (
              visible.flatMap((order) => {
                const summary = orderCommissionSummary(order);
                const expanded = openIds.includes(order.id);
                const payTiers = (order.referralSettled?.tiers || []).filter(
                  (slot) => slot.tier <= MAX_COMMISSION_LEVELS,
                );
                const canExpand = isOrderPaid(order) && payTiers.length > 0;
                const publicNo = publicOrderNo(order);
                const badge = kindLabel(order);
                const rows = [
                  <tr key={order.id} className={expanded ? "is-open-order" : undefined}>
                    <td>
                      {publicNo ? (
                        <Link href={`/admin/orders/${order.id}`} className="jx-order-public">
                          {publicNo}
                        </Link>
                      ) : (
                        <Link href={`/admin/orders/${order.id}`} className="jx-order-public">
                          {badge}
                        </Link>
                      )}
                      {badge && publicNo ? <span className="jx-chip ml-2 align-middle">{badge}</span> : null}
                      <p className="jx-order-course">{order.productTitle}</p>
                      {!publicNo ? <p className="jx-order-tech">{order.id}</p> : null}
                    </td>
                    <td>
                      <Link href={`/admin/users/${order.userId}`} className="jx-link">
                        {order.userName}
                      </Link>
                      <span className="block text-[12px] text-[var(--mute)]">{order.userAccount}</span>
                    </td>
                    <td className="jx-price">
                      {formatMoneyAmount(order.price, (order.currency as Currency) || "CNY")}
                      {order.amountMyr != null ? (
                        <span className="ml-1 text-[12px] font-sans font-normal text-[var(--mute)]">
                          / {formatMoneyAmount(order.amountMyr, "MYR")}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className={isOrderPaid(order) ? "jx-chip jx-chip-ok" : "jx-chip jx-chip-wait"}>
                        {isOrderPaid(order) ? "已支付" : "待付款"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[13px] text-[var(--mute)]">
                      {payMethodLabel(order.payMethod)}
                    </td>
                    <td>
                      {canExpand ? (
                        <button
                          type="button"
                          className="jx-comm-sum"
                          aria-expanded={expanded}
                          onClick={() => toggle(order.id)}
                        >
                          <span>{summary.text}</span>
                          <ChevronRight size={14} className={cn("jx-comm-chevron", expanded && "is-open")} />
                        </button>
                      ) : (
                        <span className="jx-comm-quiet">{summary.text}</span>
                      )}
                    </td>
                    <td className="font-mono text-[12px] text-[var(--gold)]">{order.verifyCode || "—"}</td>
                  </tr>,
                ];
                if (canExpand && order.referralSettled) {
                  rows.push(
                    <tr key={`${order.id}-detail`} className="jx-order-detail">
                      <td colSpan={7}>
                        <div className={cn("jx-expand", expanded && "is-open")}>
                        <div className="jx-expand-inner">
                        <table className="jx-mini">
                          <thead>
                            <tr>
                              <th>{t("adminColTier")}</th>
                              <th>{t("adminColEarner")}</th>
                              <th>{t("adminReferralRate")}</th>
                              <th>{t("adminColCommission")}</th>
                              <th>{t("adminColStatus")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payTiers.map((slot) => {
                              const status = commissionUiStatus(slot);
                              return (
                                <tr key={`${order.id}-${slot.tier}`}>
                                  <td>T{slot.tier}</td>
                                  <td>
                                    {slot.userId ? (
                                      <Link href={`/admin/users/${slot.userId}`} className="jx-link">
                                        {slot.name}
                                      </Link>
                                    ) : (
                                      <span className="text-[var(--mute)]">—</span>
                                    )}
                                  </td>
                                  <td>{formatTierRateLabel(slot)}</td>
                                  <td className="jx-num">{formatMyrSen(slot.amountSen)}</td>
                                  <td>
                                    <span className={commissionStatusClass(status)}>
                                      {t(COMMISSION_STATUS_KEY[status] as MessageKey)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <button type="button" className="jx-link jx-chain-link" onClick={() => setChain(order)}>
                          {t("adminViewFullChain")}
                        </button>
                        </div>
                        </div>
                      </td>
                    </tr>,
                  );
                }
                return rows;
              })
            )}
          </tbody>
        </table>
      </div>
      <ReferralChainDrawer
        open={Boolean(chain)}
        onClose={() => setChain(null)}
        buyerName={chain?.userName}
        orderTitle={chain?.productTitle}
        tiers={chain?.referralSettled?.tiers as ReferralChainSlot[] | undefined}
        genealogy={chain?.referralSettled?.genealogy as GenealogyPerson[] | undefined}
      />
    </>
  );
}
