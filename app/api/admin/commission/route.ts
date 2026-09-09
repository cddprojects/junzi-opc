import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { listCommissionDesk } from "@/lib/user-store";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(listCommissionDesk());
}
