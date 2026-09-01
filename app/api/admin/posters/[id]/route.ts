import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
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
  const store = readStore();
  const index = store.posters.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ error: "海报不存在" }, { status: 404 });
  store.posters[index] = {
    ...store.posters[index],
    ...body,
    id,
    sort: Number(body.sort ?? store.posters[index].sort),
  };
  writeStore(store);
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
  const store = readStore();
  store.posters = store.posters.filter((item) => item.id !== id);
  writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
