import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminPassword,
  adminSessionCookieOptions,
  adminToken,
  safeAdminNext,
} from "@/lib/auth";

async function readLogin(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const wantsJson = contentType.includes("application/json");
  if (wantsJson) {
    const body = (await request.json().catch(() => null)) as { password?: string; next?: string } | null;
    return {
      password: String(body?.password || ""),
      next: safeAdminNext(body?.next ?? null),
      wantsJson: true,
    };
  }
  const form = await request.formData().catch(() => null);
  return {
    password: String(form?.get("password") || ""),
    next: safeAdminNext(String(form?.get("next") || "") || null),
    wantsJson: false,
  };
}

function loginFail(request: Request, next: string, wantsJson: boolean) {
  if (wantsJson) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", "1");
  if (next !== "/admin") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const { password, next, wantsJson } = await readLogin(request);
  if (!password.trim() || password !== adminPassword()) {
    return loginFail(request, next, wantsJson);
  }

  const response = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(ADMIN_COOKIE, await adminToken(), adminSessionCookieOptions(request));
  return response;
}
