import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { releaseUnusedUploads } from "@/lib/media-refs";
import { readStore, writeStore } from "@/lib/store";
import type { CatalogVideo } from "@/lib/data";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json()) as Partial<CatalogVideo>;
  const store = readStore();
  const index = store.videos.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ error: "视频不存在" }, { status: 404 });
  const previous = store.videos[index];
  store.videos[index] = {
    ...previous,
    ...body,
    id,
    poster: body.poster === undefined ? previous.poster : body.poster?.trim() || undefined,
    videoUrl: body.videoUrl === undefined ? previous.videoUrl : body.videoUrl?.trim() || undefined,
  };
  writeStore(store);
  releaseUnusedUploads(store, [previous.poster, previous.videoUrl]);
  revalidatePath("/", "layout");
  return NextResponse.json(store.videos[index]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const store = readStore();
  const previous = store.videos.find((item) => item.id === id);
  store.videos = store.videos.filter((item) => item.id !== id);
  writeStore(store);
  if (previous) releaseUnusedUploads(store, [previous.poster, previous.videoUrl]);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
