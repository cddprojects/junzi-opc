import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({ locale: parseLocale(jar.get(LOCALE_COOKIE)?.value) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = parseLocale(body?.locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return NextResponse.json({ locale });
}
