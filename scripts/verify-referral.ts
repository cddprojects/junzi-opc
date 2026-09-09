import assert from "node:assert/strict";
import {
  computeTierPayouts,
  DEFAULT_REFERRAL_PLAN,
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

console.log("referral rules ok");
