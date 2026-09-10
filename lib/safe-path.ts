/** Same-origin relative path only. Rejects protocol-relative, external, and auth loops. */
export function safeReturnPath(raw?: string | null, fallback = "/") {
  if (!raw) return fallback;
  let next = raw.trim();
  try {
    next = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://") || next.includes("\\")) {
    return fallback;
  }
  const path = next.split("?")[0] || "/";
  if (path === "/login" || path === "/register") return fallback;
  return next;
}

export function loginHref(returnTo?: string | null, fallback = "/") {
  return `/login?next=${encodeURIComponent(safeReturnPath(returnTo, fallback))}`;
}
