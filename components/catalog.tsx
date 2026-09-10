"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Megaphone, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CoverArt, GuideBanner } from "@/components/covers";
import { cn } from "@/lib/utils";
import { Money } from "@/components/money";
import { useCurrency } from "@/components/currency-provider";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";
import { locProductSubtitle, locProductTitle } from "@/lib/localize";
import { type CoverTheme, type Product } from "@/lib/data";

export function NoticeBar({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-[#fff8e8] px-3 py-2 text-[12px] text-[#8a6a20]"
    >
      <Megaphone className="size-3.5 shrink-0 text-[#d4a017]" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <ChevronRight className="size-3.5 shrink-0 text-[#bbb]" />
    </Link>
  );
}

export function SearchBox({
  placeholder = "搜索",
  defaultValue = "",
  center,
  action = "/search",
}: {
  placeholder?: string;
  defaultValue?: string;
  center?: boolean;
  action?: string;
}) {
  return (
    <form action={action} className="px-3 py-2 md:px-0">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(
            "mp-search-field h-9 rounded-[50px] border-0 bg-[#f8f8f8] pr-3 pl-10 text-[13px] shadow-none placeholder:text-[#bbb]",
            center && "text-center placeholder:text-center",
          )}
        />
      </div>
    </form>
  );
}

export function ProductRow({
  product,
  showOriginal = true,
}: {
  product: Product;
  showOriginal?: boolean;
}) {
  const { locale, t } = useLocale();
  const title = locProductTitle(product, locale);
  const href = `/product/${product.slug}`;

  return (
    <Link
      href={href}
      prefetch
      className="relative flex cursor-pointer gap-3 bg-white px-3 py-2.5 active:opacity-70"
      aria-label={title}
    >
      <span className="block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-md">
        <CoverArt
          theme={product.cover}
          image={product.coverImage}
          compact
          className="h-full w-full"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[14px] leading-5 font-medium text-[#333]">{title}</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-[16px] leading-none font-semibold text-[#fa3534]">
              <Money cny={product.price} />
            </p>
            {showOriginal && product.originalPrice ? (
              <p className="mt-1 text-[11px] text-[#bbb] line-through">
                {t("originalPrice")} <Money cny={product.originalPrice} />
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-[#bbb]">{t("salesCount", { n: product.sales })}</p>
          </div>
          <span className="mp-plus" aria-hidden>
            <Plus className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CourseListCard({
  href,
  title,
  learners,
  cover,
  className,
}: {
  href: string;
  title: string;
  learners: number;
  cover: CoverTheme;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn("block overflow-hidden bg-white active:opacity-80", className)}
    >
      <CoverArt theme={cover} showVideoBadge className="aspect-[16/9]" />
      <div className="px-3 py-3">
        <h3 className="text-[15px] leading-5 font-medium text-[#333]">{title}</h3>
        <CourseLearners count={learners} />
      </div>
    </Link>
  );
}

function CourseLearners({ count }: { count: number }) {
  const { t } = useLocale();
  return <p className="mt-2 text-[13px] text-[var(--front-text-muted)]">{t("learnersCount", { n: count })}</p>;
}

export function CategoryIcons({
  items,
}: {
  items: readonly { id: string; label: string; labelEn?: string; href: string }[];
}) {
  const { locale } = useLocale();
  return (
    <div className="grid grid-cols-5 gap-1 px-2 py-3 md:gap-6 md:px-0">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="flex flex-col items-center gap-1.5 text-center">
          <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#f4f4f4] md:size-[64px]">
            <CategoryGlyph id={item.id} />
          </span>
          <span className="max-w-[4.6rem] text-[11px] leading-4 text-[#555] md:max-w-[7.5rem] md:text-[13px]">
            {localized(locale, item.label, item.labelEn)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function CategoryGlyph({ id }: { id: string }) {
  if (id === "recorded") {
    return (
      <svg viewBox="0 0 48 48" className="size-10">
        <rect x="10" y="12" width="28" height="22" rx="3" fill="#d7c4a2" />
        <rect x="14" y="16" width="20" height="12" rx="1" fill="#f7f1e6" />
        <path d="M16 32h16" stroke="#8a7048" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "live") {
    return (
      <svg viewBox="0 0 48 48" className="size-10">
        <rect x="11" y="13" width="26" height="18" rx="2" fill="#c9d4c2" />
        <rect x="15" y="16" width="18" height="10" fill="#f4f7f1" />
        <path d="M18 35h12" stroke="#6d7a62" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "workshop") {
    return (
      <svg viewBox="0 0 48 48" className="size-10">
        <circle cx="18" cy="18" r="5" fill="#c9a07a" />
        <circle cx="30" cy="18" r="5" fill="#8fa3b0" />
        <path d="M10 34c2-7 8-9 8-9s6 2 8 9" fill="#e6d3b8" />
        <path d="M22 34c2-7 8-9 8-9s6 2 8 9" fill="#d5dee4" />
      </svg>
    );
  }
  if (id === "member") {
    return (
      <svg viewBox="0 0 48 48" className="size-10">
        <path d="M24 10l8 5v9c0 7-5 11-8 13-3-2-8-6-8-13v-9z" fill="#d4b56a" />
        <circle cx="24" cy="22" r="4" fill="#f7efd6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="size-10">
      <rect x="14" y="11" width="20" height="26" rx="2" fill="#d8c6a4" />
      <path d="M18 18h12M18 23h12M18 28h8" stroke="#8a7048" strokeWidth="1.5" />
    </svg>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { format } = useCurrency();
  const { locale, t } = useLocale();
  const title = locProductTitle(product, locale);
  const subtitle = locProductSubtitle(product, locale);
  const href = `/product/${product.slug}`;
  return (
    <Link
      href={href}
      prefetch
      className="relative block overflow-hidden bg-white shadow-[0_1px_4px_rgb(0_0_0/6%)] active:opacity-80"
      aria-label={title}
    >
      <CoverArt
        theme={product.cover}
        image={product.coverImage}
        showPrice
        priceLabel={format(product.price)}
      />
      <div className="p-4">
        <p className="text-[15px] font-medium">{title}</p>
        {subtitle && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#888]">{subtitle}</p>}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[18px] font-semibold text-[#fa3534]">
              <Money cny={product.price} />
            </p>
            {product.originalPrice ? (
              <p className="text-[12px] text-[#bbb] line-through">
                {t("originalPrice")} <Money cny={product.originalPrice} />
              </p>
            ) : null}
            <p className="mt-1 text-[12px] text-[#bbb]">{t("salesCount", { n: product.sales })}</p>
          </div>
          <span className="mp-plus size-8" aria-hidden>
            <Plus className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function HomeCarousel({
  slides,
}: {
  slides: { id: string; href: string; title: string; image: string }[];
}) {
  const [index, setIndex] = React.useState(0);
  const touchX = React.useRef<number | null>(null);
  const { t } = useLocale();
  const safeSlides = slides.filter((item) => item.image);

  React.useEffect(() => {
    if (safeSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [safeSlides.length]);

  React.useEffect(() => {
    if (index >= safeSlides.length) setIndex(0);
  }, [index, safeSlides.length]);

  if (!safeSlides.length) return null;

  function go(next: number) {
    const total = safeSlides.length;
    setIndex(((next % total) + total) % total);
  }

  return (
    <section
      className="relative overflow-hidden bg-[#111]"
      aria-roledescription="carousel"
      aria-label={t("homeCarousel")}
      onTouchStart={(event) => {
        touchX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current == null || safeSlides.length < 2) return;
        const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (dx > 40) go(index - 1);
        if (dx < -40) go(index + 1);
      }}
    >
      <div
        className="flex transition-transform duration-300 ease-[var(--ease-standard)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {safeSlides.map((slide, i) => {
          const className = "block w-full shrink-0";
          const media = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title}
              className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
            />
          );
          if (isExternalHref(slide.href)) {
            return (
              <a
                key={slide.id}
                href={slide.href}
                className={className}
                target="_blank"
                rel="noreferrer"
                aria-hidden={i !== index}
                tabIndex={i === index ? 0 : -1}
              >
                {media}
              </a>
            );
          }
          return (
            <Link
              key={slide.id}
              href={slide.href || "/"}
              prefetch
              className={className}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
            >
              {media}
            </Link>
          );
        })}
      </div>
      {safeSlides.length > 1 ? (
        <div className="absolute right-0 bottom-2 left-0 flex justify-center gap-1.5">
          {safeSlides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={t("carouselSlide", { n: i + 1 })}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function HomeGuideBanners({
  banners,
}: {
  banners: { id: string; href: string; title: string; image?: string }[];
}) {
  const uploaded = banners.filter((item) => item.image);
  if (uploaded.length > 0) {
    return (
      <div className="w-full space-y-2">
        {uploaded.map((banner) => {
          const media = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.image}
              alt={banner.title}
              className="block aspect-[16/5] w-full object-cover md:aspect-[21/6]"
            />
          );
          if (isExternalHref(banner.href)) {
            return (
              <a
                key={banner.id}
                href={banner.href}
                target="_blank"
                rel="noreferrer"
                className="mp-full-bleed"
              >
                {media}
              </a>
            );
          }
          return (
            <Link key={banner.id} href={banner.href || "/guides"} prefetch className="mp-full-bleed">
              {media}
            </Link>
          );
        })}
      </div>
    );
  }

  const href = banners[0]?.href || "/guides";
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block w-full">
        <GuideBanner />
      </a>
    );
  }
  return (
    <Link href={href} prefetch className="block w-full">
      <GuideBanner />
    </Link>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mp-section-title text-[16px] font-semibold tracking-tight md:text-[20px]">
      {children}
    </h2>
  );
}

export function HomeMediaSection({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mp-home-block">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-14 text-center text-[15px] text-[var(--front-text-muted)]">{children}</p>;
}

export function PlusPrice({
  price,
  originalPrice,
  sales,
}: {
  price: number;
  originalPrice?: number;
  sales?: number;
}) {
  return (
    <div>
      <p className="front-price text-[22px] font-semibold">
        <Money cny={price} />
      </p>
      {originalPrice ? (
        <p className="text-[13px] text-[var(--front-text-muted)] line-through">
          <Money cny={originalPrice} />
        </p>
      ) : null}
      {sales != null ? <SoldLine sales={sales} /> : null}
    </div>
  );
}

function SoldLine({ sales }: { sales: number }) {
  const { t } = useLocale();
  return <p className="text-[13px] text-[var(--front-text-muted)]">{t("soldCount", { n: sales })}</p>;
}
