import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import type { Poster } from "@/lib/data";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json((await readStore()).posters);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<Poster>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  }
  const store = await readStore();
  const poster: Poster = {
    id: randomUUID(),
    title: body.title.trim(),
    href: body.href || "/",
    sort: Number(body.sort ?? store.posters.length),
    placement: body.placement || "home-carousel",
    image: body.image,
    subtitle: body.subtitle,
    kicker: body.kicker,
    priceLabel: body.priceLabel,
    theme: body.theme || "qihang",
  };
  store.posters.push(poster);
  await writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json(poster);
}
