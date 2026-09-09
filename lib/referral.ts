import type { Customer } from "@/lib/account";

export const PAY_DEPTH = 3;
export const REFERRAL_TIERS = [1, 2, 3] as const;
export type ReferralTier = (typeof REFERRAL_TIERS)[number];

export type GenealogyPerson = {
  depth: number;
  userId: string;
  name: string;
  code?: string;
  status?: Customer["status"];
  email?: string;
  phone?: string;
  createdAt?: string;
  payable: boolean;
};

export type DownlineNode = GenealogyPerson & {
  children: DownlineNode[];
};

export type ReferralTierPlan = {
  tier: ReferralTier;
  type: "percentage";
  ratePercent: number;
  active: boolean;
};

export type ReferralPlan = {
  compression: boolean;
  maxPayoutSen: number | null;
  tiers: ReferralTierPlan[];
};

export type CommissionKind = "earn" | "payout" | "adjust";

export type CommissionEntry = {
  id: string;
  kind: CommissionKind;
  userId: string;
  orderId?: string;
  buyerId?: string;
  buyerName?: string;
  tier?: ReferralTier;
  ratePercent?: number;
  baseSen?: number;
  amountSen: number;
  paid: boolean;
  reason?: string;
  createdAt: string;
  note?: string;
};

export type WithdrawalStatus = "requested" | "settled" | "rejected";

export type Withdrawal = {
  id: string;
  userId: string;
  amountSen: number;
  status: WithdrawalStatus;
  createdAt: string;
  settledAt?: string;
  note?: string;
};

export type ReferralChainSlot = {
  tier: ReferralTier;
  userId?: string;
  name?: string;
  code?: string;
  status?: Customer["status"];
  ratePercent: number;
  amountSen: number;
  paid: boolean;
  reason?: string;
};

export type OrderReferralSettled = {
  baseSen: number;
  compression: boolean;
  tiers: ReferralChainSlot[];
  genealogy?: GenealogyPerson[];
  accruedBy?: "billplz" | "admin" | "demo";
};

export const DEFAULT_REFERRAL_PLAN: ReferralPlan = {
  compression: false,
  maxPayoutSen: null,
  tiers: [
    { tier: 1, type: "percentage", ratePercent: 10, active: true },
    { tier: 2, type: "percentage", ratePercent: 5, active: true },
    { tier: 3, type: "percentage", ratePercent: 2, active: true },
  ],
};

export function normalizeReferralCode(input?: string | null) {
  return (input || "")
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]/g, "")
    .replace(/[O]/g, "0")
    .replace(/[IL]/g, "1");
}

export function formatReferralCode(code: string) {
  const compact = normalizeReferralCode(code);
  if (compact.length <= 4) return compact;
  return compact.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

function clampRate(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(100, Math.round(n * 100) / 100);
}

export function normalizeReferralPlan(input?: Partial<ReferralPlan> | null): ReferralPlan {
  const seed = DEFAULT_REFERRAL_PLAN;
  const incoming = Array.isArray(input?.tiers) ? input.tiers : [];
  const tiers = seed.tiers.map((fallback) => {
    const row = incoming.find((item) => Number(item?.tier) === fallback.tier) || incoming[fallback.tier - 1];
    return {
      tier: fallback.tier,
      type: "percentage" as const,
      ratePercent: clampRate(row?.ratePercent, fallback.ratePercent),
      active: row?.active !== false,
    };
  });
  const cap = Number(input?.maxPayoutSen);
  return {
    compression: Boolean(input?.compression),
    maxPayoutSen: Number.isFinite(cap) && cap > 0 ? Math.round(cap) : null,
    tiers,
  };
}

export function findCustomerByReferralCode(users: Customer[], code?: string | null) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return undefined;
  return users.find((user) => normalizeReferralCode(user.referralCode) === normalized);
}

export function wouldCreateReferralCycle(users: Customer[], userId: string, referrerId: string) {
  if (userId === referrerId) return true;
  const byId = new Map(users.map((user) => [user.id, user]));
  let cursor = byId.get(referrerId);
  const seen = new Set<string>([userId]);
  while (cursor) {
    if (seen.has(cursor.id)) return true;
    seen.add(cursor.id);
    cursor = cursor.referrerId ? byId.get(cursor.referrerId) : undefined;
  }
  return false;
}

export type WalkedReferrer = {
  tier: ReferralTier;
  user: Customer | null;
};

export function isPayableDepth(depth: number) {
  return depth >= 1 && depth <= PAY_DEPTH;
}

export function walkFullUpline(users: Customer[], start: Customer | undefined): GenealogyPerson[] {
  const byId = new Map(users.map((user) => [user.id, user]));
  const out: GenealogyPerson[] = [];
  const seen = new Set<string>();
  let current = start;
  let depth = 0;
  while (current?.referrerId && depth < 200) {
    if (seen.has(current.referrerId)) break;
    seen.add(current.referrerId);
    const next = byId.get(current.referrerId);
    if (!next || next.id === start?.id) break;
    depth += 1;
    out.push({
      depth,
      userId: next.id,
      name: next.name,
      code: next.referralCode,
      status: next.status,
      email: next.email,
      phone: next.phone,
      createdAt: next.createdAt,
      payable: isPayableDepth(depth),
    });
    current = next;
  }
  return out;
}

export function countDownlineByPayDepth(users: Customer[], rootId: string) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  function walk(nodes: DownlineNode[]) {
    for (const node of nodes) {
      if (node.depth >= 1 && node.depth <= PAY_DEPTH) {
        counts[node.depth as 1 | 2 | 3] += 1;
      }
      if (node.depth < PAY_DEPTH) walk(node.children);
    }
  }
  walk(buildDownlineTree(users, rootId));
  return counts;
}

export function buildDownlineTree(users: Customer[], rootId: string): DownlineNode[] {
  const childrenOf = new Map<string, Customer[]>();
  for (const user of users) {
    if (!user.referrerId || user.id === rootId) continue;
    const list = childrenOf.get(user.referrerId) || [];
    list.push(user);
    childrenOf.set(user.referrerId, list);
  }
  const seen = new Set<string>([rootId]);

  function branch(parentId: string, depth: number): DownlineNode[] {
    if (depth > 200) return [];
    const kids = (childrenOf.get(parentId) || []).slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const nodes: DownlineNode[] = [];
    for (const child of kids) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      nodes.push({
        depth,
        userId: child.id,
        name: child.name,
        code: child.referralCode,
        status: child.status,
        email: child.email,
        phone: child.phone,
        createdAt: child.createdAt,
        payable: isPayableDepth(depth),
        children: branch(child.id, depth + 1),
      });
    }
    return nodes;
  }

  return branch(rootId, 1);
}

export function walkReferralChain(
  users: Customer[],
  buyer: Customer | undefined,
  compression: boolean,
): WalkedReferrer[] {
  const byId = new Map(users.map((user) => [user.id, user]));
  const slots: WalkedReferrer[] = [];

  if (!compression) {
    let current: Customer | undefined = buyer;
    for (const tier of REFERRAL_TIERS) {
      const next = current?.referrerId ? byId.get(current.referrerId) || null : null;
      slots.push({ tier, user: next && next.id !== buyer?.id ? next : null });
      current = next || undefined;
    }
    return slots;
  }

  let cursor: Customer | undefined = buyer;
  for (const tier of REFERRAL_TIERS) {
    let found: Customer | null = null;
    let probe = cursor;
    const seen = new Set<string>();
    while (probe?.referrerId) {
      if (seen.has(probe.referrerId)) break;
      seen.add(probe.referrerId);
      const next = byId.get(probe.referrerId);
      if (!next || next.id === buyer?.id) break;
      probe = next;
      if (next.status !== "disabled") {
        found = next;
        break;
      }
    }
    slots.push({ tier, user: found });
    cursor = found || undefined;
  }
  return slots;
}

export function computeTierPayouts(input: {
  plan: ReferralPlan;
  baseSen: number;
  chain: WalkedReferrer[];
}): ReferralChainSlot[] {
  const plan = normalizeReferralPlan(input.plan);
  const baseSen = Math.max(0, Math.round(input.baseSen || 0));
  let remaining = plan.maxPayoutSen == null ? Number.POSITIVE_INFINITY : plan.maxPayoutSen;

  return REFERRAL_TIERS.map((tier) => {
    const walked = input.chain.find((item) => item.tier === tier);
    const spec = plan.tiers.find((item) => item.tier === tier) || DEFAULT_REFERRAL_PLAN.tiers[tier - 1];
    const user = walked?.user || null;
    const slot: ReferralChainSlot = {
      tier,
      userId: user?.id,
      name: user?.name,
      code: user?.referralCode,
      status: user?.status,
      ratePercent: spec.ratePercent,
      amountSen: 0,
      paid: false,
    };

    if (!spec.active) {
      slot.reason = "tier_off";
      return slot;
    }
    if (!user) {
      slot.reason = "missing";
      return slot;
    }
    if (user.status === "disabled") {
      slot.reason = "inactive";
      return slot;
    }

    let amount = Math.floor((baseSen * spec.ratePercent) / 100);
    if (Number.isFinite(remaining)) {
      amount = Math.min(amount, Math.max(0, remaining));
      remaining -= amount;
    }
    slot.amountSen = amount;
    if (amount > 0) {
      slot.paid = true;
    } else {
      slot.reason = "zero";
    }
    return slot;
  });
}

export function senToMyr(sen: number) {
  return Math.round(sen) / 100;
}

export function myrToSen(myr: number) {
  return Math.round(Number(myr) * 100);
}

export function formatMyrSen(sen: number) {
  return `RM ${senToMyr(sen).toFixed(2)}`;
}

export function visiblePlanTiers(plan: ReferralPlan) {
  return normalizeReferralPlan(plan).tiers.filter((tier) => tier.active);
}

export type CommissionSkipReason = "demo" | "grant" | "pending" | "not_billplz" | "no_upline";

export function commissionSkipReason(order: {
  status?: string;
  payMethod?: string;
  referralSettled?: OrderReferralSettled;
  referralSkip?: { reason?: string };
}): CommissionSkipReason | null {
  if ((order.status ?? "paid") === "pending") return "pending";
  if (order.referralSettled) {
    const paid = order.referralSettled.tiers.some((tier) => tier.paid && tier.amountSen > 0);
    return paid ? null : "no_upline";
  }
  const method = order.payMethod || order.referralSkip?.reason || "demo";
  if (method === "grant") return "grant";
  if (method === "demo") return "demo";
  if (method !== "billplz") return "not_billplz";
  return "no_upline";
}

export function isPayableEarn(entry: CommissionEntry, plan: ReferralPlan) {
  if (entry.kind !== "earn" || !entry.paid || entry.amountSen <= 0) return false;
  if (!entry.tier) return false;
  const spec = normalizeReferralPlan(plan).tiers.find((item) => item.tier === entry.tier);
  return Boolean(spec?.active);
}
