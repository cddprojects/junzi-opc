import "server-only";

import { cache } from "react";
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
  hashPassword,
  makeVerifyCode,
  newId,
} from "@/lib/security";
import { computeLegacyOrderNo } from "@/lib/order-no";
import { paymentKindForPayMethod, type Payment } from "@/lib/payments";
import { requireVerifySecret, usesSupabaseStore } from "@/lib/runtime-store";
import { hashSessionToken } from "@/lib/session-token";
import { ensureCustomerReferral, getSettings, getStoreProduct, readStore, writeStore } from "@/lib/store";
import { fromCny, parseCurrency } from "@/lib/currency";
import {
  buildDownlineTree,
  countDownlineByPayDepth,
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
} from "@/lib/referral";
import {
  applyAdminAdjust,
  asSen,
  applyApproveWithdrawal,
  applyCommissionEarnTx,
  applyCreditTopUp,
  applyDebitTopUpPurchase,
  applyPayWithdrawal,
  applyRejectWithdrawal,
  applyRequestWithdrawal,
  asNonNegSen,
  computeWalletBuckets,
  isWithdrawalHeld,
  type TopUpRecord,
  type WalletBucket,
  type WithdrawalPayout,
} from "@/lib/wallet";

export async function verifySecret() {
  const store = await readStore();
  return requireVerifySecret(store.verifySecret);
}

export async function findCustomerById(id: string) {
  return (await readStore()).users.find((user) => user.id === id);
}

export async function findCustomerByAccount(account: string) {
  let parsed: { email?: string; phone?: string };
  try {
    parsed = parseAccount(account);
  } catch {
    return undefined;
  }
  const { users } = await readStore();
  return users.find(
    (user) =>
      (parsed.email && user.email === parsed.email) || (parsed.phone && user.phone === parsed.phone),
  );
}

export async function registerCustomer(input: {
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
  const store = await readStore();
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
      topUpBalanceSen: 0,
    },
    taken,
  );
  if (user.referrerId && wouldCreateReferralCycle(store.users.concat(user), user.id, user.referrerId)) {
    throw new Error("推荐码无效");
  }
  store.users.push(user);
  const session = createSessionRecord(user.id);
  store.sessions.push(session);
  await writeStore(store);
  return { user: publicCustomer(user), token: session.token };
}

export async function loginCustomer(account: string, password: string) {
  const user = await findCustomerByAccount(account);
  if (!user || !checkPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("账号或密码不正确");
  }
  if (user.status === "disabled") {
    throw new Error("账号已被停用");
  }
  const store = await readStore();
  const session = createSessionRecord(user.id);
  store.sessions = store.sessions.filter((item) => item.userId !== user.id || Date.parse(item.expiresAt) > Date.now());
  store.sessions.push(session);
  await writeStore(store);
  return { user: publicCustomer(user), token: session.token };
}

function createSessionRecord(userId: string): UserSession & { token: string } {
  const token = newId("ses").replace("ses_", "") + newId("x").slice(2);
  return {
    token,
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt: sessionExpiry(),
  };
}

export const customerFromToken = cache(async function customerFromToken(
  token?: string | null,
): Promise<PublicCustomer | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  if (usesSupabaseStore()) {
    const { loadUserBySessionHashFromPg } = await import("@/lib/store-pg");
    const user = await loadUserBySessionHashFromPg(tokenHash);
    if (!user || user.status === "disabled") return null;
    return publicCustomer(user);
  }
  const store = await readStore();
  const session = store.sessions.find((item) => item.tokenHash === tokenHash || item.token === token);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = store.users.find((item) => item.id === session.userId);
  if (!user || user.status === "disabled") return null;
  return publicCustomer(user);
});

export async function revokeSession(token?: string | null) {
  if (!token) return;
  const store = await readStore();
  const tokenHash = hashSessionToken(token);
  store.sessions = store.sessions.filter((item) => item.tokenHash !== tokenHash && item.token !== token);
  await writeStore(store);
}

export async function updateCustomerProfile(
  userId: string,
  patch: { name?: string; email?: string; phone?: string },
) {
  const store = await readStore();
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
  await writeStore(store);
  return publicCustomer(store.users[index]);
}

async function resolveCheckoutItem(item: CheckoutItem) {
  if (item.slug === membership.slug) {
    return {
      slug: membership.slug,
      title: membership.title,
      price: membership.campPrice,
    };
  }
  const product = await getStoreProduct(item.slug);
  if (!product) throw new Error(`商品不存在：${item.slug}`);
  return { slug: product.slug, title: product.title, price: product.price };
}

async function buildPendingOrder(
  userId: string,
  raw: CheckoutItem,
  currency: ReturnType<typeof parseCurrency>,
  fx: Awaited<ReturnType<typeof getSettings>>["fx"],
  checkoutId: string,
  paymentId: string,
): Promise<Order> {
  const item = await resolveCheckoutItem(raw);
  const qty = Math.max(1, Number(raw.qty || 1));
  const priceCny = item.price;
  const price = fromCny(priceCny, currency, fx);
  const amountMyr = fromCny(priceCny * qty, "MYR", fx);
  const amountSen = Math.round(amountMyr * 100);
  const createdAt = new Date().toISOString();
  const id = newId("ord");
  const order: Order = {
    id,
    userId,
    productSlug: item.slug,
    productTitle: item.title,
    price,
    priceCny,
    currency,
    qty,
    createdAt,
    status: "pending",
    checkoutId,
    paymentId,
    amountMyr,
    amountSen,
  };
  order.orderNo = computeLegacyOrderNo(order);
  return order;
}

function fulfillOrderInStore(store: Awaited<ReturnType<typeof readStore>>, order: Order, payMethod: PayMethod, paidAt?: string) {
  if (isOrderPaid(order) && order.verifyCode) return false;
  const secret = requireVerifySecret(store.verifySecret);
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
    if (!order.amountSen && order.amountMyr != null) {
      order.amountSen = Math.round(order.amountMyr * 100);
    }
    const method = order.payMethod || payMethod;
    const source = method === "billplz" ? "billplz" : method === "demo" ? "demo" : "admin";
    creditReferralInStore(store, order, source);
  }
  return true;
}

function creditReferralInStore(
  store: Awaited<ReturnType<typeof readStore>>,
  order: Order,
  accruedBy: "billplz" | "admin" | "demo" = "billplz",
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
      payoutType: slot.payoutType,
      fixedSen: slot.fixedSen,
      baseSen,
      amountSen: slot.amountSen,
      paid: slot.paid,
      reason: slot.reason,
      createdAt: now,
      relationshipSnapshot: {
        buyerReferrerId: buyer?.referrerId,
        earnerId: slot.userId,
        depth: slot.tier,
      },
    };
    store.commissionLedger.push(entry);
    if (slot.paid && slot.userId && slot.amountSen > 0) {
      const earner = store.users.find((item) => item.id === slot.userId);
      if (earner) {
        earner.commissionBalanceSen = asNonNegSen(earner.commissionBalanceSen) + slot.amountSen;
        applyCommissionEarnTx(store, {
          userId: earner.id,
          amountSen: slot.amountSen,
          sourceId: entry.id,
          note: `order:${order.id}`,
          createdAt: now,
          newId,
        });
      }
    }
  }
}

export async function checkoutOrders(
  userId: string,
  items: CheckoutItem[],
  currencyInput?: string,
  payMethod: PayMethod = "demo",
) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  const settings = await getSettings();
  const currency = parseCurrency(currencyInput, settings.defaultCurrency);
  const checkoutId = newId("chk");
  const paymentId = newId("pay");
  const created: Order[] = [];
  for (const raw of items) {
    const order = await buildPendingOrder(userId, raw, currency, settings.fx, checkoutId, paymentId);
    order.payMethod = payMethod;
    fulfillOrderInStore(store, order, payMethod);
    created.push(order);
    store.orders.push(order);
  }
  const { kind, provider } = paymentKindForPayMethod(payMethod);
  const totalSen = created.reduce((sum, order) => sum + (order.amountSen || 0), 0);
  store.payments.push({
    id: paymentId,
    userId,
    kind,
    provider,
    status: "paid",
    amountSen: totalSen,
    checkoutId,
    createdAt: created[0]?.createdAt || new Date().toISOString(),
    paidAt: created[0]?.paidAt || new Date().toISOString(),
  });
  await writeStore(store);
  return created;
}

export async function createPendingCheckout(userId: string, items: CheckoutItem[], currencyInput?: string) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  if (!user.email?.trim()) throw new Error("请先在个人资料填写邮箱后再付款");
  const settings = await getSettings();
  const currency = parseCurrency(currencyInput, settings.defaultCurrency);
  const checkoutId = newId("chk");
  const paymentId = newId("pay");
  const created: Order[] = [];
  for (const raw of items) {
    const order = await buildPendingOrder(userId, raw, currency, settings.fx, checkoutId, paymentId);
    order.payMethod = "billplz";
    created.push(order);
    store.orders.push(order);
  }
  const totalSen = created.reduce((sum, order) => sum + (order.amountSen || 0), 0);
  if (totalSen < 1) {
    store.orders = store.orders.filter((order) => !created.some((item) => item.id === order.id));
    await writeStore(store);
    throw new Error("收款金额无效");
  }
  store.payments.push({
    id: paymentId,
    userId,
    kind: "order_cart",
    provider: "billplz",
    status: "pending",
    amountSen: totalSen,
    checkoutId,
    createdAt: created[0].createdAt,
  });
  await writeStore(store);
  return {
    checkoutId,
    paymentId,
    orders: created,
    user,
    totalSen,
    totalMyr: Math.round(totalSen) / 100,
  };
}

export async function attachBillToCheckout(
  checkoutId: string,
  bill: { id: string; url: string },
) {
  const store = await readStore();
  const payment = store.payments.find((item) => item.checkoutId === checkoutId);
  const targets = store.orders.filter((order) => order.checkoutId === checkoutId);
  if (!targets.length || !payment) throw new Error("订单不存在");
  if (store.billplzBills.some((row) => row.paymentId === payment.id)) {
    throw new Error("该支付已绑定 Billplz 账单");
  }
  store.billplzBills.push({
    id: bill.id,
    paymentId: payment.id,
    url: bill.url,
    amountSen: payment.amountSen,
    status: "created",
    createdAt: new Date().toISOString(),
  });
  for (const order of targets) {
    order.billplzBillId = bill.id;
    order.billplzUrl = bill.url;
    order.paymentId = payment.id;
  }
  await writeStore(store);
  return targets;
}

export async function deleteCheckout(checkoutId: string) {
  const store = await readStore();
  const payment = store.payments.find((item) => item.checkoutId === checkoutId);
  if (payment?.status === "paid") return;
  store.orders = store.orders.filter((order) => order.checkoutId !== checkoutId);
  if (payment && payment.status === "pending") {
    payment.status = "cancelled";
    payment.cancelledAt = new Date().toISOString();
    const bill = store.billplzBills.find((row) => row.paymentId === payment.id);
    if (bill && bill.status === "created") bill.status = "failed";
  }
  await writeStore(store);
}

export async function fulfillOrdersByBillId(billId: string, paidAt?: string) {
  const result = await fulfillBillplzPayment(billId, paidAt, null);
  return result.orders;
}

export async function paidOrdersForUser(userId: string) {
  return (await ordersForUser(userId)).filter((order) => isOrderPaid(order));
}

export async function ordersForUser(userId: string) {
  if (usesSupabaseStore()) {
    const { loadOrdersForUserFromPg } = await import("@/lib/store-pg");
    return loadOrdersForUserFromPg(userId);
  }
  return (await readStore())
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function orderForUser(userId: string, orderId: string) {
  if (usesSupabaseStore()) {
    const { loadOrderForUserFromPg } = await import("@/lib/store-pg");
    return loadOrderForUserFromPg(userId, orderId);
  }
  return (await readStore()).orders.find((order) => order.id === orderId && order.userId === userId);
}

export async function ordersByBillId(billId: string) {
  const store = await readStore();
  const bill = store.billplzBills.find((item) => item.id === billId);
  if (bill) return store.orders.filter((order) => order.paymentId === bill.paymentId);
  return store.orders.filter((order) => order.billplzBillId === billId);
}

export async function lookupVerifyCode(code: string) {
  const normalized = normalizeCode(code);
  if (normalized.length < 8) return null;
  const store = await readStore();
  const secret = requireVerifySecret(store.verifySecret);
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

export const ADMIN_LIST_LIMIT = 200;

function customerListRow(
  user: Customer & { referrerName?: string },
  orders: { userId: string; status?: string; payMethod?: string; referralSettled?: Order["referralSettled"] }[],
) {
  const mine = orders.filter((order) => order.userId === user.id);
  const paid = mine.filter((order) => order.status !== "pending");
  return {
    ...publicCustomer(user),
    account: maskAccount(user),
    email: user.email,
    phone: user.phone,
    orderCount: mine.length,
    paidOrderCount: paid.length,
    billplzPaidCount: paid.filter((order) => order.payMethod === "billplz").length,
    accruedOrderCount: mine.filter((order) =>
      Boolean(order.referralSettled?.tiers.some((tier) => tier.paid && tier.amountSen > 0)),
    ).length,
    createdAt: user.createdAt,
    referralCode: user.referralCode,
    referrerId: user.referrerId,
    referrerName: user.referrerName,
    commissionBalanceSen: user.commissionBalanceSen || 0,
    topUpBalanceSen: user.topUpBalanceSen || 0,
  };
}

export async function listAllOrders() {
  if (usesSupabaseStore()) {
    const { loadOrderListFromPg } = await import("@/lib/store-pg");
    const { orders, extras, users } = await loadOrderListFromPg(ADMIN_LIST_LIMIT);
    const extraById = new Map(extras.map((row) => [row.id, row]));
    return orders.map((order) => {
      const extra = extraById.get(order.id);
      const user = users.find((item) => item.id === order.userId);
      const accountUser = user || {
        name: extra?.userName || "",
        email: extra?.userEmail,
        phone: extra?.userPhone,
      };
      return {
        ...order,
        userName: extra?.userName || user?.name,
        userAccount: user || extra?.userName ? maskAccount(accountUser) : "已删除用户",
        userEmail: extra?.userEmail || user?.email,
        userPhone: extra?.userPhone || user?.phone,
        referralSettled: order.referralSettled
          ? {
              ...order.referralSettled,
              genealogy:
                order.referralSettled.genealogy && order.referralSettled.genealogy.length > 0
                  ? order.referralSettled.genealogy
                  : walkFullUpline(users, user),
            }
          : order.referralSettled,
      };
    });
  }
  const store = await readStore();
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
        referralSettled: order.referralSettled
          ? {
              ...order.referralSettled,
              genealogy:
                order.referralSettled.genealogy && order.referralSettled.genealogy.length > 0
                  ? order.referralSettled.genealogy
                  : walkFullUpline(store.users, user),
            }
          : order.referralSettled,
      };
    });
}

export async function listCustomers(query = "") {
  if (usesSupabaseStore()) {
    const { loadCustomerListFromPg } = await import("@/lib/store-pg");
    const { users, stats } = await loadCustomerListFromPg(query, ADMIN_LIST_LIMIT);
    const slim = stats.map((row) => ({
      userId: String(row.user_id),
      status: row.status == null ? undefined : String(row.status),
      payMethod: row.pay_method == null ? undefined : String(row.pay_method),
      referralSettled: row.referral_settled as Order["referralSettled"],
    }));
    return users.map((user) => customerListRow(user, slim));
  }
  const store = await readStore();
  const q = query.trim().toLowerCase();
  return store.users
    .filter((user) => {
      if (!q) return true;
      return [user.name, user.email ?? "", user.phone ?? "", user.id, user.referralCode ?? ""]
        .some((field) => field.toLowerCase().includes(q));
    })
    .map((user) =>
      customerListRow(
        {
          ...user,
          referrerName: user.referrerId
            ? store.users.find((item) => item.id === user.referrerId)?.name
            : undefined,
        },
        store.orders,
      ),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getAdminHomeStats() {
  if (usesSupabaseStore()) {
    const { loadAdminHomeStatsFromPg } = await import("@/lib/store-pg");
    return loadAdminHomeStatsFromPg();
  }
  const store = await readStore();
  const paid = store.orders.filter(isOrderPaid);
  return {
    userCount: store.users.length,
    orderCount: store.orders.length,
    paidCount: paid.length,
    pendingCount: store.orders.length - paid.length,
    paidMyr: paid.reduce((sum, order) => sum + (order.amountMyr ?? 0), 0),
    accruedSen: store.commissionLedger
      .filter((row) => row.kind === "earn" && row.paid)
      .reduce((sum, row) => sum + row.amountSen, 0),
  };
}

export async function getCustomerAdmin(userId: string) {
  const store = await readStore();
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
    topUpBalanceSen: user.topUpBalanceSen || 0,
    wallet: computeWalletBuckets(user, store.withdrawals),
    upline,
    downline,
    earnings: store.commissionLedger
      .filter((row) => row.userId === user.id && row.kind === "earn")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    withdrawals: store.withdrawals
      .filter((row) => row.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    walletTransactions: store.walletTransactions
      .filter((row) => row.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    topUps: store.topUps
      .filter((row) => row.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    plan,
    orders: await ordersForUser(userId),
  };
}

export async function setCustomerReferrer(userId: string, referralCode: string | null) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  if (!referralCode || !normalizeReferralCode(referralCode)) {
    user.referrerId = undefined;
    await writeStore(store);
    return publicCustomer(user);
  }
  const referrer = findCustomerByReferralCode(store.users, referralCode);
  if (!referrer) throw new Error("推荐码无效");
  if (referrer.id === user.id) throw new Error("不能填写自己的推荐码");
  if (wouldCreateReferralCycle(store.users, user.id, referrer.id)) throw new Error("推荐关系会形成循环");
  user.referrerId = referrer.id;
  await writeStore(store);
  return publicCustomer(user);
}

export async function getReferralDashboard(userId: string) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  const plan = normalizeReferralPlan(store.referralPlan);
  const wallet = computeWalletBuckets(user, store.withdrawals);
  const pendingSen = wallet.pendingWithdrawalSen;
  const balanceSen = wallet.commissionBalanceSen;
  const earnings = store.commissionLedger
    .filter((row) => row.userId === userId && isPayableEarn(row, plan))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((row) => {
      const order = row.orderId ? store.orders.find((item) => item.id === row.orderId) : undefined;
      return {
        ...row,
        orderTitle: order?.productTitle,
      };
    });
  const team = countDownlineByPayDepth(store.users, user.id);
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
    availableSen: wallet.availableToWithdrawSen,
    wallet,
    tiers: visiblePlanTiers(plan),
    earnings,
    team,
    downline,
    withdrawals: store.withdrawals
      .filter((row) => row.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

export async function requestWithdrawal(userId: string, amountSen: number, payout?: WithdrawalPayout) {
  const store = await readStore();
  store.walletTransactions ||= [];
  store.topUps ||= [];
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  const row = applyRequestWithdrawal(store, { userId, amountSen, payout, newId });
  await writeStore(store);
  return row;
}

async function commissionDeskFromSlice(store: {
  users: Awaited<ReturnType<typeof readStore>>["users"];
  orders: Awaited<ReturnType<typeof readStore>>["orders"];
  commissionLedger: Awaited<ReturnType<typeof readStore>>["commissionLedger"];
  withdrawals: Awaited<ReturnType<typeof readStore>>["withdrawals"];
  referralPlan: Awaited<ReturnType<typeof readStore>>["referralPlan"];
}) {
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
    .filter((row) => isWithdrawalHeld(row.status))
    .reduce((sum, row) => sum + row.amountSen, 0);
  const paidWithdrawSen = store.withdrawals
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amountSen, 0);
  const commissionBalanceSen = store.users.reduce((sum, user) => sum + asNonNegSen(user.commissionBalanceSen), 0);
  const topUpBalanceSen = store.users.reduce((sum, user) => sum + asNonNegSen(user.topUpBalanceSen), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthCommissionSen = store.commissionLedger
    .filter((row) => row.kind === "earn" && row.paid && Date.parse(row.createdAt) >= monthStart.getTime())
    .reduce((sum, row) => sum + row.amountSen, 0);
  const roots = store.users.filter((user) => !user.referrerId).length;
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
    paidWithdrawSen,
    commissionBalanceSen,
    topUpBalanceSen,
    monthCommissionSen,
    referralRoots: roots,
    referralCount: store.users.filter((user) => Boolean(user.referrerId)).length,
    skippedOrders,
  };
}

export async function listCommissionDesk() {
  if (usesSupabaseStore()) {
    const { loadCommissionDeskTablesFromPg } = await import("@/lib/store-pg");
    return commissionDeskFromSlice(await loadCommissionDeskTablesFromPg());
  }
  return commissionDeskFromSlice(await readStore());
}

export async function settleWithdrawal(id: string, action: "settle" | "reject" | "approve" | "pay", note?: string) {
  const store = await readStore();
  if (action === "reject") {
    const row = applyRejectWithdrawal(store, { id, note, newId });
    await writeStore(store);
    return row;
  }
  if (action === "approve") {
    const row = applyApproveWithdrawal(store, id);
    await writeStore(store);
    return row;
  }
  const row = applyPayWithdrawal(store, { id, note, newId });
  const already = store.commissionLedger.some(
    (item) => item.kind === "payout" && item.note === `withdrawal:${id}`,
  );
  if (!already) {
    store.commissionLedger.push({
      id: newId("cms"),
      kind: "payout",
      userId: row.userId,
      amountSen: row.amountSen,
      paid: true,
      createdAt: row.paidAt || new Date().toISOString(),
      note: `withdrawal:${row.id}`,
    });
  }
  await writeStore(store);
  return row;
}

export async function getWalletDashboard(userId: string) {
  if (usesSupabaseStore()) {
    const { loadWalletDashboardFromPg } = await import("@/lib/store-pg");
    const loaded = await loadWalletDashboardFromPg(userId);
    if (!loaded.user) throw new Error("请先登录");
    const wallet = computeWalletBuckets(loaded.user, loaded.withdrawals);
    return {
      ...wallet,
      transactions: loaded.walletTransactions,
      topUps: loaded.topUps,
      withdrawals: loaded.withdrawals.slice(0, 20),
    };
  }
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  const wallet = computeWalletBuckets(user, store.withdrawals);
  return {
    ...wallet,
    transactions: store.walletTransactions
      .filter((row) => row.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 40),
    topUps: store.topUps
      .filter((row) => row.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 20),
    withdrawals: store.withdrawals
      .filter((row) => row.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 20),
  };
}

export async function createPendingTopUp(userId: string, amountSen: number) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  if (!user.email?.trim()) throw new Error("请先在个人资料填写邮箱后再付款");
  const amount = asNonNegSen(amountSen);
  if (amount < 100) throw new Error("充值金额无效");
  const paymentId = newId("pay");
  const row: TopUpRecord = {
    id: newId("tup"),
    userId,
    paymentId,
    amountSen: amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.payments.push({
    id: paymentId,
    userId,
    kind: "topup",
    provider: "billplz",
    status: "pending",
    amountSen: amount,
    createdAt: row.createdAt,
  });
  store.topUps.push(row);
  await writeStore(store);
  return { topUp: row, user };
}

export async function attachBillToTopUp(topUpId: string, bill: { id: string; url: string }) {
  const store = await readStore();
  const row = store.topUps.find((item) => item.id === topUpId);
  if (!row) throw new Error("充值单不存在");
  const payment = store.payments.find((item) => item.id === row.paymentId);
  if (!payment) throw new Error("充值支付单不存在");
  if (store.billplzBills.some((item) => item.paymentId === payment.id)) {
    throw new Error("该支付已绑定 Billplz 账单");
  }
  row.billplzBillId = bill.id;
  row.billplzUrl = bill.url;
  store.billplzBills.push({
    id: bill.id,
    paymentId: payment.id,
    url: bill.url,
    amountSen: payment.amountSen,
    status: "created",
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);
  return row;
}

export async function deletePendingTopUp(topUpId: string) {
  const store = await readStore();
  store.topUps = store.topUps.filter((row) => row.id !== topUpId || row.status === "credited");
  await writeStore(store);
}

export async function creditTopUpByBillId(billId: string, reportedAmountSen?: number | null, paidAt?: string) {
  const result = await fulfillBillplzPayment(billId, paidAt, reportedAmountSen);
  return result.kind === "topup" ? result.topUp : null;
}

export async function topUpByBillId(billId: string) {
  const store = await readStore();
  const bill = store.billplzBills.find((item) => item.id === billId);
  if (bill) return store.topUps.find((item) => item.paymentId === bill.paymentId);
  return store.topUps.find((item) => item.billplzBillId === billId);
}

export type FulfillBillplzResult = {
  kind: "topup" | "order" | "amount_mismatch" | "already_paid" | "ignored" | "awaiting_amount";
  topUp: TopUpRecord | null;
  orders: Order[];
  payment?: Payment;
};

function persistAmountMismatch(
  store: Awaited<ReturnType<typeof readStore>>,
  payment: Payment,
  billId: string,
  expected: number,
  received: number | null,
) {
  const now = new Date().toISOString();
  payment.status = "amount_mismatch";
  payment.expectedAmountSen = expected;
  payment.receivedAmountSen = received;
  payment.mismatchBillplzBillId = billId;
  payment.callbackReceivedAt = now;
}

export async function fulfillBillplzPayment(
  billId: string,
  paidAt?: string,
  reportedAmountSen?: number | null,
): Promise<FulfillBillplzResult> {
  const store = await readStore();
  const bill = store.billplzBills.find((item) => item.id === billId);
  const payment = bill
    ? store.payments.find((item) => item.id === bill.paymentId)
    : store.payments.find((item) =>
        store.orders.some((order) => order.billplzBillId === billId && order.paymentId === item.id),
      ) || store.topUps.find((row) => row.billplzBillId === billId)?.paymentId
      ? store.payments.find(
          (item) => item.id === store.topUps.find((row) => row.billplzBillId === billId)?.paymentId,
        )
      : undefined;

  if (!payment) {
    throw new Error("订单不存在");
  }
  if (bill) bill.lastCallbackAt = new Date().toISOString();

  const relatedOrders = store.orders.filter((order) => order.paymentId === payment.id);
  const relatedTopUp = store.topUps.find((row) => row.paymentId === payment.id);

  if (payment.status === "paid") {
    await writeStore(store);
    return {
      kind: "already_paid",
      topUp: relatedTopUp || null,
      orders: relatedOrders,
      payment,
    };
  }
  if (payment.status === "cancelled" || payment.status === "failed") {
    await writeStore(store);
    return { kind: "ignored", topUp: relatedTopUp || null, orders: relatedOrders, payment };
  }

  if (reportedAmountSen == null) {
    await writeStore(store);
    return { kind: "awaiting_amount", topUp: relatedTopUp || null, orders: relatedOrders, payment };
  }

  const expected = asSen(payment.amountSen);
  const received = asSen(reportedAmountSen);
  if (received !== expected) {
    persistAmountMismatch(store, payment, billId, expected, received);
    await writeStore(store);
    return { kind: "amount_mismatch", topUp: relatedTopUp || null, orders: relatedOrders, payment };
  }

  if (payment.status === "amount_mismatch") {
    payment.status = "pending";
  }

  if (payment.kind === "topup") {
    if (!relatedTopUp) throw new Error("充值单不存在");
    applyCreditTopUp(store, {
      topUpId: relatedTopUp.id,
      reportedAmountSen: received,
      paidAt,
      newId,
    });
    payment.status = "paid";
    payment.paidAt = paidAt || new Date().toISOString();
    if (bill) {
      bill.status = "paid";
      bill.paidAt = payment.paidAt;
    }
    await writeStore(store);
    return {
      kind: "topup",
      topUp: store.topUps.find((item) => item.id === relatedTopUp.id) || relatedTopUp,
      orders: [],
      payment,
    };
  }

  if (!relatedOrders.length) throw new Error("订单不存在");
  for (const order of relatedOrders) {
    fulfillOrderInStore(store, order, "billplz", paidAt);
  }
  payment.status = "paid";
  payment.paidAt = paidAt || new Date().toISOString();
  if (bill) {
    bill.status = "paid";
    bill.paidAt = payment.paidAt;
  }
  await writeStore(store);
  return { kind: "order", topUp: null, orders: relatedOrders, payment };
}

export async function checkoutWithWallet(userId: string, items: CheckoutItem[], currencyInput?: string) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  if (user.status === "disabled") throw new Error("账号已被停用");
  const settings = await getSettings();
  const currency = parseCurrency(currencyInput, settings.defaultCurrency);
  const checkoutId = newId("chk");
  const paymentId = newId("pay");
  const created: Order[] = [];
  let totalSen = 0;
  for (const raw of items) {
    const order = await buildPendingOrder(userId, raw, currency, settings.fx, checkoutId, paymentId);
    order.payMethod = "wallet";
    created.push(order);
    totalSen += order.amountSen || 0;
  }
  applyDebitTopUpPurchase(store, {
    userId,
    amountSen: totalSen,
    sourceId: checkoutId,
    note: "wallet_purchase_topup_only",
    newId,
  });
  for (const order of created) {
    fulfillOrderInStore(store, order, "wallet");
    store.orders.push(order);
  }
  store.payments.push({
    id: paymentId,
    userId,
    kind: "wallet_cart",
    provider: "wallet",
    status: "paid",
    amountSen: totalSen,
    checkoutId,
    createdAt: created[0]?.createdAt || new Date().toISOString(),
    paidAt: new Date().toISOString(),
  });
  await writeStore(store);
  return created;
}

export async function adjustUserWallet(
  userId: string,
  input: { bucket: WalletBucket; amountSen: number; reason: string },
) {
  const store = await readStore();
  const wallet = applyAdminAdjust(store, { ...input, userId, newId });
  if (input.bucket === "commission") {
    store.commissionLedger.push({
      id: newId("cms"),
      kind: "adjust",
      userId,
      amountSen: asNonNegSen(Math.abs(input.amountSen)),
      paid: input.amountSen > 0,
      createdAt: new Date().toISOString(),
      note: input.reason,
    });
  }
  await writeStore(store);
  return wallet;
}

export async function listReferralNetwork(rootId?: string) {
  const store = await readStore();
  const roots = rootId
    ? store.users.filter((user) => user.id === rootId)
    : store.users.filter((user) => !user.referrerId);
  return {
    plan: normalizeReferralPlan(store.referralPlan),
    trees: roots.map((root) => ({
      userId: root.id,
      name: root.name,
      code: root.referralCode,
      status: root.status,
      children: buildDownlineTree(store.users, root.id),
    })),
    users: store.users.map((user) => ({
      id: user.id,
      name: user.name,
      code: user.referralCode,
      referrerId: user.referrerId,
      status: user.status,
    })),
  };
}

export async function getOrderAdmin(orderId: string) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  const buyer = store.users.find((item) => item.id === order.userId);
  const genealogy = order.referralSettled?.genealogy || walkFullUpline(store.users, buyer);
  return {
    ...order,
    userName: buyer?.name,
    userAccount: buyer ? maskAccount(buyer) : undefined,
    genealogy,
    earnings: store.commissionLedger.filter((row) => row.orderId === order.id),
  };
}

export async function setCustomerStatus(userId: string, status: "active" | "disabled") {
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  user.status = status;
  if (status === "disabled") {
    store.sessions = store.sessions.filter((session) => session.userId !== userId);
  }
  await writeStore(store);
  return publicCustomer(user);
}

export async function resetCustomerPassword(userId: string, password: string) {
  if (password.length < 6) throw new Error("密码至少 6 位");
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  const { salt, hash } = hashPassword(password);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  store.sessions = store.sessions.filter((session) => session.userId !== userId);
  await writeStore(store);
  return { ok: true };
}

export async function setCustomerMembership(userId: string, memberUntil?: string | null) {
  const store = await readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  user.memberUntil = memberUntil || undefined;
  await writeStore(store);
  return publicCustomer(user);
}

export async function grantCourse(userId: string, productSlug: string, currencyInput?: string) {
  const item =
    productSlug === membership.slug
      ? { slug: membership.slug, title: membership.title, price: membership.campPrice, qty: 1 }
      : await (async () => {
          const product = await getStoreProduct(productSlug);
          if (!product) throw new Error("课程不存在");
          return { slug: product.slug, title: product.title, price: product.price, qty: 1 };
        })();
  return checkoutOrders(userId, [item], currencyInput, "grant");
}

export async function accrueCommissionForOrder(orderId: string) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) throw new Error("订单不存在");
  if (!isOrderPaid(order)) throw new Error("订单未支付，不能计提");
  const baseSen = Math.max(0, Math.round(order.amountSen || Math.round((order.amountMyr || 0) * 100)));
  if (baseSen <= 0) throw new Error("订单没有实收令吉，无法计佣");
  order.amountSen = order.amountSen || baseSen;
  order.amountMyr = order.amountMyr ?? baseSen / 100;
  const already = store.commissionLedger.some((row) => row.kind === "earn" && row.orderId === order.id);
  if (already && order.referralSettled) return order;
  const source =
    order.payMethod === "billplz" ? "billplz" : order.payMethod === "demo" ? "demo" : "admin";
  creditReferralInStore(store, order, source);
  await writeStore(store);
  return order;
}

export async function revokeOrder(userId: string, orderId: string) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId && item.userId === userId);
  if (!order) throw new Error("订单不存在");
  store.orders = store.orders.filter((item) => item.id !== orderId);
  if (order.paymentId) {
    const payment = store.payments.find((item) => item.id === order.paymentId);
    const remaining = store.orders.filter((item) => item.paymentId === order.paymentId);
    if (payment && payment.status !== "paid" && remaining.length === 0) {
      payment.status = "cancelled";
      payment.cancelledAt = new Date().toISOString();
    }
  }
  if (order.productSlug === membership.slug) {
    const user = store.users.find((item) => item.id === userId);
    const stillMember = store.orders.some(
      (item) => item.userId === userId && item.productSlug === membership.slug && isOrderPaid(item),
    );
    if (user && !stillMember) user.memberUntil = undefined;
  }
  await writeStore(store);
  return { ok: true };
}

export { maskAccount };
