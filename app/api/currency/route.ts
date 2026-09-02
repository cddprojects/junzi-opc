import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import { getSettings } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { currency?: string } | null;
  const settings = getSettings();
  const currency = parseCurrency(body?.currency, settings.defaultCurrency);
  const jar = await cookies();
  jar.set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return NextResponse.json({ currency, ...settings });
}
