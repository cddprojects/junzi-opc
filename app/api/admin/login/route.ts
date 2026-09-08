import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminPassword,
  adminSessionCookieOptions,
  adminToken,
  safeAdminNext,
  sameHostRedirect,
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

function loginFail(next: string, wantsJson: boolean) {
  if (wantsJson) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }
  const query = new URLSearchParams({ error: "1" });
  if (next !== "/admin") query.set("next", next);
  return sameHostRedirect(`/admin/login?${query.toString()}`, 303);
}

export async function POST(request: Request) {
  const { password, next, wantsJson } = await readLogin(request);
  if (!password.trim() || password !== adminPassword()) {
    return loginFail(next, wantsJson);
  }

  const response = wantsJson ? NextResponse.json({ ok: true }) : sameHostRedirect(next, 303);
  response.cookies.set(ADMIN_COOKIE, await adminToken(), adminSessionCookieOptions(request));
  return response;
}
