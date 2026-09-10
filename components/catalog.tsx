"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CoverArt } from "@/components/covers";
import { cn } from "@/lib/utils";
import { Money } from "@/components/money";
import { useCurrency } from "@/components/currency-provider";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";
import { locProductSubtitle, locProductTitle } from "@/lib/localize";
import { brand, type CoverTheme, type Product } from "@/lib/data";

export function NoticeBar({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-[var(--front-radius-sm)] bg-[var(--front-surface-soft)] px-4 py-3 text-[13px] text-[var(--front-text-soft)]"
    >
      <Megaphone className="size-3.5 shrink-0 text-[var(--front-accent)]" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <span className="text-[var(--front-text-muted)]">&gt;</span>
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
    <form action={action} className="px-4 py-3 md:px-0">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--front-text-muted)]" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(
            "h-12 rounded-[var(--front-radius-sm)] border-[var(--front-border)] bg-[var(--front-surface)] pr-3 text-[15px] shadow-none placeholder:text-[var(--front-text-muted)]",
            center ? "pl-10 text-center placeholder:text-center" : "pl-10",
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
  const { format } = useCurrency();
  const { locale, t } = useLocale();
  const title = locProductTitle(product, locale);
  const href = `/product/${product.slug}`;

  return (
    <Link
      href={href}
      prefetch
      className="relative z-10 flex cursor-pointer gap-4 bg-[var(--front-surface)] px-4 py-4 transition duration-150 hover:bg-[var(--front-surface-soft)] active:opacity-70"
      aria-label={title}
    >
      <span className="block w-[96px] shrink-0 overflow-hidden rounded-[var(--front-radius-sm)]">
        <CoverArt
          theme={product.cover}
          image={product.coverImage}
          compact
          showPrice
          priceLabel={format(product.price)}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[17px] leading-6 font-medium">{title}</p>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="front-price text-[20px] leading-none font-semibold">
              <Money cny={product.price} />
            </p>
            {showOriginal && product.originalPrice ? (
              <p className="mt-1 text-[12px] text-[var(--front-text-muted)] line-through">
                {t("originalPrice")} <Money cny={product.originalPrice} />
              </p>
            ) : null}
            <p className="mt-1 text-[12px] text-[var(--front-text-muted)]">{t("salesCount", { n: product.sales })}</p>
          </div>
          <span
            className="flex size-8 items-center justify-center rounded-full bg-[var(--front-accent)] text-white"
            aria-hidden
          >
            <Plus className="size-4" />
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
      className={cn(
        "front-card block cursor-pointer overflow-hidden transition-[box-shadow,opacity] duration-[var(--motion-hover)] ease-[var(--ease-standard)] hover:shadow-md active:opacity-80",
        className,
      )}
    >
      <CoverArt theme={cover} showVideoBadge />
      <div className="px-4 py-4">
        <h3 className="front-h3 font-serif">{title}</h3>
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
    <div className="grid grid-cols-5 gap-2 px-1 py-2 md:gap-6 md:px-0">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-[var(--front-surface-soft)] md:size-[72px]">
            <CategoryGlyph id={item.id} />
          </span>
          <span className="max-w-[7.5rem] text-[12px] leading-4 text-[var(--front-text-soft)] md:text-[14px]">
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
      className="front-card relative z-10 block cursor-pointer overflow-hidden transition-[box-shadow,opacity] duration-[var(--motion-hover)] ease-[var(--ease-standard)] hover:shadow-md active:opacity-80"
      aria-label={title}
    >
      <CoverArt
        theme={product.cover}
        image={product.coverImage}
        showPrice
        priceLabel={format(product.price)}
      />
      <div className="p-5">
        <p className="front-h3 font-serif">{title}</p>
        {subtitle && <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[var(--front-text-soft)]">{subtitle}</p>}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="front-price text-[22px] font-semibold">
              <Money cny={product.price} />
            </p>
            {product.originalPrice ? (
              <p className="text-[13px] text-[var(--front-text-muted)] line-through">
                {t("originalPrice")} <Money cny={product.originalPrice} />
              </p>
            ) : null}
            <p className="mt-1 text-[13px] text-[var(--front-text-muted)]">{t("salesCount", { n: product.sales })}</p>
          </div>
          <span
            className="flex size-9 items-center justify-center rounded-full bg-[var(--front-accent)] text-white"
            aria-hidden
          >
            <Plus className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function useSlideLabel() {
  const { t } = useLocale();
  return (n: number) => t("carouselSlide", { n });
}

export function HomeCarousel({
  slides,
}: {
  slides: { id: string; href: string; theme?: CoverTheme; title: string; image?: string; priceCny?: number }[];
}) {
  const [index, setIndex] = React.useState(0);
  const slideLabel = useSlideLabel();
  const { locale, t } = useLocale();
  const safeSlides = slides.length ? slides : [];

  React.useEffect(() => {
    if (safeSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [safeSlides.length]);

  const slide = safeSlides[index];
  if (!slide) return null;

  return (
    <div className="relative">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
        <div className="order-2 px-1 md:order-1 md:px-0">
          <p className="text-[12px] tracking-[0.16em] text-[var(--front-text-muted)] uppercase md:text-[13px]">
            {localized(locale, brand.society, brand.societyEn)}
          </p>
          <h1 className="front-h1 mt-3 font-serif">{slide.title}</h1>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-[var(--front-text-soft)] md:text-[17px]">
            {localized(locale, brand.mottoWay, brand.mottoWayEn)}
          </p>
          <Link href={slide.href} prefetch className="front-btn-primary mt-8">
            {t("buyNow")}
          </Link>
        </div>
        <Link href={slide.href} prefetch className="front-card order-1 overflow-hidden md:order-2">
          <CoverArt
            theme={slide.theme}
            image={slide.image}
            priceCny={slide.priceCny}
            className="aspect-[16/10] md:aspect-[5/4]"
          />
        </Link>
      </div>
      <div className="mt-6 flex justify-center gap-2 md:mt-10 md:justify-start">
        {slides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={slideLabel(i + 1)}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-7 bg-[var(--front-accent)]" : "w-2 bg-[var(--front-border-strong)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="opc-section-title front-h2 px-0 pb-5 font-semibold tracking-tight">
      {children}
    </h2>
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
