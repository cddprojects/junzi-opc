import { NextResponse } from "next/server";
import { submitFeedback } from "@/lib/store";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { body?: string; note?: string } | null;
  try {
    const entry = await submitFeedback(payload?.body || payload?.note || "");
    return NextResponse.json({ ok: true, createdAt: entry.createdAt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: 400 },
    );
  }
}
