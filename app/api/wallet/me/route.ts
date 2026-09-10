import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { getWalletDashboard } from "@/lib/user-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  try {
    return NextResponse.json(await getWalletDashboard(user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败" }, { status: 400 });
  }
}
