import { NextResponse } from "next/server";
import { setUserCookie } from "@/lib/user-auth";
import { registerCustomer } from "@/lib/user-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    account?: string;
    password?: string;
    referralCode?: string;
  } | null;
  try {
    const result = await registerCustomer({
      name: body?.name || "",
      account: body?.account || "",
      password: body?.password || "",
      referralCode: body?.referralCode || "",
    });
    await setUserCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "注册失败" }, { status: 400 });
  }
}
