import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { productMediaUrls, releaseUnusedUploads } from "@/lib/media-refs";
import { readStore, writeStore } from "@/lib/store";
import { ensureProductDetail, normalizeDetailImages, outlineFromLessons } from "@/lib/course";
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
  const store = await readStore();
  const index = store.products.findIndex((item) => item.slug === slug);
  if (index < 0) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  const current = store.products[index];
  const original =
    body.originalPrice === undefined
      ? current.originalPrice
      : Number(body.originalPrice) || undefined;
  const nextDetail = body.detail ?? current.detail;
  store.products[index] = ensureProductDetail({
    ...current,
    ...body,
    slug: current.slug,
    href: `/product/${current.slug}`,
    price: Number(body.price ?? current.price),
    originalPrice: original,
    sales: Number(body.sales ?? current.sales),
    coverImage: body.coverImage === undefined ? current.coverImage : body.coverImage?.trim() || undefined,
    detailImages:
      body.detailImages === undefined ? current.detailImages : normalizeDetailImages(body.detailImages),
    description: body.description || body.detail?.body || current.description,
    outline: body.outline || outlineFromLessons(body.detail?.lessons || current.detail?.lessons || []),
    detail: nextDetail
      ? {
          ...nextDetail,
          introPoster: nextDetail.introPoster?.trim() || undefined,
          introVideoUrl: nextDetail.introVideoUrl?.trim() || undefined,
          lessons: (nextDetail.lessons || []).map((lesson) => ({
            ...lesson,
            videoUrl: lesson.videoUrl?.trim() || undefined,
            duration: lesson.duration?.trim() || undefined,
          })),
          lives: (nextDetail.lives || []).map((live) => ({
            ...live,
            videoUrl: live.videoUrl?.trim() || undefined,
            meetingUrl: live.meetingUrl?.trim() || undefined,
          })),
        }
      : current.detail,
  });
  await writeStore(store);
  releaseUnusedUploads(store, productMediaUrls(current));
  revalidatePath("/", "layout");
  revalidatePath("/courses/recorded");
  revalidatePath(`/courses/recorded/${slug}`);
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
  const store = await readStore();
  const previous = store.products.find((item) => item.slug === slug);
  store.products = store.products.filter((item) => item.slug !== slug);
  await writeStore(store);
  if (previous) {
    releaseUnusedUploads(store, productMediaUrls(previous));
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
