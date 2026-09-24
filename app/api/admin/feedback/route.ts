import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { listFeedback } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ items: await listFeedback() });
}
