import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { getReferralDashboard, requestWithdrawal } from "@/lib/user-store";
import { myrToSen } from "@/lib/referral";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    amountMyr?: number;
    amountSen?: number;
    bank?: string;
    holder?: string;
    account?: string;
  } | null;
  const amountSen =
    body?.amountSen != null ? Math.round(Number(body.amountSen)) : myrToSen(Number(body?.amountMyr || 0));
  const payout =
    body?.bank || body?.holder || body?.account
      ? { bank: String(body.bank || "").trim(), holder: String(body.holder || "").trim(), account: String(body.account || "").trim() }
      : undefined;
  try {
    requestWithdrawal(user.id, amountSen, payout);
    return NextResponse.json(getReferralDashboard(user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败" }, { status: 400 });
  }
}
