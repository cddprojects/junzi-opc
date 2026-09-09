"use client";

import type { Product } from "@/lib/data";
import { useDemoStore } from "@/components/demo-store";
import { BuyNowButton } from "@/components/buy-now-button";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

function CartPlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M3 4h1.6c.3 0 .6.2.7.5L6.4 8H20c.7 0 1.1.7.9 1.3l-1.5 5.2A1.5 1.5 0 0 1 18 16H8.2a1.5 1.5 0 0 1-1.4-1l-2.5-8.2H3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="19.2" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19.2" r="1.3" fill="currentColor" />
      <path d="M13 9.2v4.6M10.7 11.5h4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addToCart } = useDemoStore();
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => addToCart(product)}
      className={cn(
        "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#8a5a20] bg-[#f7efe3] px-3 text-[14px] font-medium text-[#8a5a20] transition hover:bg-[#efe4d2] active:opacity-80",
        className,
      )}
    >
      <CartPlusIcon className="size-[18px] shrink-0" />
      {t("addToCart")}
    </button>
  );
}

export function ProductCtaRow({
  product,
  className,
  compact,
}: {
  product: Product;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex gap-2.5", className)}>
      <AddToCartButton product={product} className={compact ? "h-10 text-[13px]" : undefined} />
      <BuyNowButton
        product={product}
        className={cn("flex-1", compact ? "h-10 text-[13px]" : "h-11")}
      />
    </div>
  );
}
