import assert from "node:assert/strict";
import type { Customer } from "../lib/account";
import {
  applyAdminAdjust,
  applyApproveWithdrawal,
  applyCreditTopUp,
  applyDebitTopUpPurchase,
  applyPayWithdrawal,
  applyRejectWithdrawal,
  applyRequestWithdrawal,
  assertTopUpAmountMatch,
  canDebitTopUpOnly,
  computeWalletBuckets,
  type MutableFinance,
} from "../lib/wallet";
import { computeTierPayouts, DEFAULT_REFERRAL_PLAN, walkReferralChain } from "../lib/referral";

function user(partial: Partial<Customer> & Pick<Customer, "id" | "name">): Customer {
  return {
    passwordSalt: "x",
    passwordHash: "y",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    commissionBalanceSen: 0,
    topUpBalanceSen: 0,
    ...partial,
  };
}

let n = 0;
const newId = (prefix: string) => `${prefix}_${++n}`;

function state(users: Customer[]): MutableFinance {
  return { users, walletTransactions: [], topUps: [], withdrawals: [] };
}

const buyer = user({ id: "ub", name: "Buyer", commissionBalanceSen: 1000, topUpBalanceSen: 800 });
const s = state([buyer]);

const hold = applyRequestWithdrawal(s, { userId: "ub", amountSen: 400, newId });
assert.equal(hold.status, "pending");
const afterHold = computeWalletBuckets(buyer, s.withdrawals);
assert.equal(afterHold.availableToWithdrawSen, 600);
assert.equal(afterHold.pendingWithdrawalSen, 400);
assert.equal(buyer.commissionBalanceSen, 1000);

assert.throws(() => applyRequestWithdrawal(s, { userId: "ub", amountSen: 700, newId }), /余额不足/);

applyApproveWithdrawal(s, hold.id);
assert.equal(s.withdrawals[0]?.status, "approved");
assert.equal(computeWalletBuckets(buyer, s.withdrawals).availableToWithdrawSen, 600);

applyPayWithdrawal(s, { id: hold.id, newId });
assert.equal(s.withdrawals[0]?.status, "paid");
assert.equal(buyer.commissionBalanceSen, 600);
assert.equal(computeWalletBuckets(buyer, s.withdrawals).pendingWithdrawalSen, 0);
assert.ok(s.walletTransactions.some((row) => row.kind === "withdrawal_paid" && row.sourceId === hold.id));

const hold2 = applyRequestWithdrawal(s, { userId: "ub", amountSen: 200, newId });
applyRejectWithdrawal(s, { id: hold2.id, newId });
assert.equal(s.withdrawals[1]?.status, "rejected");
assert.equal(buyer.commissionBalanceSen, 600);
assert.equal(computeWalletBuckets(buyer, s.withdrawals).availableToWithdrawSen, 600);

const topUser = user({ id: "ut", name: "Top", topUpBalanceSen: 0 });
const ts = state([topUser]);
ts.topUps.push({
  id: "tup_1",
  userId: "ut",
  amountSen: 5000,
  status: "pending",
  createdAt: "2026-01-01T00:00:00.000Z",
  billplzBillId: "bill_1",
});
applyCreditTopUp(ts, { topUpId: "tup_1", reportedAmountSen: 5000, newId });
assert.equal(topUser.topUpBalanceSen, 5000);
assert.equal(topUser.commissionBalanceSen, 0);
assert.equal(ts.walletTransactions.filter((row) => row.kind === "topup_credit").length, 1);
applyCreditTopUp(ts, { topUpId: "tup_1", reportedAmountSen: 5000, newId });
assert.equal(topUser.topUpBalanceSen, 5000);
assert.equal(ts.walletTransactions.filter((row) => row.kind === "topup_credit").length, 1);
ts.topUps.push({
  id: "tup_bad",
  userId: "ut",
  amountSen: 2000,
  status: "pending",
  createdAt: "2026-01-01T00:00:00.000Z",
});
assert.throws(() => applyCreditTopUp(ts, { topUpId: "tup_bad", reportedAmountSen: 1999, newId }), /充值金额不符/);
assert.equal(assertTopUpAmountMatch(5000, 5000), true);
assert.equal(assertTopUpAmountMatch(5000, 4999), false);

assert.equal(canDebitTopUpOnly(5000, 5000), true);
assert.equal(canDebitTopUpOnly(5000, 5001), false);
applyDebitTopUpPurchase(ts, { userId: "ut", amountSen: 1200, sourceId: "chk_1", newId });
assert.equal(topUser.topUpBalanceSen, 3800);
assert.throws(() => applyDebitTopUpPurchase(ts, { userId: "ut", amountSen: 99999, sourceId: "chk_2", newId }), /充值余额不足/);

applyAdminAdjust(ts, { userId: "ut", bucket: "topup", amountSen: 100, reason: "test", newId });
assert.equal(topUser.topUpBalanceSen, 3900);

const t3 = user({ id: "u3", name: "C", referralCode: "RC" });
const t2 = user({ id: "u2", name: "B", referralCode: "RB", referrerId: "u3" });
const t1 = user({ id: "u1", name: "A", referralCode: "RA", referrerId: "u2" });
const deep = user({ id: "ud", name: "D", referralCode: "RD", referrerId: "u1" });
const extra = user({ id: "u4", name: "E", referralCode: "RE" });
const chainUsers = [extra, { ...t3, referrerId: "u4" }, t2, t1, deep];
const chain = walkReferralChain(chainUsers, deep, false);
const paid = computeTierPayouts({ plan: DEFAULT_REFERRAL_PLAN, baseSen: 10000, chain });
assert.equal(paid.length, 3);
assert.ok(paid.every((row) => row.userId !== "u4"));
assert.equal(ts.walletTransactions.some((row) => row.kind === "topup_credit" && row.bucket === "commission"), false);

console.log("wallet rules ok");
