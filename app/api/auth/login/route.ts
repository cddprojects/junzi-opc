import { NextResponse } from "next/server";
import { setUserCookie } from "@/lib/user-auth";
import { loginCustomer } from "@/lib/user-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    account?: string;
    password?: string;
  } | null;
  try {
    const result = await loginCustomer(body?.account || "", body?.password || "");
    await setUserCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "登录失败" }, { status: 400 });
  }
}
