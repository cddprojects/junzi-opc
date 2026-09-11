import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { jsonSaveError } from "@/lib/admin-save";
import { releaseUnusedUploads } from "@/lib/media-refs";
import { readStore, removeVideo, saveVideo } from "@/lib/store";
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
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<CatalogVideo>;
    const store = await readStore();
    const previous = store.videos.find((item) => item.id === id);
    if (!previous) return NextResponse.json({ error: "视频不存在" }, { status: 404 });
    const saved = await saveVideo({
      ...previous,
      ...body,
      id,
      poster: body.poster === undefined ? previous.poster : body.poster?.trim() || undefined,
      videoUrl: body.videoUrl === undefined ? previous.videoUrl : body.videoUrl?.trim() || undefined,
    });
    releaseUnusedUploads(
      { ...store, videos: store.videos.map((item) => (item.id === id ? saved : item)) },
      [previous.poster, previous.videoUrl],
    );
    revalidatePath("/");
    revalidatePath("/admin/videos");
    return NextResponse.json(saved);
  } catch (error) {
    return jsonSaveError(error);
  }
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
  try {
    const { id } = await params;
    const store = await readStore();
    const previous = store.videos.find((item) => item.id === id);
    await removeVideo(id);
    if (previous) {
      releaseUnusedUploads(
        { ...store, videos: store.videos.filter((item) => item.id !== id) },
        [previous.poster, previous.videoUrl],
      );
    }
    revalidatePath("/");
    revalidatePath("/admin/videos");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonSaveError(error);
  }
}
