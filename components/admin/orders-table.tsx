"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useT } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/messages";

type AdminOrder = Order & {
  userName?: string;
  userAccount?: string;
};

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const t = useT();
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [chain, setChain] = useState<AdminOrder | null>(null);

  function toggle(id: string) {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <>
      <div className="jx-panel mt-6 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>课程</th>
              <th>学员</th>
              <th>金额</th>
              <th>状态</th>
              <th>{t("adminColPayMethod")}</th>
              <th>{t("adminColCommission")}</th>
              <th>课程码</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7}>暂无订单。</td>
              </tr>
            ) : (
              orders.flatMap((order) => {
                const summary = orderCommissionSummary(order);
                const expanded = openIds.includes(order.id);
                const payTiers = (order.referralSettled?.tiers || []).filter(
                  (slot) => slot.tier <= MAX_COMMISSION_LEVELS,
                );
                const canExpand = isOrderPaid(order) && payTiers.length > 0;
                const rows = [
                  <tr key={order.id}>
                    <td>{order.productTitle}</td>
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
                        <button type="button" className="jx-link" onClick={() => toggle(order.id)}>
                          {expanded ? "▾ " : "› "}
                          {summary.text}
                        </button>
                      ) : (
                        <span className="text-[13px] text-[var(--mute)]">{summary.text}</span>
                      )}
                    </td>
                    <td className="font-mono text-[12px] text-[var(--gold)]">{order.verifyCode || "—"}</td>
                  </tr>,
                ];
                if (expanded && order.referralSettled) {
                  rows.push(
                    <tr key={`${order.id}-detail`} className="jx-order-detail">
                      <td colSpan={7}>
                        <table className="jx-table">
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
                                      "—"
                                    )}
                                  </td>
                                  <td>{formatTierRateLabel(slot)}</td>
                                  <td className="jx-price">{formatMyrSen(slot.amountSen)}</td>
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
                        <button type="button" className="jx-link mt-3" onClick={() => setChain(order)}>
                          {t("adminViewFullChain")}
                        </button>
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
