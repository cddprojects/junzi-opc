import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { cancelPendingOrderForUser } from "@/lib/user-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  try {
    await cancelPendingOrderForUser(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "取消订单失败";
    const status =
      message === "订单不存在"
        ? 404
        : message === "订单已支付，不能取消"
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
