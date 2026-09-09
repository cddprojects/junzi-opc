import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { adjustUserWallet, getCustomerAdmin } from "@/lib/user-store";

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    bucket?: "topup" | "commission";
    amountSen?: number;
    reason?: string;
  } | null;
  try {
    if (!body?.userId) throw new Error("用户不存在");
    adjustUserWallet(body.userId, {
      bucket: body.bucket === "topup" ? "topup" : "commission",
      amountSen: Number(body.amountSen || 0),
      reason: String(body.reason || ""),
    });
    return NextResponse.json({ user: getCustomerAdmin(body.userId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败" }, { status: 400 });
  }
}
