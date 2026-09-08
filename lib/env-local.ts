import "server-only";

import { chmodSync, existsSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

export const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

const BILLPLZ_KEYS = [
  "BILLPLZ_API_KEY",
  "BILLPLZ_COLLECTION_ID",
  "BILLPLZ_X_SIGNATURE_KEY",
  "BILLPLZ_SANDBOX",
  "NEXT_PUBLIC_APP_URL",
  "ALLOW_DEMO_PAY",
] as const;

type EnvMap = Record<string, string>;

let cache: { mtimeMs: number; values: EnvMap } | null = null;

function parseDotEnv(text: string): EnvMap {
  const values: EnvMap = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function readEnvLocal(): EnvMap {
  if (!existsSync(ENV_LOCAL_PATH)) {
    cache = null;
    return {};
  }
  const mtimeMs = statSync(ENV_LOCAL_PATH).mtimeMs;
  if (cache && cache.mtimeMs === mtimeMs) return cache.values;
  const values = parseDotEnv(readFileSync(ENV_LOCAL_PATH, "utf8"));
  cache = { mtimeMs, values };
  return values;
}

export function runtimeEnv(key: string): string {
  const fromFile = readEnvLocal()[key]?.trim();
  if (fromFile) return fromFile;
  return (process.env[key] || "").trim();
}

function mergeDotEnv(existing: string, patch: EnvMap): string {
  const seen = new Set<string>();
  const lines = existing ? existing.split(/\r?\n/) : [];
  const next = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return line;
    const key = match[1];
    if (!(key in patch)) return line;
    seen.add(key);
    return `${key}=${patch[key]}`;
  });
  for (const key of BILLPLZ_KEYS) {
    if (!(key in patch) || seen.has(key)) continue;
    if (next.length && next[next.length - 1] !== "") next.push("");
    next.push(`${key}=${patch[key]}`);
    seen.add(key);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (seen.has(key)) continue;
    if (next.length && next[next.length - 1] !== "") next.push("");
    next.push(`${key}=${value}`);
  }
  let text = next.join("\n");
  if (!text.endsWith("\n")) text += "\n";
  return text;
}

export function writeEnvLocalPatch(patch: EnvMap) {
  const existing = existsSync(ENV_LOCAL_PATH) ? readFileSync(ENV_LOCAL_PATH, "utf8") : "";
  const text = mergeDotEnv(existing, patch);
  writeFileSync(ENV_LOCAL_PATH, text, "utf8");
  try {
    chmodSync(ENV_LOCAL_PATH, 0o600);
  } catch {
    /* ignore if the FS does not allow chmod */
  }
  cache = { mtimeMs: existsSync(ENV_LOCAL_PATH) ? statSync(ENV_LOCAL_PATH).mtimeMs : Date.now(), values: parseDotEnv(text) };
}
