"use client";

import {
  Box,
  CalendarDays,
  CheckSquare,
  Eye,
  List,
  Map,
  Play,
  Share2,
  Star,
  Target,
  User,
  Users,
} from "lucide-react";
import { QihangHeroCover } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { BuyNowButton } from "@/components/buy-now-button";
import { VideoBlock } from "@/components/video-block";
import { useDemoStore } from "@/components/demo-store";
import { qihangDetail } from "@/lib/data";
import type { CatalogVideo, Product } from "@/lib/data";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";

const lessonIcons = {
  play: Play,
  person: User,
  list: List,
  people: Users,
  target: Target,
  box: Box,
  pyramid: Target,
  check: CheckSquare,
};

export function QihangDetail({ product, video }: { product: Product; video?: CatalogVideo }) {
  const { toggleFavorite, favorites } = useDemoStore();
  const favored = favorites.includes(product.slug);

  return (
    <div className="bg-[#f7f4ee] pb-4 md:bg-transparent">
      <div className="md:overflow-hidden md:rounded-2xl">
        {video?.videoUrl || video?.poster ? <VideoBlock video={video} /> : <QihangHeroCover />}
      </div>
      <div className="bg-white px-3 pt-3 pb-4 md:mt-4 md:rounded-2xl md:px-6">
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
          <span className="text-[12px] text-[#999]">已售 {product.sales} 件</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-serif text-[18px] leading-7 font-semibold">{product.title}</h1>
          <div className="flex shrink-0 gap-3 text-center text-[10px] text-[#888]">
            <button type="button" className="flex flex-col items-center gap-0.5">
              <Share2 className="size-4" />
              分享
            </button>
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
        <div className="mt-3 flex items-center gap-2 text-[12px]">
          {product.giftNote && <span className="rounded-full bg-[#fa3534] px-2 py-0.5 text-white">赠送</span>}
          <span className="text-[#555]">{product.giftNote}</span>
        </div>
        <BuyNowButton product={product} className="mt-5 h-11 w-full md:max-w-xs" />
      </div>

      <p className="py-3 text-center text-[12px] text-[#999]">—— 商品详情 ——</p>

      <section className="px-4 pb-6 text-[#2b261c] md:px-0">
        <p className="text-center text-[15px]">{qihangDetail.valueLine}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {qihangDetail.pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-md bg-white/70 px-1 py-3">
              <Eye className="mx-auto size-5 text-[#6a5840]" />
              <p className="mt-2 text-[13px] font-medium">{pillar.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#6a5840]">{pillar.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-md bg-white/80 px-3 py-4">
          <h3 className="text-[15px] font-semibold">什么是OPC</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#4a4336]">{qihangDetail.opcDef}</p>
        </div>
        <p className="mt-6 text-center text-[15px] font-medium">{qihangDetail.statsLine}</p>
        <div className="mt-3 flex rounded-md bg-[#1c1c1c] text-white">
          {qihangDetail.stats.map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col items-center py-3 text-[12px]">
              <span className="text-[15px] font-semibold">{stat.value}</span>
              <span className="mt-0.5 text-white/70">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <h3 className="text-[16px] font-semibold">{qihangDetail.lessonsTitle}</h3>
            <span className="text-[12px] text-[#8a7048]">{qihangDetail.lessonsTag}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {qihangDetail.lessons.map((lesson) => {
              const Icon = lessonIcons[lesson.icon];
              return (
                <div
                  key={lesson.index}
                  className={cn(
                    "rounded-md bg-white px-2 py-2.5",
                    lesson.highlight && "bg-[#efe0c4]",
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-[#8a7048]" />
                    <div>
                      <p className="text-[11px] text-[#8a7048]">第{lesson.index}节</p>
                      <p className="mt-0.5 text-[12px] leading-5">{lesson.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-md bg-[#1d2a3a] px-3 py-4 text-white">
          <div className="flex flex-col gap-2">
            {qihangDetail.flow.map((step, index) => (
              <div key={step} className="flex items-center gap-2 text-[12px]">
                <span className="rounded bg-white/10 px-2 py-2">{step}</span>
                {index < qihangDetail.flow.length - 1 && <span className="text-[#d4b56a]">→</span>}
              </div>
            ))}
          </div>
        </div>

        {qihangDetail.lives.map((live) => (
          <div key={live.index} className="mt-6 rounded-md bg-white px-3 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#2b5a8a] text-[10px] text-white">
                直播第{live.index}场
              </span>
              <h3 className="text-[15px] font-semibold">{live.title}</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-[13px] text-[#4a4336]">
              {live.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            {live.index === 3 && (
              <div className="mt-3 flex items-center gap-2 rounded bg-[#f7f1e4] px-2 py-2 text-[12px] text-[#6a5840]">
                <CalendarDays className="size-4" />
                {qihangDetail.live3Note}
              </div>
            )}
          </div>
        ))}

        <h3 className="mt-8 text-center text-[16px] font-semibold">完成课程后，你将拥有</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {qihangDetail.outcomes.map((item) => (
            <div key={item.title} className="rounded-md bg-white px-2 py-3 text-center">
              <Map className="mx-auto size-5 text-[#555]" />
              <p className="mt-2 text-[12px] leading-4">{item.title}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-center text-[16px] font-semibold">这门课程适合谁</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {qihangDetail.audiences.map((item) => (
            <div key={item.title} className="rounded-md bg-white px-2 py-3 text-center">
              <User className="mx-auto size-5 text-[#555]" />
              <p className="mt-2 text-[12px] leading-4">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-[#e6d7b6] bg-[#f8f1de] px-3 py-3 text-[12px] leading-5 text-[#6a5840]">
          {qihangDetail.disclaimer.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>

        <div className="relative mt-6 overflow-hidden rounded-md bg-[#1b1b1b] px-4 py-6 text-center text-white">
          <p className="text-[13px]">君子小雅 OPC 启航营</p>
          <p className="mt-1 text-[11px] text-white/70">10节录播课 + 3场直播实战 + 15天行动计划</p>
          <p className="mt-4 text-[18px] leading-7 font-medium">{qihangDetail.joinLine}</p>
          <p className="mt-5 text-[11px] text-[#d4b56a]">以君子之道修身 以小雅之智成事</p>
        </div>
      </section>
      <div className="md:hidden">
        <BuyBar />
      </div>
    </div>
  );
}
