import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/store";
import { orderSearchBlob, publicOrderNo } from "@/lib/orders-ui";
import { listAllOrders, listCustomers } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json({ items: [] });

  const { products } = await getCatalog();
  const users = await listCustomers();
  const orders = await listAllOrders();
  const items: { href: string; title: string; hint: string }[] = [];

  for (const product of products) {
    const blob = `${product.title} ${product.titleEn || ""} ${product.slug}`.toLowerCase();
    if (blob.includes(q)) {
      items.push({ href: `/admin/products/${product.slug}`, title: product.title, hint: product.slug });
    }
  }
  for (const user of users) {
    const blob = `${user.name} ${user.email || ""} ${user.phone || ""} ${user.account}`.toLowerCase();
    if (blob.includes(q)) {
      items.push({ href: `/admin/users/${user.id}`, title: user.name, hint: user.account });
    }
  }
  for (const order of orders) {
    if (orderSearchBlob(order).includes(q)) {
      items.push({
        href: `/admin/orders/${order.id}`,
        title: publicOrderNo(order) || order.productTitle,
        hint: `${order.productTitle} · ${order.userName || order.id}`,
      });
    }
  }

  return NextResponse.json({ items: items.slice(0, 8) });
}
