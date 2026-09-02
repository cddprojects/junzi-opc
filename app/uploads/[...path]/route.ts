import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/store";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const file = path.normalize(segments.join("/"));
  if (file.includes("..")) {
    return NextResponse.json({ error: "无效路径" }, { status: 400 });
  }
  const full = path.join(UPLOAD_DIR, file);
  if (!full.startsWith(UPLOAD_DIR) || !existsSync(full)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = path.extname(full).toLowerCase();
  return new NextResponse(readFileSync(full), {
    headers: {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
