import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { cleanupOldParts, finishChunkUpload, saveChunk, startChunkUpload } from "@/lib/upload-store";

export const maxDuration = 300;

async function requireAdmin() {
  try {
    await assertAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "请重新登录后台" }, { status: 401 });
  }
}

function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "上传失败";
  console.error("[upload] error", message);
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await cleanupOldParts().catch(() => undefined);

  const url = new URL(request.url);
  const step = url.searchParams.get("step") || "init";

  try {
    if (step === "init") {
      const body = (await request.json().catch(() => null)) as {
        filename?: string;
        size?: number;
        type?: string;
      } | null;
      const started = startChunkUpload({
        filename: body?.filename || "",
        size: Number(body?.size || 0),
        type: body?.type || "",
      });
      return NextResponse.json(started);
    }

    if (step === "chunk") {
      const id = url.searchParams.get("id") || "";
      const index = Number(url.searchParams.get("index"));
      const buffer = Buffer.from(await request.arrayBuffer());
      const saved = await saveChunk(id, index, buffer);
      return NextResponse.json(saved);
    }

    if (step === "finish") {
      const body = (await request.json().catch(() => null)) as { id?: string } | null;
      const done = await finishChunkUpload(body?.id || "");
      return NextResponse.json(done);
    }

    return NextResponse.json({ error: "未知的上传步骤" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/未登录|UNAUTHORIZED/.test(message)) return fail("请重新登录后台", 401);
    if (/过大|200MB|分片过大/.test(message)) return fail(error, 413);
    return fail(error);
  }
}
