import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { getReferralPlan, updateReferralPlan } from "@/lib/store";
import { normalizeReferralPlan, type ReferralPlan } from "@/lib/referral";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(await getReferralPlan());
}

export async function PUT(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Partial<ReferralPlan> | null;
  return NextResponse.json(await updateReferralPlan(normalizeReferralPlan(body)));
}
