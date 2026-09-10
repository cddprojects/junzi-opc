import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { listReferralNetwork } from "@/lib/user-store";

export async function GET(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const rootId = new URL(request.url).searchParams.get("rootId") || undefined;
  return NextResponse.json(await listReferralNetwork(rootId));
}
