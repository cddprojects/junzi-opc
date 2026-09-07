import { createHmac, timingSafeEqual } from "crypto";

export function signatureSource(params: Record<string, unknown>) {
  const parts = Object.entries(params)
    .filter(([key]) => key.toLowerCase() !== "x_signature")
    .map(([key, value]) => `${flattenKey(key)}${scalarValue(value)}`)
    .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
  return parts.join("|");
}

export function computeXSignature(params: Record<string, unknown>, xSignatureKey: string) {
  return createHmac("sha256", xSignatureKey).update(signatureSource(params)).digest("hex");
}

export function signaturesMatch(expected: string, received?: string | null) {
  if (!received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyXSignature(params: Record<string, unknown>, xSignatureKey: string) {
  const received = String(params.x_signature ?? params["billplz[x_signature]"] ?? "");
  const body = { ...params };
  delete body.x_signature;
  delete body["billplz[x_signature]"];
  return signaturesMatch(computeXSignature(body, xSignatureKey), received);
}

export function flattenRedirectParams(input: Record<string, string | string[] | undefined>) {
  const out: Record<string, string> = {};
  let signature = "";
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value == null) continue;
    const bracket = rawKey.match(/^billplz\[(.+)\]$/);
    const key = bracket ? `billplz${bracket[1]}` : rawKey;
    if (key === "x_signature" || key === "billplzx_signature") {
      signature = value;
      continue;
    }
    out[key] = value;
  }
  if (signature) out.x_signature = signature;
  return out;
}

function flattenKey(key: string) {
  const bracket = key.match(/^billplz\[(.+)\]$/);
  if (bracket) return `billplz${bracket[1]}`;
  return key;
}

function scalarValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
