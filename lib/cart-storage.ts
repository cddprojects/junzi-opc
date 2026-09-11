import type { Product } from "@/lib/data";

export type CartItem = { slug: string; qty: number; product: Product };

const CART_PREFIX = "opc-cart-v1";
const FAV_PREFIX = "opc-fav-v1";

function scope(userId?: string | null) {
  return userId || "guest";
}

export function cartStorageKey(userId?: string | null) {
  return `${CART_PREFIX}:${scope(userId)}`;
}

export function favStorageKey(userId?: string | null) {
  return `${FAV_PREFIX}:${scope(userId)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function asProduct(value: unknown): Product | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Product>;
  if (!item.slug || !item.title || typeof item.price !== "number") return null;
  return item as Product;
}

export function readStoredCart(userId?: string | null): CartItem[] {
  const parsed = readJson<unknown[]>(cartStorageKey(userId), []);
  if (!Array.isArray(parsed)) return [];
  const rows: CartItem[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<CartItem>;
    const product = asProduct(item.product);
    const slug = String(item.slug || product?.slug || "");
    const qty = Number(item.qty);
    if (!product || !slug || !Number.isFinite(qty) || qty < 1) continue;
    rows.push({ slug, qty: Math.min(99, Math.floor(qty)), product });
  }
  return rows;
}

export function writeStoredCart(userId: string | null | undefined, cart: CartItem[]) {
  writeJson(cartStorageKey(userId), cart);
}

export function readStoredFavorites(userId?: string | null): string[] {
  const parsed = readJson<unknown[]>(favStorageKey(userId), []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function writeStoredFavorites(userId: string | null | undefined, favorites: string[]) {
  writeJson(favStorageKey(userId), favorites);
}

export function mergeCarts(primary: CartItem[], incoming: CartItem[]) {
  const next = primary.map((row) => ({ ...row }));
  for (const row of incoming) {
    const existing = next.find((item) => item.slug === row.slug);
    if (existing) existing.qty = Math.min(99, existing.qty + row.qty);
    else next.push({ ...row });
  }
  return next;
}
