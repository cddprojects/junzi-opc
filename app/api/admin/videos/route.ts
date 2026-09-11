import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { jsonSaveError } from "@/lib/admin-save";
import { readStore, saveVideo } from "@/lib/store";
import type { CatalogVideo } from "@/lib/data";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json((await readStore()).videos);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Partial<CatalogVideo>;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "请填写标题" }, { status: 400 });
    }
    const video = await saveVideo({
      id: randomUUID(),
      title: body.title.trim(),
      titleEn: body.titleEn,
      poster: body.poster,
      videoUrl: body.videoUrl,
      duration: body.duration,
      productSlug: body.productSlug,
      overlay: body.overlay,
      overlayEn: body.overlayEn,
      placement: body.placement || "library",
    });
    revalidatePath("/");
    revalidatePath("/admin/videos");
    return NextResponse.json(video);
  } catch (error) {
    return jsonSaveError(error);
  }
}
