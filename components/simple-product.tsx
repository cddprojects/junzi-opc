"use client";

import { Share2, Star } from "lucide-react";
import { CoverArt } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { BuyNowButton } from "@/components/buy-now-button";
import { VideoBlock } from "@/components/video-block";
import { useDemoStore } from "@/components/demo-store";
import { Money } from "@/components/money";
import { shizhanDetail } from "@/lib/data";
import type { CatalogVideo, Product } from "@/lib/data";
import { cn } from "@/lib/utils";

export function SimpleProductDetail({
  product,
  video,
}: {
  product: Product;
  video?: CatalogVideo;
}) {
  const { toggleFavorite, favorites } = useDemoStore();
  const favored = favorites.includes(product.slug);

  return (
    <div className="bg-[#f7f7f7] pb-4 md:bg-transparent">
      {video?.videoUrl || video?.poster ? (
        <VideoBlock video={video} />
      ) : (
        <CoverArt
          theme={product.cover}
          image={product.coverImage}
          className="rounded-none md:rounded-2xl"
        />
      )}
      <div className="bg-white px-3 pt-3 pb-4 md:mt-4 md:rounded-2xl md:px-6">
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
          <h1 className="font-serif text-[18px] leading-7 font-semibold">{product.title}</h1>
          <div className="flex shrink-0 gap-3 text-center text-[10px] text-[#888]">
            <span className="flex flex-col items-center gap-0.5">
              <Share2 className="size-4" />
              分享
            </span>
            <button
              type="button"
              onClick={() => toggleFavorite(product.slug)}
              className="flex flex-col items-center gap-0.5"
            >
              <Star className={cn("size-4", favored && "fill-[#fa3534] text-[#fa3534]")} />
              收藏
            </button>
          </div>
        </div>
        {product.subtitle && <p className="mt-2 text-[13px] text-[#666]">{product.subtitle}</p>}
        {product.description && (
          <p className="mt-3 text-[13px] leading-6 text-[#555] whitespace-pre-wrap">{product.description}</p>
        )}
        <BuyNowButton product={product} className="mt-5 h-11 w-full md:w-auto md:px-8" />
      </div>

      <p className="py-3 text-center text-[12px] text-[#999]">—— 商品详情 ——</p>

      {product.outline && product.slug !== "shizhan" && product.slug !== "compute" ? (
        <section className="mx-3 rounded-md bg-white px-3 py-4 md:mx-0">
          <h2 className="text-[15px] font-semibold">课程大纲</h2>
          <p className="mt-2 text-[13px] leading-6 whitespace-pre-wrap">{product.outline}</p>
        </section>
      ) : null}
      {product.slug === "shizhan" ? <ShizhanBody /> : product.slug === "compute" ? <ComputeBody /> : null}
      <div className="md:hidden">
        <BuyBar />
      </div>
    </div>
  );
}

function ShizhanBody() {
  return (
    <div className="space-y-3 px-3 pb-4">
      <section className="rounded-md bg-white px-3 py-4">
        <h2 className="text-[15px] font-semibold">{shizhanDetail.valueLine}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
          {shizhanDetail.stats.map((stat) => (
            <div key={stat.label} className="rounded bg-[#f7f7f7] py-3">
              <p className="font-medium">{stat.value}</p>
              <p className="mt-1 text-[#888]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-md bg-white px-3 py-4">
        <h2 className="text-[15px] font-semibold">课程大纲</h2>
        <ol className="mt-3 space-y-2 text-[13px] text-[#444]">
          {shizhanDetail.lessons.map((lesson) => (
            <li key={lesson.index}>
              第{lesson.index}节 {lesson.title}
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-md bg-white px-3 py-4">
        <h2 className="text-[15px] font-semibold">5场直播实战</h2>
        <ul className="mt-3 space-y-2 text-[13px] text-[#444]">
          {shizhanDetail.lives.map((item, index) => (
            <li key={item}>
              直播{index + 1} {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ComputeBody() {
  return (
    <div className="space-y-3 px-3 pb-4">
      <section className="rounded-md bg-white px-3 py-4">
        <h2 className="text-[15px] font-semibold">算力加餐说明</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#555]">
          3000 算力用于君子小雅 AI 工具小程序中的生成与辅助任务。本站仅展示商品信息，不发放真实算力，也不接入原小程序账户。
        </p>
      </section>
      <section className="rounded-md bg-white px-3 py-4">
        <h2 className="text-[15px] font-semibold">适用场景</h2>
        <ul className="mt-2 space-y-1 text-[13px] text-[#555]">
          <li>· 文案与定位草稿</li>
          <li>· 短视频脚本辅助</li>
          <li>· 项目拆解与复盘记录</li>
        </ul>
      </section>
    </div>
  );
}
