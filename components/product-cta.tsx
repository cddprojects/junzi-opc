"use client";

import type { Product } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
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
  iconOnly,
}: {
  product: Product;
  className?: string;
  iconOnly?: boolean;
}) {
  const { addToCart } = useDemoStore();
  const { loading } = useAuth();
  const t = useT();

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => addToCart(product)}
      aria-label={t("addToCart")}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-60",
        iconOnly
          ? "shrink-0 bg-[#fff1f0] text-[#fa3534] hover:bg-[#ffe4e1]"
          : "front-btn-secondary flex-1 gap-1 px-2 text-[13px]",
        className,
      )}
    >
      <CartPlusIcon className={iconOnly ? "size-6" : "size-[18px] shrink-0"} />
      {iconOnly ? null : t("addToCart")}
    </button>
  );
}

export function ProductCtaRow({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  return (
    <div className={cn("flex items-stretch gap-3", className)}>
      <AddToCartButton product={product} iconOnly className="size-14 rounded-[14px]" />
      <BuyNowButton product={product} className="h-14 min-h-14 flex-[1_1_80%] rounded-[14px] text-[16px]" />
    </div>
  );
}
