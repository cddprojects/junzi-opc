import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { getCatalog, readStore, slugify, writeStore } from "@/lib/store";
import { ensureProductDetail, outlineFromLessons } from "@/lib/course";
import type { Product, ProductCategoryId } from "@/lib/data";

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(getCatalog().products);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<Product>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  }
  const store = readStore();
  const slug = slugify(body.slug || body.title);
  if (store.products.some((item) => item.slug === slug)) {
    return NextResponse.json({ error: "该 slug 已存在" }, { status: 400 });
  }
  const product = ensureProductDetail({
    slug,
    title: body.title.trim(),
    titleEn: body.titleEn?.trim() || undefined,
    shortTitle: (body.shortTitle || body.title).trim(),
    shortTitleEn: body.shortTitleEn?.trim() || undefined,
    price: Number(body.price || 0),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
    sales: Number(body.sales || 0),
    categoryId: (body.categoryId as ProductCategoryId) || "opc",
    cover: body.cover || "qihang",
    href: `/product/${slug}`,
    subtitle: body.subtitle,
    subtitleEn: body.subtitleEn,
    giftNote: body.giftNote,
    giftNoteEn: body.giftNoteEn,
    description: body.description || body.detail?.body,
    descriptionEn: body.descriptionEn || body.detail?.bodyEn,
    outline: body.outline || outlineFromLessons(body.detail?.lessons || []),
    coverImage: body.coverImage,
    detail: body.detail,
  });
  store.products.push(product);
  writeStore(store);
  revalidatePublic();
  return NextResponse.json(product);
}
