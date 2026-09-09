import "server-only";

import { membership } from "@/lib/data";
import {
  type CheckoutItem,
  type Customer,
  type Order,
  type PayMethod,
  type PublicCustomer,
  type UserSession,
  isMemberActive,
  isOrderPaid,
  maskAccount,
  normalizeCode,
  parseAccount,
  publicCustomer,
  sessionExpiry,
} from "@/lib/account";
import {
  checkPassword,
  codesMatch,
  generateVerifySecret,
  hashPassword,
  makeVerifyCode,
  newId,
} from "@/lib/security";
import { ensureCustomerReferral, getSettings, getStoreProduct, readStore, writeStore } from "@/lib/store";
import { fromCny, parseCurrency } from "@/lib/currency";
import {
  buildDownlineTree,
  commissionSkipReason,
  computeTierPayouts,
  findCustomerByReferralCode,
  isPayableEarn,
  normalizeReferralCode,
  normalizeReferralPlan,
  visiblePlanTiers,
  walkFullUpline,
  walkReferralChain,
  wouldCreateReferralCycle,
  type CommissionEntry,
  type Withdrawal,
} from "@/lib/referral";

export function verifySecret() {
  return process.env.VERIFY_SECRET || readStore().verifySecret;
}

export function findCustomerById(id: string) {
  return readStore().users.find((user) => user.id === id);
}

export function findCustomerByAccount(account: string) {
  let parsed: { email?: string; phone?: string };
  try {
    parsed = parseAccount(account);
  } catch {
    return undefined;
  }
  const { users } = readStore();
  return users.find(
    (user) =>
      (parsed.email && user.email === parsed.email) || (parsed.phone && user.phone === parsed.phone),
  );
}

export function registerCustomer(input: {
  name: string;
  account: string;
  password: string;
  referralCode?: string;
}) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 24) throw new Error("请填写 1–24 字昵称");
  if (input.password.length < 6) throw new Error("密码至少 6 位");
  const account = parseAccount(input.account);
  if (!account.email && !account.phone) throw new Error("请填写邮箱或手机号");
  const store = readStore();
  if (
    store.users.some(
      (user) =>
        (account.email && user.email === account.email) ||
        (account.phone && user.phone === account.phone),
    )
  ) {
    throw new Error("该账号已注册");
  }
  const { salt, hash } = hashPassword(input.password);
  const wanted = normalizeReferralCode(input.referralCode);
  let referrerId: string | undefined;
  if (wanted) {
    const referrer = findCustomerByReferralCode(store.users, wanted);
    if (!referrer) throw new Error("推荐码无效");
    referrerId = referrer.id;
  }
  const taken = new Set(
    store.users.map((item) => normalizeReferralCode(item.referralCode)).filter(Boolean),
  );
  const user = ensureCustomerReferral(
    {
      id: newId("usr"),
      name,
      email: account.email,
      phone: account.phone,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
      status: "active",
      referrerId,
      commissionBalanceSen: 0,
    },
    taken,
  );
  if (user.referrerId && wouldCreateReferralCycle(store.users.concat(user), user.id, user.referrerId)) {
    throw new Error("推荐码无效");
  }
  store.users.push(user);
  const session = createSessionRecord(user.id);
  store.sessions.push(session);
  writeStore(store);
  return { user: publicCustomer(user), token: session.token };
}

export function loginCustomer(account: string, password: string) {
  const user = findCustomerByAccount(account);
  if (!user || !checkPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("账号或密码不正确");
  }
  if (user.status === "disabled") {
    throw new Error("账号已被停用");
  }
  const store = readStore();
  const session = createSessionRecord(user.id);
  store.sessions = store.sessions.filter((item) => item.userId !== user.id || Date.parse(item.expiresAt) > Date.now());
  store.sessions.push(session);
  writeStore(store);
  return { user: publicCustomer(user), token: session.token };
}

function createSessionRecord(userId: string): UserSession {
  return {
    token: newId("ses").replace("ses_", "") + newId("x").slice(2),
    userId,
    expiresAt: sessionExpiry(),
  };
}

export function customerFromToken(token?: string | null): PublicCustomer | null {
  if (!token) return null;
  const store = readStore();
  const session = store.sessions.find((item) => item.token === token);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = store.users.find((item) => item.id === session.userId);
  if (!user || user.status === "disabled") return null;
  return publicCustomer(user);
}

export function revokeSession(token?: string | null) {
  if (!token) return;
  const store = readStore();
  store.sessions = store.sessions.filter((item) => item.token !== token);
  writeStore(store);
}

export function updateCustomerProfile(
  userId: string,
  patch: { name?: string; email?: string; phone?: string },
) {
  const store = readStore();
  const index = store.users.findIndex((user) => user.id === userId);
  if (index < 0) throw new Error("用户不存在");
  const current = store.users[index];
  const name = (patch.name ?? current.name).trim();
  if (name.length < 1 || name.length > 24) throw new Error("请填写 1–24 字昵称");
  let email = current.email;
  let phone = current.phone;
  if (patch.email !== undefined) {
    email = patch.email.trim() ? parseAccount(patch.email).email : undefined;
  }
  if (patch.phone !== undefined) {
    phone = patch.phone.trim() ? parseAccount(patch.phone).phone : undefined;
  }
  if (!email && !phone) throw new Error("请至少保留邮箱或手机号");
  if (
    store.users.some(
      (user) =>
        user.id !== userId &&
        ((email && user.email === email) || (phone && user.phone === phone)),
    )
  ) {
    throw new Error("该邮箱或手机号已被使用");
  }
  store.users[index] = { ...current, name, email, phone };
  writeStore(store);
  return publicCustomer(store.users[index]);
}

function resolveCheckoutItem(item: CheckoutItem) {
  if (item.slug === membership.slug) {
    return {
      slug: membership.slug,
      title: membership.title,
      price: membership.campPrice,
    };
  }
  const product = getStoreProduct(item.slug);
  if (!product) throw new Error(`商品不存在：${item.slug}`);
  return { slug: product.slug, title: product.title, price: product.price };
}

function buildPendingOrder(
  userId: string,
  raw: CheckoutItem,
  currency: ReturnType<typeof parseCurrency>,
  fx: ReturnType<typeof getSettings>["fx"],
  checkoutId: string,
): Order {
  const item = resolveCheckoutItem(raw);
  const qty = Math.max(1, Number(raw.qty || 1));
  const priceCny = item.price;
  const price = fromCny(priceCny, currency, fx);
  const amountMyr = fromCny(priceCny * qty, "MYR", fx);
  const amountSen = Math.round(amountMyr * 100);
  return {
    id: newId("ord"),
    userId,
    productSlug: item.slug,
    productTitle: item.title,
    price,
    priceCny,
    currency,
    qty,
    createdAt: new Date().toISOString(),
    status: "pending",
    checkoutId,
    amountMyr,
    amountSen,
  };
}

function fulfillOrderInStore(store: ReturnType<typeof readStore>, order: Order, payMethod: PayMethod, paidAt?: string) {
  if (isOrderPaid(order) && order.verifyCode) return false;
  const secret = process.env.VERIFY_SECRET || store.verifySecret || generateVerifySecret();
  if (!store.verifySecret) store.verifySecret = secret;
  const user = store.users.find((item) => item.id === order.userId);
  const alreadyPaid = isOrderPaid(order);
  order.status = "paid";
  order.paidAt = paidAt || order.paidAt || new Date().toISOString();
  order.payMethod = order.payMethod || payMethod;
  if (!order.verifyCode) {
    order.verifyCode = makeVerifyCode(secret, {
      userId: order.userId,
      productSlug: order.productSlug,
      orderId: order.id,
    });
  }
  if (!alreadyPaid) {
    const productIndex = store.products.findIndex((product) => product.slug === order.productSlug);
    if (productIndex >= 0) {
      store.products[productIndex] = {
        ...store.products[productIndex],
        sales: (store.products[productIndex].sales || 0) + order.qty,
      };
    }
    if (user && order.productSlug === membership.slug) {
      const base = isMemberActive(user) && user.memberUntil ? Date.parse(user.memberUntil) : Date.now();
      user.memberUntil = new Date(base + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    const method = order.payMethod || payMethod;
    if (method === "billplz") {
      creditReferralInStore(store, order, "billplz");
    } else {
      order.referralSkip = { reason: method === "grant" ? "grant" : method === "demo" ? "demo" : "not_billplz" };
    }
  }
  return true;
}

function creditReferralInStore(
  store: ReturnType<typeof readStore>,
  order: Order,
  accruedBy: "billplz" | "admin" = "billplz",
) {
  if (store.commissionLedger.some((row) => row.kind === "earn" && row.orderId === order.id)) {
    return;
  }
  const buyer = store.users.find((item) => item.id === order.userId);
  const plan = normalizeReferralPlan(store.referralPlan);
  const baseSen = Math.max(0, Math.round(order.amountSen || Math.round((order.amountMyr || 0) * 100)));
  const chain = walkReferralChain(store.users, buyer, plan.compression);
  const tiers = computeTierPayouts({ plan, baseSen, chain });
  const genealogy = walkFullUpline(store.users, buyer);
  const now = new Date().toISOString();
  delete order.referralSkip;
  order.referralSettled = { baseSen, compression: plan.compression, tiers, genealogy, accruedBy };
  for (const slot of tiers) {
    const entry: CommissionEntry = {
      id: newId("cms"),
      kind: "earn",
      userId: slot.userId || "",
      orderId: order.id,
      buyerId: order.userId,
      buyerName: buyer?.name,
      tier: slot.tier,
      ratePercent: slot.ratePercent,
      baseSen,
      amountSen: slot.amountSen,
      paid: slot.paid,
      reason: slot.reason,
      createdAt: now,
    };
    store.commissionLedger.push(entry);
    if (slot.paid && slot.userId && slot.amountSen > 0) {
      const earner = store.users.find((item) => item.id === slot.userId);
      if (earner) {
        earner.commissionBalanceSen = Math.max(0, Math.round(earner.commissionBalanceSen || 0)) + slot.amountSen;
      }
    }
  }
}

export function checkoutOrders(
  userId: string,
  items: CheckoutItem[],
  currencyInput?: string,
  payMethod: PayMethod = "demo",
) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  const settings = getSettings();
  const currency = parseCurrency(currencyInput, settings.defaultCurrency);
  const checkoutId = newId("chk");
  const created: Order[] = [];
  for (const raw of items) {
    const order = buildPendingOrder(userId, raw, currency, settings.fx, checkoutId);
    order.payMethod = payMethod;
    fulfillOrderInStore(store, order, payMethod);
    created.push(order);
    store.orders.push(order);
  }
  writeStore(store);
  return created;
}

export function createPendingCheckout(userId: string, items: CheckoutItem[], currencyInput?: string) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  if (!user.email?.trim()) throw new Error("请先在个人资料填写邮箱后再付款");
  const settings = getSettings();
  const currency = parseCurrency(currencyInput, settings.defaultCurrency);
  const checkoutId = newId("chk");
  const created: Order[] = [];
  for (const raw of items) {
    const order = buildPendingOrder(userId, raw, currency, settings.fx, checkoutId);
    order.payMethod = "billplz";
    created.push(order);
    store.orders.push(order);
  }
  const totalSen = created.reduce((sum, order) => sum + (order.amountSen || 0), 0);
  if (totalSen < 1) {
    store.orders = store.orders.filter((order) => !created.some((item) => item.id === order.id));
    writeStore(store);
    throw new Error("收款金额无效");
  }
  writeStore(store);
  return {
    checkoutId,
    orders: created,
    user,
    totalSen,
    totalMyr: Math.round(totalSen) / 100,
  };
}

export function attachBillToCheckout(
  checkoutId: string,
  bill: { id: string; url: string },
) {
  const store = readStore();
  const targets = store.orders.filter((order) => order.checkoutId === checkoutId);
  if (!targets.length) throw new Error("订单不存在");
  for (const order of targets) {
    order.billplzBillId = bill.id;
    order.billplzUrl = bill.url;
  }
  writeStore(store);
  return targets;
}

export function deleteCheckout(checkoutId: string) {
  const store = readStore();
  store.orders = store.orders.filter((order) => order.checkoutId !== checkoutId);
  writeStore(store);
}

export function fulfillOrdersByBillId(billId: string, paidAt?: string) {
  const store = readStore();
  const targets = store.orders.filter((order) => order.billplzBillId === billId);
  if (!targets.length) throw new Error("订单不存在");
  let changed = false;
  for (const order of targets) {
    if (fulfillOrderInStore(store, order, "billplz", paidAt)) changed = true;
  }
  if (changed) writeStore(store);
  return targets;
}

export function paidOrdersForUser(userId: string) {
  return ordersForUser(userId).filter((order) => isOrderPaid(order));
}

export function ordersForUser(userId: string) {
  return readStore()
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function orderForUser(userId: string, orderId: string) {
  return readStore().orders.find((order) => order.id === orderId && order.userId === userId);
}

export function ordersByBillId(billId: string) {
  return readStore().orders.filter((order) => order.billplzBillId === billId);
}

export function lookupVerifyCode(code: string) {
  const normalized = normalizeCode(code);
  if (normalized.length < 8) return null;
  const store = readStore();
  const secret = process.env.VERIFY_SECRET || store.verifySecret;
  const order = store.orders.find(
    (item) => item.verifyCode && isOrderPaid(item) && codesMatch(item.verifyCode, normalized),
  );
  if (!order) return null;
  const expected = makeVerifyCode(secret, {
    userId: order.userId,
    productSlug: order.productSlug,
    orderId: order.id,
  });
  if (!order.verifyCode || !codesMatch(expected, order.verifyCode)) return null;
  const user = store.users.find((item) => item.id === order.userId);
  return { order, user };
}

export function listAllOrders() {
  const store = readStore();
  return [...store.orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((order) => {
      const user = store.users.find((item) => item.id === order.userId);
      return {
        ...order,
        userName: user?.name,
        userAccount: user ? maskAccount(user) : "已删除用户",
        userEmail: user?.email,
        userPhone: user?.phone,
      };
    });
}

export function listCustomers(query = "") {
  const store = readStore();
  const q = query.trim().toLowerCase();
  return store.users
    .filter((user) => {
      if (!q) return true;
      return [user.name, user.email ?? "", user.phone ?? "", user.id, user.referralCode ?? ""]
        .some((field) => field.toLowerCase().includes(q));
    })
    .map((user) => ({
      ...publicCustomer(user),
      account: maskAccount(user),
      email: user.email,
      phone: user.phone,
      orderCount: store.orders.filter((order) => order.userId === user.id).length,
      paidOrderCount: store.orders.filter((order) => order.userId === user.id && isOrderPaid(order)).length,
      billplzPaidCount: store.orders.filter(
        (order) => order.userId === user.id && isOrderPaid(order) && order.payMethod === "billplz",
      ).length,
      accruedOrderCount: store.orders.filter(
        (order) =>
          order.userId === user.id &&
          Boolean(order.referralSettled?.tiers.some((tier) => tier.paid && tier.amountSen > 0)),
      ).length,
      createdAt: user.createdAt,
      referralCode: user.referralCode,
      referrerId: user.referrerId,
      referrerName: user.referrerId
        ? store.users.find((item) => item.id === user.referrerId)?.name
        : undefined,
      commissionBalanceSen: user.commissionBalanceSen || 0,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getCustomerAdmin(userId: string) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) return null;
  const plan = normalizeReferralPlan(store.referralPlan);
  const upline = walkFullUpline(store.users, user);
  const downline = buildDownlineTree(store.users, user.id);
  return {
    ...publicCustomer(user),
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    referralCode: user.referralCode,
    referrerId: user.referrerId,
    referrerName: user.referrerId ? store.users.find((item) => item.id === user.referrerId)?.name : undefined,
    commissionBalanceSen: user.commissionBalanceSen || 0,
    upline,
    downline,
    earnings: store.commissionLedger
      .filter((row) => row.userId === user.id && row.kind === "earn")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    plan,
    orders: ordersForUser(userId),
  };
}

export function setCustomerReferrer(userId: string, referralCode: string | null) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  if (!referralCode || !normalizeReferralCode(referralCode)) {
    user.referrerId = undefined;
    writeStore(store);
    return publicCustomer(user);
  }
  const referrer = findCustomerByReferralCode(store.users, referralCode);
  if (!referrer) throw new Error("推荐码无效");
  if (referrer.id === user.id) throw new Error("不能填写自己的推荐码");
  if (wouldCreateReferralCycle(store.users, user.id, referrer.id)) throw new Error("推荐关系会形成循环");
  user.referrerId = referrer.id;
  writeStore(store);
  return publicCustomer(user);
}

export function getReferralDashboard(userId: string) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  const plan = normalizeReferralPlan(store.referralPlan);
  const pendingSen = store.withdrawals
    .filter((row) => row.userId === userId && row.status === "requested")
    .reduce((sum, row) => sum + row.amountSen, 0);
  const balanceSen = Math.max(0, Math.round(user.commissionBalanceSen || 0));
  const earnings = store.commissionLedger
    .filter((row) => row.userId === userId && isPayableEarn(row, plan))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const downline = store.users
    .filter((item) => item.referrerId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
    }));
  return {
    referralCode: user.referralCode || "",
    balanceSen,
    pendingSen,
    availableSen: Math.max(0, balanceSen - pendingSen),
    tiers: visiblePlanTiers(plan),
    earnings,
    downline,
    withdrawals: store.withdrawals
      .filter((row) => row.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

export function requestWithdrawal(userId: string, amountSen: number) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  const amount = Math.round(amountSen);
  if (!Number.isFinite(amount) || amount < 1) throw new Error("提现金额无效");
  const pendingSen = store.withdrawals
    .filter((row) => row.userId === userId && row.status === "requested")
    .reduce((sum, row) => sum + row.amountSen, 0);
  const available = Math.max(0, Math.round(user.commissionBalanceSen || 0) - pendingSen);
  if (amount > available) throw new Error("余额不足");
  const row: Withdrawal = {
    id: newId("wd"),
    userId,
    amountSen: amount,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  store.withdrawals.push(row);
  writeStore(store);
  return row;
}

export function listCommissionDesk() {
  const store = readStore();
  const usersById = new Map(store.users.map((user) => [user.id, user]));
  const ordersById = new Map(store.orders.map((order) => [order.id, order]));
  const earnings = [...store.commissionLedger]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((row) => ({
      ...row,
      userName: row.userId ? usersById.get(row.userId)?.name : undefined,
      userAccount: row.userId && usersById.get(row.userId) ? maskAccount(usersById.get(row.userId)!) : undefined,
      orderTitle: row.orderId ? ordersById.get(row.orderId)?.productTitle : undefined,
      chain: row.orderId ? ordersById.get(row.orderId)?.referralSettled : undefined,
      genealogy:
        (row.orderId && ordersById.get(row.orderId)?.referralSettled?.genealogy) ||
        (row.buyerId ? walkFullUpline(store.users, usersById.get(row.buyerId)) : []),
    }));
  const withdrawals = [...store.withdrawals]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((row) => ({
      ...row,
      userName: usersById.get(row.userId)?.name,
      userAccount: usersById.get(row.userId) ? maskAccount(usersById.get(row.userId)!) : undefined,
      balanceSen: usersById.get(row.userId)?.commissionBalanceSen || 0,
    }));
  const accruedSen = store.commissionLedger
    .filter((row) => row.kind === "earn" && row.paid)
    .reduce((sum, row) => sum + row.amountSen, 0);
  const pendingWithdrawSen = store.withdrawals
    .filter((row) => row.status === "requested")
    .reduce((sum, row) => sum + row.amountSen, 0);
  const skippedOrders = store.orders
    .filter((order) => isOrderPaid(order))
    .map((order) => {
      const reason = commissionSkipReason(order);
      if (reason !== "grant" && reason !== "demo" && reason !== "not_billplz" && reason !== "no_upline") return null;
      const buyer = usersById.get(order.userId);
      return {
        id: order.id,
        userId: order.userId,
        userName: buyer?.name,
        productTitle: order.productTitle,
        payMethod: order.payMethod,
        amountSen: order.amountSen || 0,
        amountMyr: order.amountMyr,
        createdAt: order.createdAt,
        reason,
        canAccrue: !order.referralSettled,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return {
    plan: normalizeReferralPlan(store.referralPlan),
    earnings,
    withdrawals,
    accruedSen,
    pendingWithdrawSen,
    skippedOrders,
  };
}

export function settleWithdrawal(id: string, action: "settle" | "reject", note?: string) {
  const store = readStore();
  const row = store.withdrawals.find((item) => item.id === id);
  if (!row) throw new Error("提现记录不存在");
  if (row.status !== "requested") throw new Error("该提现已处理");
  if (action === "reject") {
    row.status = "rejected";
    row.settledAt = new Date().toISOString();
    row.note = note || row.note;
    writeStore(store);
    return row;
  }
  const user = store.users.find((item) => item.id === row.userId);
  if (!user) throw new Error("用户不存在");
  const balance = Math.max(0, Math.round(user.commissionBalanceSen || 0));
  if (row.amountSen > balance) throw new Error("余额不足");
  user.commissionBalanceSen = balance - row.amountSen;
  row.status = "settled";
  row.settledAt = new Date().toISOString();
  row.note = note || row.note;
  store.commissionLedger.push({
    id: newId("cms"),
    kind: "payout",
    userId: user.id,
    amountSen: row.amountSen,
    paid: true,
    createdAt: row.settledAt,
    note: `withdrawal:${row.id}`,
  });
  writeStore(store);
  return row;
}

export function setCustomerStatus(userId: string, status: "active" | "disabled") {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  user.status = status;
  if (status === "disabled") {
    store.sessions = store.sessions.filter((session) => session.userId !== userId);
  }
  writeStore(store);
  return publicCustomer(user);
}

export function resetCustomerPassword(userId: string, password: string) {
  if (password.length < 6) throw new Error("密码至少 6 位");
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  const { salt, hash } = hashPassword(password);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  store.sessions = store.sessions.filter((session) => session.userId !== userId);
  writeStore(store);
  return { ok: true };
}

export function setCustomerMembership(userId: string, memberUntil?: string | null) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  user.memberUntil = memberUntil || undefined;
  writeStore(store);
  return publicCustomer(user);
}

export function grantCourse(
  userId: string,
  productSlug: string,
  currencyInput?: string,
  options?: { accrueCommission?: boolean },
) {
  const item =
    productSlug === membership.slug
      ? { slug: membership.slug, title: membership.title, price: membership.campPrice, qty: 1 }
      : (() => {
          const product = getStoreProduct(productSlug);
          if (!product) throw new Error("课程不存在");
          return { slug: product.slug, title: product.title, price: product.price, qty: 1 };
        })();
  const created = checkoutOrders(userId, [item], currencyInput, "grant");
  if (!options?.accrueCommission) return created;
  return created.map((order) => accrueCommissionForOrder(order.id));
}

export function accrueCommissionForOrder(orderId: string) {
  const store = readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) throw new Error("订单不存在");
  if (!isOrderPaid(order)) throw new Error("订单未支付，不能计提");
  const baseSen = Math.max(0, Math.round(order.amountSen || Math.round((order.amountMyr || 0) * 100)));
  if (baseSen <= 0) throw new Error("订单没有实收令吉，无法计佣");
  order.amountSen = order.amountSen || baseSen;
  order.amountMyr = order.amountMyr ?? baseSen / 100;
  const already = store.commissionLedger.some((row) => row.kind === "earn" && row.orderId === order.id);
  if (already && order.referralSettled) return order;
  creditReferralInStore(store, order, order.payMethod === "billplz" ? "billplz" : "admin");
  writeStore(store);
  return order;
}

export function revokeOrder(userId: string, orderId: string) {
  const store = readStore();
  const order = store.orders.find((item) => item.id === orderId && item.userId === userId);
  if (!order) throw new Error("订单不存在");
  store.orders = store.orders.filter((item) => item.id !== orderId);
  if (order.productSlug === membership.slug) {
    const user = store.users.find((item) => item.id === userId);
    const stillMember = store.orders.some(
      (item) => item.userId === userId && item.productSlug === membership.slug && isOrderPaid(item),
    );
    if (user && !stillMember) user.memberUntil = undefined;
  }
  writeStore(store);
  return { ok: true };
}

export { maskAccount };
