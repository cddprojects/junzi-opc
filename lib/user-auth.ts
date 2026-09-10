import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/account";
import { customerFromToken, revokeSession } from "@/lib/user-store";

export async function getCurrentUser() {
  const jar = await cookies();
  return await customerFromToken(jar.get(USER_COOKIE)?.value);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function setUserCookie(token: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearUserCookie() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  await revokeSession(token);
  jar.set(USER_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
