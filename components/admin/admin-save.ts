export async function adminSaveJson<T extends { error?: string }>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  payload?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const text = await res.text();
    let data = {} as T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      data = {} as T;
    }
    if (!res.ok) {
      return { ok: false, error: data.error || text.slice(0, 180) || `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return { ok: false, error: /abort/i.test(message) ? "保存超时，请再试一次" : message };
  }
}
