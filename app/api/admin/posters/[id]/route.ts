import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { jsonSaveError, revalidatePosterPaths } from "@/lib/admin-save";
import { releaseUnusedUploads } from "@/lib/media-refs";
import { posterFieldsFromBody } from "@/lib/poster";
import { readStore, removePoster, savePoster } from "@/lib/store";
import type { Poster } from "@/lib/data";

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
    if (!id) return NextResponse.json({ error: "海报缺少编号" }, { status: 400 });
    const body = (await request.json()) as Partial<Poster>;
    const store = await readStore();
    const previous = store.posters.find((item) => item.id === id);
    const saved = await savePoster({
      id,
      ...posterFieldsFromBody(body, previous),
    });
    const nextStore = {
      ...store,
      posters: previous
        ? store.posters.map((item) => (item.id === id ? saved : item))
        : [...store.posters, saved],
    };
    if (previous) releaseUnusedUploads(nextStore, [previous.image, ...(previous.detailImages || [])]);
    revalidatePosterPaths(saved.placement);
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
    const previous = store.posters.find((item) => item.id === id);
    await removePoster(id);
    if (previous) {
      releaseUnusedUploads(
        { ...store, posters: store.posters.filter((item) => item.id !== id) },
        [previous.image, ...(previous.detailImages || [])],
      );
      revalidatePosterPaths(previous.placement);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonSaveError(error);
  }
}
