import "server-only";

import { runtimeEnv } from "@/lib/env-local";
import {
  flattenRedirectParams,
  verifyXSignature,
} from "@/lib/billplz-signature";

export type BillplzConfig = {
  apiKey: string;
  collectionId: string;
  xSignatureKey: string;
  sandbox: boolean;
  host: string;
};

export type CreatedBill = {
  id: string;
  url: string;
  paid: boolean;
  amount: number;
};

function truthy(value?: string | null) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

export function allowDemoPay() {
  return truthy(runtimeEnv("ALLOW_DEMO_PAY") || process.env.ALLOW_DEMO_PAY);
}

export function getBillplzConfig(): BillplzConfig | null {
  const apiKey = runtimeEnv("BILLPLZ_API_KEY");
  const collectionId = runtimeEnv("BILLPLZ_COLLECTION_ID");
  const xSignatureKey = runtimeEnv("BILLPLZ_X_SIGNATURE_KEY");
  if (!apiKey || !collectionId || !xSignatureKey) return null;
  const sandbox = truthy(runtimeEnv("BILLPLZ_SANDBOX"));
  return {
    apiKey,
    collectionId,
    xSignatureKey,
    sandbox,
    host: sandbox ? "https://www.billplz-sandbox.com" : "https://www.billplz.com",
  };
}

export function isBillplzConfigured() {
  return Boolean(getBillplzConfig());
}

export function appBaseUrl(request?: Request) {
  const fromEnv = (runtimeEnv("NEXT_PUBLIC_SITE_URL") || runtimeEnv("NEXT_PUBLIC_APP_URL")).replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }
  return "http://127.0.0.1:43180";
}

export async function createBillplzBill(input: {
  name: string;
  email: string;
  amountSen: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
  reference?: string;
}) {
  const config = getBillplzConfig();
  if (!config) throw new Error("请先配置 Billplz 收款");
  if (!Number.isInteger(input.amountSen) || input.amountSen < 1) {
    throw new Error("收款金额无效");
  }
  const body = new URLSearchParams({
    collection_id: config.collectionId,
    email: input.email,
    name: input.name.slice(0, 255) || "Student",
    amount: String(input.amountSen),
    description: input.description.slice(0, 200),
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
  });
  if (input.reference) {
    body.set("reference_1_label", "Checkout");
    body.set("reference_1", input.reference.slice(0, 120));
  }
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${config.host}/api/v3/bills`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const timedOut =
      (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) ||
      (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "TimeoutError");
    console.error("[billplz] create-bill fail", `${Date.now() - started}ms`, timedOut ? "timeout" : error);
    if (timedOut) throw new Error("Billplz 连接超时，请稍后重试");
    throw error instanceof Error ? error : new Error("Billplz 连接失败，请稍后重试");
  }
  console.info("[billplz] create-bill", res.status, `${Date.now() - started}ms`);
  const data = (await res.json().catch(() => null)) as
    | CreatedBill
    | { error?: { message?: string[] | string; type?: string } }
    | null;
  if (!res.ok || !data || !("url" in data) || !data.url) {
    const message = Array.isArray((data as { error?: { message?: string[] } } | null)?.error?.message)
      ? (data as { error: { message: string[] } }).error.message.join("；")
      : typeof (data as { error?: { message?: string } } | null)?.error?.message === "string"
        ? (data as { error: { message: string } }).error.message
        : `Billplz 建单失败（${res.status}）`;
    throw new Error(message);
  }
  return {
    id: data.id,
    url: data.url,
    paid: Boolean(data.paid),
    amount: Number(data.amount),
  } satisfies CreatedBill;
}

export function verifyCallbackSignature(params: Record<string, unknown>) {
  const config = getBillplzConfig();
  if (!config) return false;
  return verifyXSignature(params, config.xSignatureKey);
}

export function verifyRedirectSignature(search: Record<string, string | string[] | undefined>) {
  const config = getBillplzConfig();
  if (!config) return false;
  const flat = flattenRedirectParams(search);
  return verifyXSignature(flat, config.xSignatureKey);
}

export function readRedirectBill(search: Record<string, string | string[] | undefined>) {
  const flat = flattenRedirectParams(search);
  const id = flat["billplz[id]"] || flat.billplzid || flat.id || "";
  const paid = /^(true|1)$/i.test(flat["billplz[paid]"] || flat.billplzpaid || flat.paid || "");
  const paidAt = flat["billplz[paid_at]"] || flat.billplzpaid_at || flat.paid_at || "";
  const amountRaw = flat["billplz[amount]"] || flat.billplzamount || flat.amount || "";
  const amountSen = amountRaw !== "" && Number.isFinite(Number(amountRaw)) ? Math.round(Number(amountRaw)) : null;
  return { id, paid, paidAt, amountSen, params: flat };
}

export function formToParams(body: string) {
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(body).entries()) {
    params[key] = value;
  }
  return params;
}
