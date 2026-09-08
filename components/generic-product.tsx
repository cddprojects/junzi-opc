"use client";

import { Share2, Star } from "lucide-react";
import { CoverArt } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { BuyNowButton } from "@/components/buy-now-button";
import { VideoBlock } from "@/components/video-block";
import { useDemoStore } from "@/components/demo-store";
import { Money } from "@/components/money";
import type { CatalogVideo, Product } from "@/lib/data";
import { cn } from "@/lib/utils";

export function GenericProductDetail({
  product,
  video,
}: {
  product: Product;
  video?: CatalogVideo;
}) {
  const { toggleFavorite, favorites } = useDemoStore();
  const favored = favorites.includes(product.slug);
  const lessons = (product.outline || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="bg-[#f7f7f7] pb-4 md:bg-transparent">
      <div className="md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-8 md:rounded-2xl md:bg-white md:p-6">
        {video ? (
          <VideoBlock video={video} />
        ) : (
          <CoverArt theme={product.cover} image={product.coverImage} className="rounded-none md:rounded-xl" />
        )}
        <div className="bg-white px-3 pt-3 pb-4 md:bg-transparent md:px-0 md:pt-0">
          <div className="flex items-end justify-between">
            <span className="text-[24px] font-semibold text-[#fa3534]">
              <Money cny={product.price} />
            </span>
            <span className="text-[12px] text-[#999]">已售 {product.sales} 件</span>
          </div>
          {product.originalPrice ? (
            <p className="mt-1 text-[13px] text-[#999] line-through">
              <Money cny={product.originalPrice} />
            </p>
          ) : null}
          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-[18px] leading-7 font-semibold md:text-[26px]">{product.title}</h1>
            <button
              type="button"
              onClick={() => toggleFavorite(product.slug)}
              className="flex flex-col items-center gap-0.5 text-[10px] text-[#888]"
            >
              <Star className={cn("size-4", favored && "fill-[#fa3534] text-[#fa3534]")} />
              收藏
            </button>
          </div>
          {product.subtitle && <p className="mt-2 text-[13px] text-[#666]">{product.subtitle}</p>}
          <BuyNowButton product={product} className="mt-6 h-11 w-full" />
        </div>
      </div>

      <p className="py-3 text-center text-[12px] text-[#999]">—— 商品详情 ——</p>
      <div className="space-y-3 px-3 pb-4 md:px-0">
        {product.description && (
          <section className="rounded-md bg-white px-3 py-4 md:rounded-xl md:px-5">
            <h2 className="text-[15px] font-semibold">课程介绍</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#555] whitespace-pre-wrap">{product.description}</p>
          </section>
        )}
        {lessons.length > 0 && (
          <section className="rounded-md bg-white px-3 py-4 md:rounded-xl md:px-5">
            <h2 className="text-[15px] font-semibold">课程大纲</h2>
            <ol className="mt-3 space-y-2 text-[13px] text-[#444]">
              {lessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ol>
          </section>
        )}
        <p className="hidden items-center gap-1 text-[12px] text-[#888] md:flex">
          <Share2 className="size-3.5" /> 演示站仅供浏览
        </p>
      </div>
      <div className="md:hidden">
        <BuyBar />
      </div>
    </div>
  );
}
