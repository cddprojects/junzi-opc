import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { isBillplzConfigured } from "@/lib/billplz";
import { readEnvLocal, runtimeEnv, writeEnvLocalPatch } from "@/lib/env-local";

export const dynamic = "force-dynamic";

const MASK = "••••••••";

function statusPayload() {
  const apiKey = runtimeEnv("BILLPLZ_API_KEY");
  const collectionId = runtimeEnv("BILLPLZ_COLLECTION_ID");
  const xSignatureKey = runtimeEnv("BILLPLZ_X_SIGNATURE_KEY");
  const sandbox = /^(1|true|yes|on)$/i.test(runtimeEnv("BILLPLZ_SANDBOX"));
  const appUrl = runtimeEnv("NEXT_PUBLIC_APP_URL") || "http://127.0.0.1:43180";
  return {
    configured: isBillplzConfigured(),
    apiKeySet: Boolean(apiKey),
    collectionIdSet: Boolean(collectionId),
    xSignatureSet: Boolean(xSignatureKey),
    sandbox,
    appUrl,
  };
}

function incomingSecret(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === MASK || /^•+$/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeAppUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const url = raw || "http://127.0.0.1:43180";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error("站点地址无效");
  }
}

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(statusPayload());
}

export async function PUT(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    apiKey?: string;
    collectionId?: string;
    xSignatureKey?: string;
    appUrl?: string;
    sandbox?: boolean;
  } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "保存失败" }, { status: 400 });
  }

  let appUrl: string;
  try {
    appUrl = normalizeAppUrl(body.appUrl);
  } catch {
    return NextResponse.json({ error: "站点地址无效" }, { status: 400 });
  }

  const current = readEnvLocal();
  const apiKey = incomingSecret(body.apiKey) ?? current.BILLPLZ_API_KEY ?? runtimeEnv("BILLPLZ_API_KEY");
  const collectionId =
    incomingSecret(body.collectionId) ?? current.BILLPLZ_COLLECTION_ID ?? runtimeEnv("BILLPLZ_COLLECTION_ID");
  const xSignatureKey =
    incomingSecret(body.xSignatureKey) ?? current.BILLPLZ_X_SIGNATURE_KEY ?? runtimeEnv("BILLPLZ_X_SIGNATURE_KEY");

  if (!apiKey || !collectionId || !xSignatureKey) {
    return NextResponse.json({ error: "请填写全部三项密钥" }, { status: 400 });
  }

  const sandbox = Boolean(body.sandbox);

  writeEnvLocalPatch({
    BILLPLZ_API_KEY: apiKey,
    BILLPLZ_COLLECTION_ID: collectionId,
    BILLPLZ_X_SIGNATURE_KEY: xSignatureKey,
    BILLPLZ_SANDBOX: sandbox ? "true" : "false",
    NEXT_PUBLIC_APP_URL: appUrl,
  });

  return NextResponse.json(statusPayload());
}
