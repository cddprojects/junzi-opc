import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { getCustomerAdmin, setCustomerMembership, setCustomerStatus, updateCustomerProfile } from "@/lib/user-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const user = getCustomerAdmin(id);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    phone?: string;
    status?: "active" | "disabled";
    memberUntil?: string | null;
  } | null;
  try {
    if (body?.status) setCustomerStatus(id, body.status);
    if (body && ("memberUntil" in body)) setCustomerMembership(id, body.memberUntil);
    if (body?.name || body?.email !== undefined || body?.phone !== undefined) {
      updateCustomerProfile(id, { name: body.name, email: body.email, phone: body.phone });
    }
    const user = getCustomerAdmin(id);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
