import { membership, type Product } from "@/lib/data";
import type { OrderReferralSettled } from "@/lib/referral";

export const USER_COOKIE = "opc_user_session";
export const SESSION_DAYS = 14;

export type CustomerStatus = "active" | "disabled";

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  memberUntil?: string;
  status?: CustomerStatus;
  referralCode?: string;
  referrerId?: string;
  commissionBalanceSen?: number;
};

export type PublicCustomer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  memberUntil?: string;
  memberActive: boolean;
  status: CustomerStatus;
};

export type UserSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type OrderStatus = "pending" | "paid";
export type PayMethod = "billplz" | "demo" | "grant";

export type Order = {
  id: string;
  userId: string;
  productSlug: string;
  productTitle: string;
  price: number;
  qty: number;
  createdAt: string;
  verifyCode?: string;
  currency?: string;
  priceCny?: number;
  status?: OrderStatus;
  paidAt?: string;
  payMethod?: PayMethod;
  checkoutId?: string;
  billplzBillId?: string;
  billplzUrl?: string;
  amountMyr?: number;
  amountSen?: number;
  referralSettled?: OrderReferralSettled;
  referralSkip?: { reason: "demo" | "grant" | "not_billplz" };
};

export function isOrderPaid(order?: Order | null) {
  if (!order) return false;
  if (order.status === "pending") return false;
  return (order.status ?? "paid") === "paid";
}

export type CheckoutItem = {
  slug: string;
  title: string;
  titleEn?: string;
  price: number;
  qty?: number;
};

export function parseAccount(input: string): { email?: string; phone?: string } {
  const value = input.trim();
  if (!value) return {};
  if (value.includes("@")) {
    const email = value.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("邮箱格式不正确");
    }
    return { email };
  }
  const phone = value.replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 6) {
    throw new Error("请填写邮箱或有效手机号");
  }
  return { phone };
}

export function publicCustomer(user: Customer): PublicCustomer {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    memberUntil: user.memberUntil,
    memberActive: isMemberActive(user),
    status: user.status === "disabled" ? "disabled" : "active",
  };
}

export function isMemberActive(user: Pick<Customer, "memberUntil">) {
  if (!user.memberUntil) return false;
  return new Date(user.memberUntil).getTime() > Date.now();
}

export function maskAccount(user: Pick<Customer, "email" | "phone" | "name">) {
  if (user.email) {
    const [name, domain] = user.email.split("@");
    const head = name.slice(0, 1);
    return `${head}***@${domain}`;
  }
  if (user.phone) {
    const digits = user.phone.replace(/\D/g, "");
    return `****${digits.slice(-4)}`;
  }
  return user.name;
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function normalizeCode(input: string) {
  const compact = input
    .trim()
    .toUpperCase()
    .replace(/[O]/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/[^0-9A-Z]/g, "");
  return compact.startsWith("JX") ? compact.slice(2) : compact;
}

export function formatCode(raw: string) {
  const compact = normalizeCode(raw);
  const chunks = compact.match(/.{1,4}/g) || [];
  return `JX-${chunks.join("-")}`;
}

export function memberCheckoutItem(): CheckoutItem {
  return {
    slug: membership.slug,
    title: membership.title,
    titleEn: membership.titleEn,
    price: membership.campPrice,
    qty: 1,
  };
}

export function productToCheckout(product: Pick<Product, "slug" | "title" | "titleEn" | "price">): CheckoutItem {
  return { slug: product.slug, title: product.title, titleEn: product.titleEn, price: product.price, qty: 1 };
}
