import { NextResponse } from "next/server";
import type { CheckoutItem } from "@/lib/account";
import { getCurrentUser } from "@/lib/user-auth";
import { checkoutOrders } from "@/lib/user-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { items?: CheckoutItem[] } | null;
  try {
    const orders = checkoutOrders(user.id, body?.items || []);
    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        productSlug: order.productSlug,
        productTitle: order.productTitle,
        price: order.price,
        qty: order.qty,
        verifyCode: order.verifyCode,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "结算失败" }, { status: 400 });
  }
}
