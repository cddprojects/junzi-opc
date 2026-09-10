import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "opc_admin_session";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "junzi-admin";
}

export async function adminToken() {
  const data = new TextEncoder().encode(`${adminPassword()}:opc-admin-ok`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function isValidAdminToken(token?: string | null) {
  if (!token) return false;
  const expected = await adminToken();
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isAdminRequest() {
  const jar = await cookies();
  return isValidAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function assertAdmin() {
  if (!(await isAdminRequest())) {
    throw new Error("UNAUTHORIZED");
  }
}

export function safeAdminNext(next?: string | null) {
  if (!next || !next.startsWith("/admin") || next.startsWith("/admin/login")) {
    return "/admin";
  }
  if (next.includes("://") || next.includes("\\") || next.includes("//")) {
    return "/admin";
  }
  return next;
}

export { loginHref, safeReturnPath } from "@/lib/safe-path";

function requestIsHttps(request?: Request) {
  if (!request) return false;
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwarded === "https") return true;
  if (forwarded === "http") return false;
  return new URL(request.url).protocol === "https:";
}

export function adminSessionCookieOptions(request?: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // HTTP preview (127.0.0.1 / 0.0.0.0) must not get Secure, or the browser drops the cookie.
    secure: requestIsHttps(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function clearAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: 0,
  };
}

/** Stay on the browser host. request.url is 0.0.0.0 when the server binds there. */
export function sameHostRedirect(path: string, status = 303) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    path = "/admin";
  }
  const response = new NextResponse(null, { status });
  response.headers.set("Location", path);
  return response;
}
