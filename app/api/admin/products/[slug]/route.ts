import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import { ensureProductDetail, outlineFromLessons } from "@/lib/course";
import type { Product } from "@/lib/data";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { slug } = await params;
  const body = (await request.json()) as Partial<Product>;
  const store = readStore();
  const index = store.products.findIndex((item) => item.slug === slug);
  if (index < 0) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  const current = store.products[index];
    const original =
      body.originalPrice === undefined
        ? current.originalPrice
        : Number(body.originalPrice) || undefined;
    store.products[index] = ensureProductDetail({
      ...current,
      ...body,
      slug: current.slug,
      href: `/product/${current.slug}`,
      price: Number(body.price ?? current.price),
      originalPrice: original,
      sales: Number(body.sales ?? current.sales),
      description: body.description || body.detail?.body || current.description,
      outline: body.outline || outlineFromLessons(body.detail?.lessons || current.detail?.lessons || []),
      detail: body.detail ?? current.detail,
    });
  writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json(store.products[index]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { slug } = await params;
  const store = readStore();
  store.products = store.products.filter((item) => item.slug !== slug);
  writeStore(store);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
