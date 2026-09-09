import {
  formatMyrSen,
  MAX_COMMISSION_LEVELS,
  type GenealogyPerson,
  type ReferralChainSlot,
} from "@/lib/referral";

export type CommissionUiStatus =
  | "credited"
  | "pending"
  | "no_upline"
  | "ineligible"
  | "over_depth"
  | "anomaly";

export function commissionUiStatus(row: {
  paid?: boolean;
  amountSen?: number;
  reason?: string;
  userId?: string;
  tier?: number;
}): CommissionUiStatus {
  if (row.tier && row.tier > MAX_COMMISSION_LEVELS) return "over_depth";
  if (row.reason === "missing" || !row.userId) return "no_upline";
  if (row.paid && (row.amountSen || 0) > 0) return "credited";
  if (row.reason === "inactive" || row.reason === "tier_off" || row.reason === "zero") return "ineligible";
  if (!row.paid && !row.reason) return "pending";
  return "anomaly";
}

export const COMMISSION_STATUS_KEY = {
  credited: "adminCredited",
  pending: "adminStatusPendingCredit",
  no_upline: "adminStatusNoUpline",
  ineligible: "adminStatusIneligible",
  over_depth: "adminStatusOverDepth",
  anomaly: "adminStatusAnomaly",
} as const;

export function commissionStatusClass(status: CommissionUiStatus) {
  if (status === "credited") return "jx-chip jx-chip-ok";
  if (status === "pending") return "jx-chip jx-chip-wait";
  if (status === "anomaly") return "jx-chip is-on";
  return "jx-chip";
}

export function payMethodLabel(method?: string | null) {
  if (method === "billplz") return "Billplz";
  if (method === "grant") return "后台授权";
  if (method === "demo") return "演示";
  if (method === "wallet") return "Wallet";
  return "—";
}

export function orderCommissionSummary(order: {
  status?: string;
  referralSettled?: { tiers?: ReferralChainSlot[] };
}) {
  if ((order.status ?? "paid") === "pending") {
    return { kind: "unpaid" as const, text: "付款后计算" };
  }
  const tiers = order.referralSettled?.tiers || [];
  if (!order.referralSettled) {
    return { kind: "pending" as const, text: "待处理" };
  }
  const credited = tiers.filter((row) => row.paid && (row.amountSen || 0) > 0);
  if (!credited.length) {
    return { kind: "none" as const, text: "无佣金" };
  }
  const sen = credited.reduce((sum, row) => sum + (row.amountSen || 0), 0);
  return { kind: "ready" as const, text: `${credited.length}人 · ${formatMyrSen(sen)} ›` };
}

export function t4Plus(genealogy?: GenealogyPerson[]) {
  return (genealogy || []).filter((row) => row.depth > MAX_COMMISSION_LEVELS);
}
