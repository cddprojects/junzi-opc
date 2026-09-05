"use client";

import Link from "next/link";
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
import { CoverArt, QihangHeroCover } from "@/components/covers";
import { BuyBar } from "@/components/buy-bar";
import { VideoBlock } from "@/components/video-block";
import { useDemoStore } from "@/components/demo-store";
import { emptyCourseDetail, hasDetailImages, hasStructuredOutline, normalizeDetailImages } from "@/lib/course";
import type { CatalogVideo, CourseDetail, LessonIcon, Product } from "@/lib/data";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { isPlanSectionTitle } from "@/lib/i18n";
import { localizeProduct } from "@/lib/localize";

const lessonIcons: Record<LessonIcon, typeof Play> = {
  play: Play,
  person: User,
  list: List,
  people: Users,
  target: Target,
  box: Box,
  pyramid: Target,
  check: CheckSquare,
};

export function CourseDetailView({
  product,
  video,
}: {
  product: Product;
  video?: CatalogVideo;
}) {
  const { toggleFavorite, favorites, openPay } = useDemoStore();
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
    <div className="bg-[#f7f4ee] pb-4 md:bg-transparent">
      <div className="md:grid md:grid-cols-[1.15fr_0.85fr] md:items-start md:gap-6">
        <div className="overflow-hidden md:rounded-2xl">
          <Hero product={view} detail={detail} video={heroVideo} />
        </div>
        <div className="bg-white px-3 pt-3 pb-4 md:rounded-2xl md:px-6 md:py-5">
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
            <div className="flex shrink-0 gap-3 text-center text-[10px] text-[#888]">
              <span className="flex flex-col items-center gap-0.5">
                <Share2 className="size-4" />
                {t("share")}
              </span>
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
          <button
            type="button"
            onClick={() => openPay(product)}
            className="mt-5 hidden h-11 w-full rounded-md bg-[#fa3534] text-white md:block"
          >
            {t("buyNow")}
          </button>
        </div>
      </div>

      <p className="py-3 text-center text-[12px] text-[#999] md:pt-8">{t("productDetail")}</p>

      {hasDetailImages(product) ? (
        <ImageDetail product={product} hasLessons={detail.lessons.length > 0} />
      ) : hasStructuredOutline(detail) ? (
      <section className="px-4 pb-6 text-[#2b261c] md:px-0">
        {detail.valueLine && <p className="text-center text-[15px] md:text-[18px]">{detail.valueLine}</p>}
        {detail.pillars.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center md:gap-4">
            {detail.pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-md bg-white/70 px-1 py-3 md:px-3">
                <Eye className="mx-auto size-5 text-[#6a5840]" />
                <p className="mt-2 text-[13px] font-medium">{pillar.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#6a5840] md:text-[13px]">{pillar.desc}</p>
              </div>
            ))}
          </div>
        )}
        {detail.body && (
          <div className="mt-5 rounded-md bg-white/80 px-3 py-4 md:rounded-xl md:px-6">
            <h3 className="text-[15px] font-semibold">{t("courseIntro")}</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#4a4336] whitespace-pre-wrap md:text-[14px]">{detail.body}</p>
          </div>
        )}
        {detail.statsLine && <p className="mt-6 text-center text-[15px] font-medium">{detail.statsLine}</p>}
        {detail.stats.length > 0 && (
          <div className="mt-3 flex rounded-md bg-[#1c1c1c] text-white">
            {detail.stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="flex flex-1 flex-col items-center py-3 text-[12px]">
                <span className="text-[15px] font-semibold">{stat.value}</span>
                <span className="mt-0.5 text-white/70">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {detail.lessons.length > 0 && (
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <h3 className="text-[16px] font-semibold">{detail.lessonsTitle || t("syllabus")}</h3>
              {detail.lessonsTag && <span className="text-[12px] text-[#8a7048]">{detail.lessonsTag}</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-2">
              {detail.lessons.map((lesson) => {
                const Icon = lessonIcons[lesson.icon] || Play;
                return (
                  <div
                    key={`${lesson.index}-${lesson.title}`}
                    className={cn("rounded-md bg-white px-2 py-2.5 md:px-3", lesson.highlight && "bg-[#efe0c4]")}
                  >
                    <div className="flex items-start gap-1.5">
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-[#8a7048]" />
                      <div>
                        <p className="text-[11px] text-[#8a7048]">{t("lessonN", { n: lesson.index })}</p>
                        <p className="mt-0.5 text-[12px] leading-5 md:text-[13px]">{lesson.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href={`/courses/recorded/${product.slug}`}
              className="mt-3 inline-block text-[13px] text-[#8a5a20]"
            >
              {t("goRecordedLessons")}
            </Link>
          </div>
        )}

        {detail.flow.length > 0 && (
          <div className="mt-6 rounded-md bg-[#1d2a3a] px-3 py-4 text-white md:flex md:items-center md:gap-3">
            {detail.flow.map((step, index) => (
              <div key={step} className="mt-2 flex items-center gap-2 text-[12px] first:mt-0 md:mt-0 md:flex-1">
                <span className="rounded bg-white/10 px-2 py-2 md:flex-1 md:text-center">{step}</span>
                {index < detail.flow.length - 1 && <span className="text-[#d4b56a]">→</span>}
              </div>
            ))}
          </div>
        )}

        {detail.lives.map((live) => (
          <div key={`${live.index}-${live.title}`} className="mt-6 rounded-md bg-white px-3 py-4 md:px-5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#2b5a8a] text-[10px] text-white">
                {t("liveN", { n: live.index })}
              </span>
              <h3 className="text-[15px] font-semibold">{live.title}</h3>
            </div>
            {live.items.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-[13px] text-[#4a4336]">
                {live.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            )}
            {detail.liveNote && live.index === detail.lives.length && (
              <div className="mt-3 flex items-center gap-2 rounded bg-[#f7f1e4] px-2 py-2 text-[12px] text-[#6a5840]">
                <CalendarDays className="size-4" />
                {detail.liveNote}
              </div>
            )}
          </div>
        ))}

        {detail.outcomes.length > 0 && (
          <>
            <h3 className="mt-8 text-center text-[16px] font-semibold">{detail.outcomesTitle || t("afterCourse")}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {detail.outcomes.map((item) => (
                <div key={item.title} className="rounded-md bg-white px-2 py-3 text-center">
                  <Map className="mx-auto size-5 text-[#555]" />
                  <p className="mt-2 text-[12px] leading-4">{item.title}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {detail.audiences.length > 0 && (
          <>
            <h3 className="mt-8 text-center text-[16px] font-semibold">{detail.audiencesTitle || t("whoFor")}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {detail.audiences.map((item) => (
                <div key={item.title} className="rounded-md bg-white px-2 py-3 text-center">
                  <User className="mx-auto size-5 text-[#555]" />
                  <p className="mt-2 text-[12px] leading-4">{item.title}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {detail.disclaimer.length > 0 && (
          <div className="mt-4 grid gap-2 rounded-md border border-[#e6d7b6] bg-[#f8f1de] px-3 py-3 text-[12px] leading-5 text-[#6a5840] md:grid-cols-2">
            {detail.disclaimer.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        )}

        {detail.extraSections.map((section, idx) => {
          if (!section.title && !section.body && !section.items?.length) return null;
          const numbered = isPlanSectionTitle(section.title);
          return (
            <div key={`${section.title}-${idx}`} className="mt-6 rounded-md bg-white px-3 py-4 md:px-5">
              {section.title ? <h3 className="text-center text-[16px] font-semibold">{section.title}</h3> : null}
              {section.body ? (
                <p className="mt-2 text-[13px] leading-6 whitespace-pre-wrap">{section.body}</p>
              ) : null}
              {section.items && section.items.length > 0 ? (
                numbered ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {section.items.map((item, i) => (
                      <div key={`${item}-${i}`} className="flex gap-3 rounded-xl bg-[#f7f4ee] p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a4a3a] text-xs font-bold text-[#f4d27a]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="pt-1 text-[13px] leading-5 text-[#333]">{item}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1 text-[13px] text-[#555]">
                    {section.items.map((item, i) => (
                      <li key={`${item}-${i}`}>· {item}</li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          );
        })}

        {(detail.joinLine || detail.joinSub) && (
          <div className="relative mt-6 overflow-hidden rounded-md bg-[#1b1b1b] px-4 py-6 text-center text-white">
            <p className="text-[13px]">{view.title}</p>
            {detail.joinSub && <p className="mt-1 text-[11px] text-white/70">{detail.joinSub}</p>}
            {detail.joinLine && <p className="mt-4 text-[18px] leading-7 font-medium">{detail.joinLine}</p>}
            <p className="mt-5 text-[11px] text-[#d4b56a]">{t("coverMotto")}</p>
          </div>
        )}
      </section>
      ) : (
        <p className="px-4 pb-8 text-center text-[13px] text-[#999]">{t("noProductDetail")}</p>
      )}
      <div className="md:hidden">
        <BuyBar product={product} />
      </div>
    </div>
  );
}

function ImageDetail({ product, hasLessons }: { product: Product; hasLessons: boolean }) {
  const { t } = useLocale();
  const images = normalizeDetailImages(product.detailImages);
  return (
    <section className="pb-6">
      <div className="overflow-hidden bg-white md:rounded-xl">
        {images.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            className="block w-full"
          />
        ))}
      </div>
      {hasLessons ? (
        <div className="px-4 pt-3 md:px-0">
          <Link href={`/courses/recorded/${product.slug}`} className="inline-block text-[13px] text-[#8a5a20]">
            {t("goRecordedLessons")}
          </Link>
        </div>
      ) : null}
    </section>
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
        <CoverArt theme={product.cover} image={product.coverImage} className="rounded-none md:aspect-[16/9]" />
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
