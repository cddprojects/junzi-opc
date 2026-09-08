function firstHeader(request: Request, name: string) {
  return request.headers.get(name)?.split(",")[0]?.trim() || "";
}

/** Origin the browser is actually on. request.url is 0.0.0.0 when Next binds there. */
export function requestOrigin(request: Request) {
  const headerHost = firstHeader(request, "x-forwarded-host") || firstHeader(request, "host");
  let host = headerHost;
  if (!host) {
    try {
      host = new URL(request.url).host;
    } catch {
      host = "127.0.0.1:43180";
    }
  }
  host = host.replace(/^0\.0\.0\.0(?=:\d+$|$)/, "127.0.0.1");
  const proto =
    firstHeader(request, "x-forwarded-proto") ||
    (request.url.startsWith("https:") ? "https" : "http");
  return `${proto}://${host}`;
}

export function requestAbsoluteUrl(request: Request, path: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/admin";
  return new URL(safePath, requestOrigin(request));
}
