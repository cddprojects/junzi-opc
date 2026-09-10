import { NextResponse } from "next/server";
import type { CheckoutItem } from "@/lib/account";
import { getCurrentUser } from "@/lib/user-auth";
import {
  allowDemoPay,
  appBaseUrl,
  createBillplzBill,
  isBillplzConfigured,
} from "@/lib/billplz";
import {
  attachBillToCheckout,
  checkoutOrders,
  checkoutWithWallet,
  createPendingCheckout,
  deleteCheckout,
} from "@/lib/user-store";
import { formatMoneyAmount } from "@/lib/currency";

function publicOrder(order: {
  id: string;
  productSlug: string;
  productTitle: string;
  price: number;
  priceCny?: number;
  currency?: string;
  qty: number;
  verifyCode?: string;
  createdAt: string;
  status?: string;
  amountMyr?: number;
  amountSen?: number;
}) {
  return {
    id: order.id,
    productSlug: order.productSlug,
    productTitle: order.productTitle,
    price: order.price,
    priceCny: order.priceCny,
    currency: order.currency,
    qty: order.qty,
    verifyCode: order.verifyCode,
    createdAt: order.createdAt,
    status: order.status,
    amountMyr: order.amountMyr,
    amountSen: order.amountSen,
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    items?: CheckoutItem[];
    currency?: string;
    payWith?: "wallet" | "billplz";
  } | null;

  try {
    if (body?.payWith === "wallet") {
      const orders = await checkoutWithWallet(user.id, body?.items || [], body?.currency);
      return NextResponse.json({
        mode: "wallet",
        orders: orders.map(publicOrder),
      });
    }
    if (isBillplzConfigured()) {
      const pending = await createPendingCheckout(user.id, body?.items || [], body?.currency);
      const origin = appBaseUrl(request);
      try {
        const bill = await createBillplzBill({
          name: pending.user.name,
          email: pending.user.email || "",
          amountSen: pending.totalSen,
          description: pending.orders
            .map((order) => `${order.productTitle}×${order.qty}`)
            .join(" / ")
            .slice(0, 200),
          callbackUrl: `${origin}/api/billplz/callback`,
          redirectUrl: `${origin}/pay/return?checkout=${encodeURIComponent(pending.checkoutId)}`,
          reference: pending.checkoutId,
        });
        const orders = await attachBillToCheckout(pending.checkoutId, bill);
        return NextResponse.json({
          mode: "billplz",
          redirectUrl: bill.url,
          checkoutId: pending.checkoutId,
          charge: {
            currency: "MYR",
            myr: pending.totalMyr,
            sen: pending.totalSen,
            formatted: formatMoneyAmount(pending.totalMyr, "MYR"),
          },
          orders: orders.map(publicOrder),
        });
      } catch (error) {
        await deleteCheckout(pending.checkoutId);
        throw error;
      }
    }

    if (allowDemoPay()) {
      const orders = await checkoutOrders(user.id, body?.items || [], body?.currency, "demo");
      return NextResponse.json({
        mode: "demo",
        orders: orders.map(publicOrder),
      });
    }

    return NextResponse.json({ error: "请先配置 Billplz 收款" }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "结算失败" }, { status: 400 });
  }
}
