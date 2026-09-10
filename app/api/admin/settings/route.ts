import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { normalizeSettings, type StoreSettings } from "@/lib/currency";
import { getSettings, updateSettings } from "@/lib/store";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Partial<StoreSettings> | null;
  return NextResponse.json(await updateSettings(normalizeSettings(body)));
}
