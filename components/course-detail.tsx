"use client";

import dynamic from "next/dynamic";
import { Share2, Star } from "lucide-react";
import { CoverArt, QihangHeroCover } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { BuyNowButton } from "@/components/buy-now-button";
import { VideoBlock } from "@/components/video-block";
import { toast } from "sonner";
import { useDemoStore } from "@/components/demo-store";
import { emptyCourseDetail } from "@/lib/course";
import type { CatalogVideo, CourseDetail, Product } from "@/lib/data";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { localizeProduct } from "@/lib/localize";

const ProductDetailBody = dynamic(() => import("@/components/product-detail-body"), {
  loading: () => <div className="mx-4 h-40 animate-pulse rounded-xl bg-[#efe6d6] md:mx-0" />,
});

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
        title: detail.heroOverlay || product.title,
        videoUrl: detail.introVideoUrl,
        poster: detail.introPoster,
        duration: detail.duration,
        overlay: detail.heroOverlay,
        placement: "product-hero",
      }
    : detail.introPoster
      ? {
          id: `${product.slug}-intro`,
          title: detail.heroOverlay || product.title,
          poster: detail.introPoster,
          duration: detail.duration,
          overlay: detail.heroOverlay,
          placement: "product-hero",
        }
      : video;

  return (
    <div className="bg-[#f6f2ea] pb-4 md:bg-transparent">
      <div className="md:grid md:grid-cols-[1.15fr_0.85fr] md:items-start md:gap-6">
        <div className="overflow-hidden md:rounded-2xl">
          <Hero product={view} detail={detail} video={heroVideo} />
        </div>
        <div className="bg-white px-4 pt-4 pb-5 md:rounded-2xl md:px-6 md:py-6">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-semibold text-[#fa3534]">
                <Money cny={product.price} />
              </span>
              {product.originalPrice ? (
                <span className="text-[13px] text-[#999] line-through">
                  <Money cny={product.originalPrice} />
                </span>
              ) : null}
            </div>
            <span className="text-[12px] text-[#999]">{t("soldCount", { n: product.sales })}</span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-[18px] leading-7 font-semibold md:text-[26px]">{view.title}</h1>
            <div className="relative z-20 flex shrink-0 gap-3 text-center text-[10px] text-[#888]">
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
          {view.subtitle && <p className="mt-2 text-[13px] text-[#666]">{view.subtitle}</p>}
          {detail.lecturer && <p className="mt-2 text-[13px] text-[#8a7048]">{t("taughtBy", { name: detail.lecturer })}</p>}
          {view.giftNote && (
            <div className="mt-3 flex items-center gap-2 text-[12px]">
              <span className="rounded-full bg-[#fa3534] px-2 py-0.5 text-white">{t("gift")}</span>
              <span className="text-[#555]">{view.giftNote}</span>
            </div>
          )}
          <BuyNowButton product={product} className="mt-5 h-11 w-full" />
        </div>
      </div>

      <p className="py-3 text-center text-[12px] text-[#999] md:pt-8">{t("productDetail")}</p>
      <ProductDetailBody product={view} />
      <div className="md:hidden">
        <BuyBar product={product} />
      </div>
    </div>
  );
}

function Hero({
  product,
  detail,
  video,
}: {
  product: Product;
  detail: CourseDetail;
  video?: CatalogVideo;
}) {
  if (video?.videoUrl || video?.poster) {
    return <VideoBlock video={video} />;
  }
  if (product.coverImage || product.cover !== "qihang") {
    return (
      <div className="relative">
        <CoverArt theme={product.cover} image={product.coverImage} priority className="rounded-none md:aspect-[16/9]" />
        {(detail.heroOverlay || detail.lecturer) && (
          <div className="absolute inset-0 flex flex-col justify-end bg-black/20 p-4 text-white">
            {detail.heroKicker && <p className="text-[11px] text-white/75">{detail.heroKicker}</p>}
            {detail.heroOverlay && <p className="text-[22px] font-semibold">{detail.heroOverlay}</p>}
            {detail.heroSub && <p className="text-sm text-white/80">{detail.heroSub}</p>}
            {detail.lecturer && <HeroTaughtBy name={detail.lecturer} />}
          </div>
        )}
      </div>
    );
  }
  return <QihangHeroCover />;
}

function HeroTaughtBy({ name }: { name: string }) {
  const { t } = useLocale();
  return <p className="mt-2 text-[12px]">{t("taughtBy", { name })}</p>;
}
