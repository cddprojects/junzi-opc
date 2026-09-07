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
import { getSettings, getStoreProduct, readStore, writeStore } from "@/lib/store";
import { fromCny, parseCurrency } from "@/lib/currency";

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
  const user: Customer = {
    id: newId("usr"),
    name,
    email: account.email,
    phone: account.phone,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    status: "active",
  };
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
  }
  return true;
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
      return [user.name, user.email ?? "", user.phone ?? "", user.id]
        .some((field) => field.toLowerCase().includes(q));
    })
    .map((user) => ({
      ...publicCustomer(user),
      account: maskAccount(user),
      email: user.email,
      phone: user.phone,
      orderCount: store.orders.filter((order) => order.userId === user.id).length,
      createdAt: user.createdAt,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getCustomerAdmin(userId: string) {
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) return null;
  return {
    ...publicCustomer(user),
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    orders: ordersForUser(userId),
  };
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

export function grantCourse(userId: string, productSlug: string, currencyInput?: string) {
  const item =
    productSlug === membership.slug
      ? { slug: membership.slug, title: membership.title, price: membership.campPrice, qty: 1 }
      : (() => {
          const product = getStoreProduct(productSlug);
          if (!product) throw new Error("课程不存在");
          return { slug: product.slug, title: product.title, price: product.price, qty: 1 };
        })();
  return checkoutOrders(userId, [item], currencyInput, "grant");
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
