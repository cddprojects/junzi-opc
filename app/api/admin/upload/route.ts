import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/store";
import { mkdirSync, existsSync } from "fs";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "仅支持图片或常见视频格式" }, { status: 400 });
  }
  if (file.size > 80 * 1024 * 1024) {
    return NextResponse.json({ error: "文件不能超过 80MB" }, { status: 400 });
  }

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const name = `${randomUUID()}${ext.toLowerCase()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return NextResponse.json({ url: `/uploads/${name}`, name: file.name });
}
