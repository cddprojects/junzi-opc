import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/store";

export const maxDuration = 120;

const MAX_BYTES = 200 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/x-mp4",
]);

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".m4v"]);

function extOf(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;
  if (file.type === "video/quicktime") return ".mov";
  if (file.type === "video/webm") return ".webm";
  if (file.type === "video/x-m4v") return ".m4v";
  if (file.type.startsWith("video/")) return ".mp4";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  return ".jpg";
}

function isAllowedFile(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  if (ext && ALLOWED_EXT.has(ext)) return true;
  return ALLOWED_TYPES.has(file.type);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "请重新登录后台" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "上传内容过大或无法解析。请换较小的文件后重试。" },
      { status: 413 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: "仅支持 jpg / png / webp / gif 图片，或 mp4 / webm / mov / m4v 视频" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "文件不能超过 200MB" }, { status: 400 });
  }

  try {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
    const ext = extOf(file);
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "仅支持常见图片或视频格式" }, { status: 400 });
    }
    const name = `${randomUUID()}${ext}`;
    const dest = path.join(UPLOAD_DIR, name);
    await writeFile(dest, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/${name}`, name: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/eacces|erofs|enospc/i.test(message)) {
      return NextResponse.json({ error: "上传目录无法写入，请检查 data/uploads 权限" }, { status: 500 });
    }
    return NextResponse.json({ error: "保存文件失败，请稍后重试" }, { status: 500 });
  }
}
