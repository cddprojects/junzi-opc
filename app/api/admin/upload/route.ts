import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { finishChunkUpload, saveChunk, startChunkUpload } from "@/lib/upload-store";
import { CHUNK_BYTES } from "@/lib/upload-shared";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "请重新登录后台" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }
    console.info("[upload] legacy-single", { name: file.name, size: file.size, type: file.type });
    const started = startChunkUpload({ filename: file.name, size: file.size, type: file.type });
    const buf = Buffer.from(await file.arrayBuffer());
    const total = started.totalChunks;
    for (let i = 0; i < total; i += 1) {
      await saveChunk(started.id, i, buf.subarray(i * CHUNK_BYTES, Math.min(buf.length, (i + 1) * CHUNK_BYTES)));
    }
    const done = await finishChunkUpload(started.id);
    return NextResponse.json(done);
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    console.error("[upload] legacy-single error", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
