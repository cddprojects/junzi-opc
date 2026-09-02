import { NextResponse } from "next/server";
import { getCurrentUser, setUserCookie } from "@/lib/user-auth";
import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/account";
import { updateCustomerProfile } from "@/lib/user-store";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  try {
    const next = updateCustomerProfile(user.id, body || {});
    const jar = await cookies();
    const token = jar.get(USER_COOKIE)?.value;
    if (token) await setUserCookie(token);
    return NextResponse.json({ user: next });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
