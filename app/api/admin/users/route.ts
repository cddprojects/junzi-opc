import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { listCustomers } from "@/lib/user-store";

export async function GET(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") || "";
  return NextResponse.json({ users: listCustomers(q) });
}
