import "server-only";

import { isAdminRequest } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-auth";
import { paidOrdersForUser } from "@/lib/user-store";

export async function courseAccess(productSlug: string) {
  const admin = await isAdminRequest();
  const user = await getCurrentUser();
  const owned = user
    ? (await paidOrdersForUser(user.id)).some((order) => order.productSlug === productSlug)
    : false;
  return {
    admin,
    user,
    owned,
    canWatch: admin || owned,
  };
}

export function recordedProducts<T extends { detail?: { lessons?: unknown[] } }>(products: T[]) {
  return products.filter((product) => (product.detail?.lessons?.length || 0) > 0);
}
