import type { Customer } from "@/lib/account";
import { formatMyrSen, myrToSen, senToMyr } from "@/lib/referral";

/** Unified integer-sen helpers. Never store money as float. */
export { formatMyrSen, myrToSen, senToMyr };

export const TOPUP_PRESETS_SEN = [5000, 10000, 20000, 50000] as const;

export type WalletBucket = "topup" | "commission";

export type WalletTxKind =
  | "topup_credit"
  | "commission_earn"
  | "withdrawal_hold"
  | "withdrawal_release"
  | "withdrawal_paid"
  | "admin_adjust"
  | "purchase_debit";

export type WalletTransaction = {
  id: string;
  userId: string;
  amountSen: number;
  bucket: WalletBucket;
  kind: WalletTxKind;
  sourceType: string;
  sourceId: string;
  note?: string;
  createdAt: string;
  balanceAfterSen: number;
};

export type TopUpStatus = "pending" | "credited" | "failed";

export type TopUpRecord = {
  id: string;
  userId: string;
  amountSen: number;
  status: TopUpStatus;
  paymentId?: string;
  billplzBillId?: string;
  billplzUrl?: string;
  createdAt: string;
  creditedAt?: string;
  note?: string;
};

export type WithdrawalPayout = {
  bank: string;
  holder: string;
  account: string;
};

export type WalletBuckets = {
  topUpBalanceSen: number;
  commissionBalanceSen: number;
  pendingWithdrawalSen: number;
  availableToWithdrawSen: number;
  totalSen: number;
};

export function asSen(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function asNonNegSen(value: unknown): number {
  return Math.max(0, asSen(value));
}

export type LegacyWithdrawalStatus = "requested" | "settled" | "rejected" | "pending" | "approved" | "paid";

export type CanonicalWithdrawalStatus = "pending" | "approved" | "paid" | "rejected";

export function normalizeWithdrawalStatus(status?: string | null): CanonicalWithdrawalStatus {
  if (status === "requested") return "pending";
  if (status === "settled") return "paid";
  if (status === "pending" || status === "approved" || status === "paid" || status === "rejected") {
    return status;
  }
  return "pending";
}

export function isWithdrawalHeld(status?: string | null): boolean {
  const canonical = normalizeWithdrawalStatus(status);
  return canonical === "pending" || canonical === "approved";
}

export function computeWalletBuckets(
  user: Pick<Customer, "id" | "topUpBalanceSen" | "commissionBalanceSen">,
  withdrawals: { userId: string; amountSen: number; status?: string }[],
): WalletBuckets {
  const topUpBalanceSen = asNonNegSen(user.topUpBalanceSen);
  const commissionBalanceSen = asNonNegSen(user.commissionBalanceSen);
  const pendingWithdrawalSen = withdrawals
    .filter((row) => row.userId === user.id && isWithdrawalHeld(row.status))
    .reduce((sum, row) => sum + asNonNegSen(row.amountSen), 0);
  const availableToWithdrawSen = Math.max(0, commissionBalanceSen - pendingWithdrawalSen);
  return {
    topUpBalanceSen,
    commissionBalanceSen,
    pendingWithdrawalSen,
    availableToWithdrawSen,
    totalSen: topUpBalanceSen + commissionBalanceSen,
  };
}

export function canRequestWithdrawal(availableToWithdrawSen: number, amountSen: number): boolean {
  const amount = asSen(amountSen);
  return amount >= 1 && amount <= asNonNegSen(availableToWithdrawSen);
}

export function canDebitTopUpOnly(topUpBalanceSen: number, amountSen: number): boolean {
  const amount = asSen(amountSen);
  return amount >= 1 && amount <= asNonNegSen(topUpBalanceSen);
}

export function assertTopUpAmountMatch(expectedSen: number, reportedSen?: number | null) {
  if (reportedSen == null || !Number.isFinite(Number(reportedSen))) return true;
  return asSen(reportedSen) === asSen(expectedSen);
}

export function alreadyHasSource(
  rows: { sourceType?: string; sourceId?: string; kind?: string }[],
  sourceType: string,
  sourceId: string,
  kind?: string,
) {
  return rows.some(
    (row) =>
      row.sourceType === sourceType &&
      row.sourceId === sourceId &&
      (!kind || row.kind === kind),
  );
}

export type MutableFinance = {
  users: Customer[];
  walletTransactions: WalletTransaction[];
  topUps: TopUpRecord[];
  withdrawals: {
    id: string;
    userId: string;
    amountSen: number;
    status: string;
    createdAt: string;
    settledAt?: string;
    approvedAt?: string;
    paidAt?: string;
    rejectedAt?: string;
    note?: string;
    payout?: WithdrawalPayout;
  }[];
};

function findUser(state: MutableFinance, userId: string) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  return user;
}

function pushTx(
  state: MutableFinance,
  input: Omit<WalletTransaction, "balanceAfterSen"> & { bucket: WalletBucket },
) {
  const user = findUser(state, input.userId);
  const after =
    input.bucket === "topup" ? asNonNegSen(user.topUpBalanceSen) : asNonNegSen(user.commissionBalanceSen);
  state.walletTransactions.push({ ...input, balanceAfterSen: after });
}

export function applyCreditTopUp(
  state: MutableFinance,
  input: { topUpId: string; reportedAmountSen?: number | null; paidAt?: string; newId: (prefix: string) => string },
): TopUpRecord {
  const topUp = state.topUps.find((row) => row.id === input.topUpId);
  if (!topUp) throw new Error("充值单不存在");
  if (topUp.status === "credited") return topUp;
  if (!assertTopUpAmountMatch(topUp.amountSen, input.reportedAmountSen)) {
    throw new Error("充值金额不符");
  }
  if (alreadyHasSource(state.walletTransactions, "topup", topUp.id, "topup_credit")) {
    topUp.status = "credited";
    topUp.creditedAt = topUp.creditedAt || input.paidAt || new Date().toISOString();
    return topUp;
  }
  const user = findUser(state, topUp.userId);
  user.topUpBalanceSen = asNonNegSen(user.topUpBalanceSen) + asNonNegSen(topUp.amountSen);
  topUp.status = "credited";
  topUp.creditedAt = input.paidAt || new Date().toISOString();
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: topUp.amountSen,
    bucket: "topup",
    kind: "topup_credit",
    sourceType: "topup",
    sourceId: topUp.id,
    note: "billplz_topup",
    createdAt: topUp.creditedAt,
  });
  return topUp;
}

export function applyDebitTopUpPurchase(
  state: MutableFinance,
  input: { userId: string; amountSen: number; sourceId: string; note?: string; newId: (prefix: string) => string },
) {
  const user = findUser(state, input.userId);
  const amount = asSen(input.amountSen);
  if (!canDebitTopUpOnly(user.topUpBalanceSen || 0, amount)) {
    throw new Error("充值余额不足");
  }
  user.topUpBalanceSen = asNonNegSen(user.topUpBalanceSen) - amount;
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: -amount,
    bucket: "topup",
    kind: "purchase_debit",
    sourceType: "order",
    sourceId: input.sourceId,
    note: input.note || "wallet_purchase_topup_only",
    createdAt: new Date().toISOString(),
  });
}

export function applyRequestWithdrawal(
  state: MutableFinance,
  input: {
    userId: string;
    amountSen: number;
    payout?: WithdrawalPayout;
    newId: (prefix: string) => string;
  },
) {
  const user = findUser(state, input.userId);
  if (user.status === "disabled") throw new Error("账号已被停用");
  const amount = asSen(input.amountSen);
  const buckets = computeWalletBuckets(user, state.withdrawals);
  if (!canRequestWithdrawal(buckets.availableToWithdrawSen, amount)) {
    throw new Error(amount < 1 ? "提现金额无效" : "余额不足");
  }
  const row = {
    id: input.newId("wd"),
    userId: input.userId,
    amountSen: amount,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
    payout: input.payout,
  };
  state.withdrawals.push(row);
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: 0,
    bucket: "commission",
    kind: "withdrawal_hold",
    sourceType: "withdrawal",
    sourceId: row.id,
    note: "hold_pending",
    createdAt: row.createdAt,
  });
  return row;
}

export function applyApproveWithdrawal(state: MutableFinance, id: string) {
  const row = state.withdrawals.find((item) => item.id === id);
  if (!row) throw new Error("提现记录不存在");
  const status = normalizeWithdrawalStatus(row.status);
  if (status === "paid" || status === "rejected") throw new Error("该提现已处理");
  if (status === "approved") return row;
  row.status = "approved";
  row.approvedAt = new Date().toISOString();
  return row;
}

export function applyRejectWithdrawal(
  state: MutableFinance,
  input: { id: string; note?: string; newId: (prefix: string) => string },
) {
  const row = state.withdrawals.find((item) => item.id === input.id);
  if (!row) throw new Error("提现记录不存在");
  const status = normalizeWithdrawalStatus(row.status);
  if (status === "paid") throw new Error("该提现已处理");
  if (status === "rejected") return row;
  row.status = "rejected";
  row.rejectedAt = new Date().toISOString();
  row.settledAt = row.rejectedAt;
  row.note = input.note || row.note;
  pushTx(state, {
    id: input.newId("wtx"),
    userId: row.userId,
    amountSen: 0,
    bucket: "commission",
    kind: "withdrawal_release",
    sourceType: "withdrawal",
    sourceId: row.id,
    note: "release_rejected",
    createdAt: row.rejectedAt,
  });
  return row;
}

export function applyPayWithdrawal(
  state: MutableFinance,
  input: { id: string; note?: string; newId: (prefix: string) => string },
) {
  const row = state.withdrawals.find((item) => item.id === input.id);
  if (!row) throw new Error("提现记录不存在");
  const status = normalizeWithdrawalStatus(row.status);
  if (status === "paid") return row;
  if (status === "rejected") throw new Error("该提现已处理");
  const user = findUser(state, row.userId);
  const balance = asNonNegSen(user.commissionBalanceSen);
  if (row.amountSen > balance) throw new Error("余额不足");
  user.commissionBalanceSen = balance - row.amountSen;
  row.status = "paid";
  row.paidAt = new Date().toISOString();
  row.settledAt = row.paidAt;
  row.note = input.note || row.note;
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: -row.amountSen,
    bucket: "commission",
    kind: "withdrawal_paid",
    sourceType: "withdrawal",
    sourceId: row.id,
    note: "payout_paid",
    createdAt: row.paidAt,
  });
  return row;
}

export function applyAdminAdjust(
  state: MutableFinance,
  input: {
    userId: string;
    bucket: WalletBucket;
    amountSen: number;
    reason: string;
    newId: (prefix: string) => string;
  },
) {
  const reason = input.reason.trim();
  if (!reason) throw new Error("请填写调整原因");
  const amount = asSen(input.amountSen);
  if (amount === 0) throw new Error("调整金额无效");
  const user = findUser(state, input.userId);
  if (input.bucket === "topup") {
    const next = asNonNegSen(user.topUpBalanceSen) + amount;
    if (next < 0) throw new Error("充值余额不足");
    user.topUpBalanceSen = next;
  } else {
    const next = asNonNegSen(user.commissionBalanceSen) + amount;
    if (next < 0) throw new Error("余额不足");
    user.commissionBalanceSen = next;
  }
  const now = new Date().toISOString();
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: amount,
    bucket: input.bucket,
    kind: "admin_adjust",
    sourceType: "admin",
    sourceId: input.newId("adj"),
    note: reason,
    createdAt: now,
  });
  return computeWalletBuckets(user, state.withdrawals);
}

export function applyCommissionEarnTx(
  state: MutableFinance,
  input: {
    userId: string;
    amountSen: number;
    sourceId: string;
    note?: string;
    createdAt: string;
    newId: (prefix: string) => string;
  },
) {
  if (alreadyHasSource(state.walletTransactions, "commission", input.sourceId, "commission_earn")) {
    return;
  }
  const user = state.users.find((item) => item.id === input.userId);
  if (!user) return;
  pushTx(state, {
    id: input.newId("wtx"),
    userId: user.id,
    amountSen: input.amountSen,
    bucket: "commission",
    kind: "commission_earn",
    sourceType: "commission",
    sourceId: input.sourceId,
    note: input.note,
    createdAt: input.createdAt,
  });
}
