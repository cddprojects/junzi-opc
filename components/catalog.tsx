"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CoverArt } from "@/components/covers";
import { useDemoStore } from "@/components/demo-store";
import { cn } from "@/lib/utils";
import { formatPrice, formatYen } from "@/lib/format";
import type { CoverTheme, Product } from "@/lib/data";

export function NoticeBar({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-[#f3f3f3] px-3 py-2 text-[12px] text-[#555]"
    >
      <Megaphone className="size-3.5 shrink-0 text-[#888]" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <span className="text-[#bbb]">&gt;</span>
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
    <form action={action} className="px-3 py-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(
            "h-9 rounded-full border-none bg-white pr-3 text-[13px] shadow-none placeholder:text-[#bbb]",
            center ? "pl-9 text-center placeholder:text-center" : "pl-9",
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
  const { addToCart } = useDemoStore();

  return (
    <div className="flex gap-3 bg-white px-3 py-3">
      <Link href={product.href} className="block w-[88px] shrink-0 overflow-hidden rounded-md">
        <CoverArt theme={product.cover} compact showPrice />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={product.href} className="block text-[15px] leading-6 font-medium">
          {product.title}
        </Link>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[18px] leading-none font-semibold text-[#fa3534]">
              {formatYen(product.price)}
            </p>
            {showOriginal && product.originalPrice ? (
              <p className="mt-1 text-[11px] text-[#999] line-through">
                原价: {formatYen(product.originalPrice)}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-[#999]">销量: {product.sales}</p>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product.slug)}
            className="flex size-7 items-center justify-center rounded-full bg-[#fa3534] text-white"
            aria-label="加入购物车"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
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
    <Link href={href} className={cn("block overflow-hidden rounded-md bg-white shadow-sm", className)}>
      <CoverArt theme={cover} showVideoBadge />
      <div className="px-3 py-2.5">
        <h3 className="text-[15px] leading-6 font-medium">{title}</h3>
        <p className="mt-1 text-[12px] text-[#999]">{learners}人学习</p>
      </div>
    </Link>
  );
}

export function CategoryIcons({
  items,
}: {
  items: readonly { id: string; label: string; href: string }[];
}) {
  return (
    <div className="grid grid-cols-5 bg-white px-1 py-3">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="flex flex-col items-center gap-1.5">
          <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#f4efe6]">
            <CategoryGlyph id={item.id} />
          </span>
          <span className="text-[11px] text-[#444]">{item.label}</span>
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

export function HomeCarousel({
  slides,
}: {
  slides: { id: string; href: string; theme: CoverTheme; title: string }[];
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <div className="relative mx-3 overflow-hidden rounded-md">
      <button type="button" className="block w-full text-left" onClick={() => router.push(slide.href)}>
        <CoverArt theme={slide.theme} className="aspect-[16/9]" />
      </button>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {slides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`轮播 ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-3.5 bg-white" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-3 pt-4 pb-2 text-[16px] font-semibold">{children}</h2>;
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-10 text-center text-[13px] text-[#999]">{children}</p>;
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
      <p className="text-[20px] font-semibold text-[#fa3534]">¥{formatPrice(price)}</p>
      {originalPrice ? (
        <p className="text-[12px] text-[#999] line-through">¥{formatPrice(originalPrice)}</p>
      ) : null}
      {sales != null ? <p className="text-[12px] text-[#999]">已售 {sales} 件</p> : null}
    </div>
  );
}
