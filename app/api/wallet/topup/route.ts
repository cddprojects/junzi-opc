import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { appBaseUrl, createBillplzBill, isBillplzConfigured } from "@/lib/billplz";
import { persistBillplzTopUp, prepareBillplzTopUp } from "@/lib/user-store";
import { asSen, formatMyrSen } from "@/lib/wallet";

export async function POST(request: Request) {
  const started = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!isBillplzConfigured()) {
    return NextResponse.json({ error: "请先配置 Billplz 收款" }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { amountSen?: number; amountMyr?: number } | null;
  const amountSen =
    body?.amountSen != null ? asSen(body.amountSen) : asSen(Math.round(Number(body?.amountMyr || 0) * 100));
  try {
    const pending = await prepareBillplzTopUp(user, amountSen);
    console.info("[topup] prepare", `${Date.now() - started}ms`);
    const origin = appBaseUrl(request);
    const bill = await createBillplzBill({
      name: pending.user.name,
      email: pending.user.email || "",
      amountSen: pending.topUp.amountSen,
      description: `Wallet top-up ${formatMyrSen(pending.topUp.amountSen)}`.slice(0, 200),
      callbackUrl: `${origin}/api/billplz/callback`,
      redirectUrl: `${origin}/pay/return?topup=${encodeURIComponent(pending.topUp.id)}`,
      reference: `topup:${pending.topUp.id}`,
    });
    console.info("[topup] billplz", `${Date.now() - started}ms`);
    await persistBillplzTopUp(pending, bill);
    console.info("[topup] persist", `${Date.now() - started}ms`);
    return NextResponse.json({
      mode: "billplz",
      redirectUrl: bill.url,
      topUpId: pending.topUp.id,
      amountSen: pending.topUp.amountSen,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "结算失败" }, { status: 400 });
  }
}
