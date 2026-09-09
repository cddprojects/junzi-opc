import assert from "node:assert/strict";
import {
  buildDownlineTree,
  commissionSkipReason,
  computeTierPayouts,
  countDownlineByPayDepth,
  DEFAULT_REFERRAL_PLAN,
  walkFullUpline,
  walkReferralChain,
  wouldCreateReferralCycle,
  type WalkedReferrer,
} from "../lib/referral";
import type { Customer } from "../lib/account";

function user(partial: Partial<Customer> & Pick<Customer, "id" | "name">): Customer {
  return {
    passwordSalt: "x",
    passwordHash: "y",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    ...partial,
  };
}

const t3 = user({ id: "u3", name: "C", referralCode: "RC", referrerId: undefined });
const t2 = user({ id: "u2", name: "B", referralCode: "RB", referrerId: "u3" });
const t1 = user({ id: "u1", name: "A", referralCode: "RA", referrerId: "u2" });
const buyer = user({ id: "ub", name: "Buyer", referralCode: "RX", referrerId: "u1" });
const users = [t3, t2, t1, buyer];

const chain = walkReferralChain(users, buyer, false);
assert.equal(chain[0]?.user?.id, "u1");
assert.equal(chain[1]?.user?.id, "u2");
assert.equal(chain[2]?.user?.id, "u3");

const paid = computeTierPayouts({ plan: DEFAULT_REFERRAL_PLAN, baseSen: 10000, chain });
assert.equal(paid[0]?.amountSen, 1000);
assert.equal(paid[1]?.amountSen, 500);
assert.equal(paid[2]?.amountSen, 200);
assert.ok(paid.every((row) => row.paid));

const broken = walkReferralChain(
  [buyer, t2, t3],
  { ...buyer, referrerId: "missing" },
  false,
);
assert.equal(broken[0]?.user, null);
assert.equal(broken[1]?.user, null);
assert.equal(broken[2]?.user, null);
const unpaid = computeTierPayouts({ plan: DEFAULT_REFERRAL_PLAN, baseSen: 10000, chain: broken });
assert.ok(unpaid.every((row) => !row.paid && row.reason === "missing"));

const inactiveT1 = { ...t1, status: "disabled" as const };
const inactiveChain = walkReferralChain([t3, t2, inactiveT1, buyer], buyer, false);
assert.equal(inactiveChain[0]?.user?.id, "u1");
assert.equal(inactiveChain[1]?.user?.id, "u2");
const inactivePaid = computeTierPayouts({ plan: DEFAULT_REFERRAL_PLAN, baseSen: 10000, chain: inactiveChain });
assert.equal(inactivePaid[0]?.paid, false);
assert.equal(inactivePaid[0]?.reason, "inactive");
assert.equal(inactivePaid[1]?.amountSen, 500);
assert.equal(inactivePaid[2]?.amountSen, 200);

const compressed = walkReferralChain([t3, t2, inactiveT1, buyer], buyer, true);
assert.equal(compressed[0]?.user?.id, "u2");
assert.equal(compressed[1]?.user?.id, "u3");
assert.equal(compressed[2]?.user, null);

const outsider = user({ id: "u9", name: "Z", referralCode: "RZ" });
assert.equal(wouldCreateReferralCycle(users, "u3", "ub"), true);
assert.equal(wouldCreateReferralCycle([...users, outsider], "u3", "u9"), false);

const offPlan = {
  ...DEFAULT_REFERRAL_PLAN,
  tiers: DEFAULT_REFERRAL_PLAN.tiers.map((tier) => (tier.tier === 3 ? { ...tier, active: false } : tier)),
};
const off = computeTierPayouts({ plan: offPlan, baseSen: 10000, chain: chain as WalkedReferrer[] });
assert.equal(off[2]?.reason, "tier_off");
assert.equal(off[2]?.paid, false);

const l5 = user({ id: "u5", name: "E", referralCode: "RE" });
const l4 = user({ id: "u4", name: "D", referralCode: "RD", referrerId: "u5" });
const deepBuyer = user({ id: "ud", name: "Deep", referralCode: "RDEEP", referrerId: "u1" });
const deepUsers = [
  l5,
  l4,
  { ...t3, referrerId: "u4" },
  t2,
  t1,
  deepBuyer,
];
const full = walkFullUpline(deepUsers, deepBuyer);
assert.equal(full.map((row) => row.userId).join(","), "u1,u2,u3,u4,u5");
assert.equal(full.filter((row) => row.payable).length, 3);
assert.equal(full[3]?.payable, false);
assert.equal(full[4]?.payable, false);
const payOnly = computeTierPayouts({
  plan: DEFAULT_REFERRAL_PLAN,
  baseSen: 10000,
  chain: walkReferralChain(deepUsers, deepBuyer, false),
});
assert.equal(payOnly.length, 3);
assert.equal(payOnly[0]?.userId, "u1");
assert.equal(payOnly[2]?.userId, "u3");

const tree = buildDownlineTree(deepUsers, "u5");
assert.equal(tree[0]?.userId, "u4");
assert.equal(tree[0]?.children[0]?.userId, "u3");
assert.ok(tree[0]?.children[0]?.children[0]?.children.some((row) => row.userId === "u1"));
const teamFromTop = countDownlineByPayDepth(deepUsers, "u5");
assert.equal(teamFromTop[1], 1);
assert.equal(teamFromTop[2], 1);
assert.equal(teamFromTop[3], 1);

const ding = user({ id: "ding", name: "顶", referralCode: "RDING", referrerId: "yi" });
const yi = user({ id: "yi", name: "学员乙", referralCode: "RYI" });
const dingBuy = computeTierPayouts({
  plan: DEFAULT_REFERRAL_PLAN,
  baseSen: 604,
  chain: walkReferralChain([yi, ding], ding, false),
});
assert.equal(dingBuy.length, 3);
assert.equal(dingBuy[0]?.userId, "yi");
assert.equal(dingBuy[0]?.ratePercent, 10);
assert.equal(dingBuy[0]?.amountSen, 60);
assert.equal(dingBuy[0]?.paid, true);
assert.equal(dingBuy[1]?.paid, false);
assert.equal(dingBuy[2]?.paid, false);

assert.equal(
  commissionSkipReason({
    status: "paid",
    payMethod: "grant",
    referralSettled: { baseSen: 604, compression: false, tiers: dingBuy, accruedBy: "admin" },
  }),
  null,
);
assert.equal(commissionSkipReason({ status: "paid", payMethod: "grant" }), "grant");
assert.equal(commissionSkipReason({ status: "paid", payMethod: "demo" }), "demo");
assert.equal(commissionSkipReason({ status: "pending", payMethod: "billplz" }), "pending");
assert.equal(
  commissionSkipReason({
    status: "paid",
    payMethod: "billplz",
    referralSettled: { baseSen: 604, compression: false, tiers: dingBuy },
  }),
  null,
);
assert.equal(commissionSkipReason({ status: "paid", payMethod: "billplz" }), "no_upline");

const mixedPlan = {
  ...DEFAULT_REFERRAL_PLAN,
  tiers: [
    { tier: 1 as const, type: "fixed" as const, ratePercent: 10, fixedSen: 100, active: true },
    { tier: 2 as const, type: "percentage" as const, ratePercent: 5, fixedSen: 0, active: true },
    { tier: 3 as const, type: "percentage" as const, ratePercent: 2, fixedSen: 0, active: true },
  ],
};
const mixed = computeTierPayouts({ plan: mixedPlan, baseSen: 604, chain: chain as WalkedReferrer[] });
assert.equal(mixed[0]?.payoutType, "fixed");
assert.equal(mixed[0]?.amountSen, 100);
assert.equal(mixed[1]?.amountSen, 30);

const oversized = {
  ...DEFAULT_REFERRAL_PLAN,
  tiers: DEFAULT_REFERRAL_PLAN.tiers.map((tier) =>
    tier.tier === 1 ? { ...tier, type: "fixed" as const, fixedSen: 1000 } : tier,
  ),
};
assert.equal(
  computeTierPayouts({ plan: oversized, baseSen: 604, chain: chain as WalkedReferrer[] })[0]?.amountSen,
  604,
);

const room = { ...mixedPlan, maxPayoutSen: 80 };
const limited = computeTierPayouts({ plan: room, baseSen: 604, chain: chain as WalkedReferrer[] });
assert.equal(limited[0]?.amountSen, 80);
assert.equal(limited[1]?.amountSen, 0);

console.log("referral rules ok");
