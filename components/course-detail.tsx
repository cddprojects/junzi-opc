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
      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:items-start md:gap-8 md:py-6">
        <div className="overflow-hidden bg-black">
          <Hero product={view} video={heroVideo} />
        </div>
        <div className="bg-white px-3 pt-3 pb-4 md:rounded-xl md:px-6 md:py-6">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-semibold text-[#fa3534]">
                <Money cny={product.price} />
              </span>
              {product.originalPrice ? (
                <span className="text-[13px] text-[#bbb] line-through">
                  <Money cny={product.originalPrice} />
                </span>
              ) : null}
            </div>
            <span className="text-[12px] text-[#999]">{t("soldCount", { n: product.sales })}</span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-[17px] leading-6 font-semibold text-[#333]">{view.title}</h1>
            <div className="relative flex shrink-0 gap-3 text-center text-[10px] text-[#888]">
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
                <Share2 className="size-4" />
                {t("share")}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.slug)}
                className="flex flex-col items-center gap-0.5"
              >
                <Star className={cn("size-4", favored && "fill-[#fa3534] text-[#fa3534]")} />
                {t("favorite")}
              </button>
            </div>
          </div>
          {view.giftNote && (
            <div className="mt-3 flex items-center gap-2 text-[12px]">
              <span className="rounded-sm bg-[#fa3534] px-1.5 py-0.5 text-white">{t("gift")}</span>
              <span className="text-[#666]">{view.giftNote}</span>
            </div>
          )}
          <div className="mt-5 hidden md:block">
            <ProductCtaRow product={product} />
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
