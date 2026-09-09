import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { grantCourse, revokeOrder } from "@/lib/user-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    productSlug?: string;
    currency?: string;
    accrueCommission?: boolean;
  } | null;
  try {
    const orders = grantCourse(id, body?.productSlug || "", body?.currency || "CNY", {
      accrueCommission: Boolean(body?.accrueCommission),
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "授权失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const orderId = new URL(request.url).searchParams.get("orderId") || "";
  try {
    revokeOrder(id, orderId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "撤销失败" }, { status: 400 });
  }
}
