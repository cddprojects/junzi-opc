import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import type { CatalogVideo } from "@/lib/data";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(readStore().videos);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<CatalogVideo>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  }
  const store = readStore();
  const video: CatalogVideo = {
    id: randomUUID(),
    title: body.title.trim(),
    poster: body.poster,
    videoUrl: body.videoUrl,
    duration: body.duration,
    productSlug: body.productSlug,
    overlay: body.overlay,
    placement: body.placement || "library",
  };
  store.videos.push(video);
  writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json(video);
}
