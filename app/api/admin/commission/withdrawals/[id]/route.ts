import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { listCommissionDesk, settleWithdrawal } from "@/lib/user-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: "settle" | "reject" | "approve" | "pay";
    note?: string;
  } | null;
  const action =
    body?.action === "reject" || body?.action === "approve" || body?.action === "pay" || body?.action === "settle"
      ? body.action
      : "settle";
  try {
    settleWithdrawal(id, action, body?.note);
    return NextResponse.json(listCommissionDesk());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败" }, { status: 400 });
  }
}
