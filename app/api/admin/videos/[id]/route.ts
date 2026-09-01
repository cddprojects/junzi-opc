import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
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
  store.videos[index] = { ...store.videos[index], ...body, id };
  writeStore(store);
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
  store.videos = store.videos.filter((item) => item.id !== id);
  writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
