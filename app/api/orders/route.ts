import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { ordersForUser } from "@/lib/user-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  return NextResponse.json({ orders: ordersForUser(user.id) });
}
