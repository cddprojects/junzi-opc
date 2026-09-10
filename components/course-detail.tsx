"use client";

import dynamic from "next/dynamic";
import { Share2, Star } from "lucide-react";
import { CoverArt, QihangHeroCover } from "@/components/covers";
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
    <div className="pb-6">
      <div className="md:grid md:grid-cols-[1.15fr_0.85fr] md:items-start md:gap-10 md:py-8">
        <div className="front-card overflow-hidden">
          <Hero product={view} detail={detail} video={heroVideo} />
        </div>
        <div className="front-card px-5 pt-6 pb-6 md:px-8 md:py-8">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="front-price font-serif text-[28px] font-semibold md:text-[32px]">
                <Money cny={product.price} />
              </span>
              {product.originalPrice ? (
                <span className="text-[14px] text-[var(--front-text-muted)] line-through">
                  <Money cny={product.originalPrice} />
                </span>
              ) : null}
            </div>
            <span className="text-[13px] text-[var(--front-text-muted)]">{t("soldCount", { n: product.sales })}</span>
          </div>
          <div className="mt-5 flex items-start justify-between gap-3">
            <h1 className="front-h2 font-serif leading-tight">{view.title}</h1>
            <div className="relative z-20 flex shrink-0 gap-3 text-center text-[11px] text-[var(--front-text-muted)]">
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
                <Star className={cn("size-4", favored && "fill-[var(--front-accent)] text-[var(--front-accent)]")} />
                {t("favorite")}
              </button>
            </div>
          </div>
          {view.subtitle && <p className="mt-3 text-[15px] leading-7 text-[var(--front-text-soft)]">{view.subtitle}</p>}
          {detail.lecturer && <p className="mt-2 text-[14px] text-[var(--front-text-soft)]">{t("taughtBy", { name: detail.lecturer })}</p>}
          {view.giftNote && (
            <div className="mt-4 flex items-center gap-2 text-[13px]">
              <span className="rounded-full bg-[var(--front-accent)] px-2.5 py-0.5 text-white">{t("gift")}</span>
              <span className="text-[var(--front-text-soft)]">{view.giftNote}</span>
            </div>
          )}
          <ProductCtaRow product={product} className="mt-7" />
        </div>
      </div>

      <p className="front-tab is-active mx-auto mt-8 mb-2 w-fit text-[15px] md:mt-12">{t("productDetail")}</p>
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
            {detail.heroOverlay && <p className="font-serif text-[22px] font-semibold">{detail.heroOverlay}</p>}
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
