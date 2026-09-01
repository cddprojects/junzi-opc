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
