"use client";

import { Share2, Star } from "lucide-react";
import { CoverArt } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { ProductCtaRow } from "@/components/product-cta";
import { VideoBlock } from "@/components/video-block";
import { toast } from "sonner";
import { useDemoStore } from "@/components/demo-store";
import { emptyCourseDetail } from "@/lib/course";
import type { CatalogVideo, CourseDetail, Product } from "@/lib/data";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { localizeProduct } from "@/lib/localize";
import ProductDetailBody from "@/components/product-detail-body";

export function CourseDetailView({
  product,
  video,
}: {
  product: Product;
  video?: CatalogVideo;
}) {
  const { toggleFavorite, favorites } = useDemoStore();
  const { locale, t } = useLocale();
  const favored = favorites.includes(product.slug);
  const view = localizeProduct(product, locale);
  const detail: CourseDetail = view.detail ?? emptyCourseDetail();
  const heroVideo: CatalogVideo | undefined = detail.introVideoUrl
    ? {
        id: `${product.slug}-intro`,
        title: product.title,
        videoUrl: detail.introVideoUrl,
        poster: detail.introPoster,
        duration: detail.duration,
        placement: "product-hero",
      }
    : detail.introPoster
      ? {
          id: `${product.slug}-intro`,
          title: product.title,
          poster: detail.introPoster,
          duration: detail.duration,
          placement: "product-hero",
        }
      : video;

  return (
    <div className="bg-[#f5f5f5] pb-2 md:bg-transparent">
      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:items-stretch md:gap-8 md:py-6">
        <div className="overflow-hidden bg-black md:rounded-xl">
          <Hero product={view} video={heroVideo} />
        </div>
        <div className="flex flex-col bg-white px-4 pt-4 pb-4 md:rounded-xl md:px-8 md:py-8">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-[18px] leading-7 font-semibold text-[#1a1a1a] md:text-[22px]">{view.title}</h1>
            <div className="relative flex shrink-0 gap-4 text-center text-[10px] text-[#888]">
              <button
                type="button"
                className="flex flex-col items-center gap-0.5"
                onClick={async () => {
                  const url = `${window.location.origin}/product/${product.slug}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success(t("copied"));
                  } catch {
                    toast.message(url);
                  }
                }}
              >
                <Share2 className="size-[18px]" strokeWidth={1.6} />
                {t("share")}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.slug)}
                className="flex flex-col items-center gap-0.5"
              >
                <Star
                  className={cn("size-[18px]", favored && "fill-[#fa3534] text-[#fa3534]")}
                  strokeWidth={1.6}
                />
                {t("favorite")}
              </button>
            </div>
          </div>
          {view.subtitle ? <p className="mt-3 text-[14px] leading-6 text-[#666]">{view.subtitle}</p> : null}
          {detail.lecturer ? <p className="mt-2 text-[14px] text-[#666]">{t("taughtBy", { name: detail.lecturer })}</p> : null}
          {view.giftNote ? (
            <div className="mt-3 flex items-center gap-2 text-[12px]">
              <span className="rounded-sm bg-[#fa3534] px-1.5 py-0.5 text-white">{t("gift")}</span>
              <span className="text-[#666]">{view.giftNote}</span>
            </div>
          ) : null}
          <div className="mt-8 flex items-end justify-between gap-4 md:mt-auto md:pt-10">
            <div className="shrink-0">
              <p className="text-[28px] leading-none font-semibold text-[#fa3534]">
                <Money cny={product.price} />
              </p>
              {product.originalPrice ? (
                <p className="mt-1.5 text-[13px] leading-none text-[#bbb] line-through">
                  <Money cny={product.originalPrice} />
                </p>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col items-end gap-2">
              <p className="text-[12px] text-[#999]">{t("soldCount", { n: product.sales })}</p>
              <div className="hidden w-full min-w-[220px] md:block">
                <ProductCtaRow product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="bg-white py-3 text-center text-[13px] text-[#999] md:mt-6 md:rounded-t-xl">{t("productDetail")}</p>
      <ProductDetailBody product={view} />
      <div className="md:hidden">
        <BuyBar product={product} />
      </div>
    </div>
  );
}

function Hero({
  product,
  video,
}: {
  product: Product;
  video?: CatalogVideo;
}) {
  if (video?.videoUrl || video?.poster) {
    return <VideoBlock video={video} />;
  }
  return (
    <CoverArt
      theme={product.cover}
      image={product.coverImage}
      priority
      className="aspect-[16/9] rounded-none"
    />
  );
}
