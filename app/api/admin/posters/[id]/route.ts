import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { releaseUnusedUploads } from "@/lib/media-refs";
import { readStore, writeStore } from "@/lib/store";
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
  const { id } = await params;
  const body = (await request.json()) as Partial<Poster>;
  const store = await readStore();
  const index = store.posters.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ error: "海报不存在" }, { status: 404 });
  const previous = store.posters[index];
  store.posters[index] = {
    ...previous,
    ...body,
    id,
    sort: Number(body.sort ?? previous.sort),
    image: body.image === undefined ? previous.image : body.image?.trim() || undefined,
  };
  await writeStore(store);
  releaseUnusedUploads(store, [previous.image]);
  revalidatePath("/", "layout");
  return NextResponse.json(store.posters[index]);
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
  const store = await readStore();
  const previous = store.posters.find((item) => item.id === id);
  store.posters = store.posters.filter((item) => item.id !== id);
  await writeStore(store);
  if (previous) releaseUnusedUploads(store, [previous.image]);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
