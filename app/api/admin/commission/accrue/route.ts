import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { accrueCommissionForOrder, listCommissionDesk } from "@/lib/user-store";

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
  const orderId = String(body?.orderId || "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "缺少订单" }, { status: 400 });
  }
  try {
    await accrueCommissionForOrder(orderId);
    return NextResponse.json(await listCommissionDesk());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "计提失败" }, { status: 400 });
  }
}
