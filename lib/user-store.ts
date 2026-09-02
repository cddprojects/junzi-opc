import "server-only";

import { membership } from "@/lib/data";
import {
  type CheckoutItem,
  type Customer,
  type Order,
  type PublicCustomer,
  type UserSession,
  isMemberActive,
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
import { getStoreProduct, readStore, writeStore } from "@/lib/store";

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
  return user ? publicCustomer(user) : null;
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

export function checkoutOrders(userId: string, items: CheckoutItem[]) {
  if (!items.length) throw new Error("没有可结算的商品");
  const store = readStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new Error("请先登录");
  const secret = process.env.VERIFY_SECRET || store.verifySecret || generateVerifySecret();
  if (!store.verifySecret) store.verifySecret = secret;

  const created: Order[] = [];
  for (const raw of items) {
    const item = resolveCheckoutItem(raw);
    const qty = Math.max(1, Number(raw.qty || 1));
    const orderId = newId("ord");
    const order: Order = {
      id: orderId,
      userId,
      productSlug: item.slug,
      productTitle: item.title,
      price: item.price,
      qty,
      createdAt: new Date().toISOString(),
      verifyCode: makeVerifyCode(secret, {
        userId,
        productSlug: item.slug,
        orderId,
      }),
    };
    created.push(order);
    store.orders.push(order);
    const productIndex = store.products.findIndex((product) => product.slug === item.slug);
    if (productIndex >= 0) {
      store.products[productIndex] = {
        ...store.products[productIndex],
        sales: (store.products[productIndex].sales || 0) + qty,
      };
    }
    if (item.slug === membership.slug) {
      const base = isMemberActive(user) && user.memberUntil ? Date.parse(user.memberUntil) : Date.now();
      user.memberUntil = new Date(base + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  writeStore(store);
  return created;
}

export function ordersForUser(userId: string) {
  return readStore()
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function lookupVerifyCode(code: string) {
  const normalized = normalizeCode(code);
  if (normalized.length < 8) return null;
  const store = readStore();
  const secret = process.env.VERIFY_SECRET || store.verifySecret;
  const order = store.orders.find((item) => codesMatch(item.verifyCode, normalized));
  if (!order) return null;
  const expected = makeVerifyCode(secret, {
    userId: order.userId,
    productSlug: order.productSlug,
    orderId: order.id,
  });
  if (!codesMatch(expected, order.verifyCode)) return null;
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

export function listCustomers() {
  const store = readStore();
  return store.users.map((user) => ({
    ...publicCustomer(user),
    account: maskAccount(user),
    orderCount: store.orders.filter((order) => order.userId === user.id).length,
    createdAt: user.createdAt,
  }));
}

export { maskAccount };
