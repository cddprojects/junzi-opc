"use client";

import Link from "next/link";
import { Headset, Home, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/data";
import { useDemoStore, cartCount } from "@/components/demo-store";
import { ProductCtaRow } from "@/components/product-cta";
import { BuyNowButton } from "@/components/buy-now-button";
import { useT } from "@/components/locale-provider";

export function BuyBar({ product }: { product?: Product }) {
  const { cart } = useDemoStore();
  const count = cartCount(cart);
  const t = useT();

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-[64px] w-full items-center border-t border-[var(--front-border)] bg-[var(--front-surface)] pr-2 pl-1 md:left-1/2 md:max-w-[1200px] md:-translate-x-1/2 md:rounded-t-[var(--front-radius-md)] md:shadow-[var(--front-shadow)]">
      <Link href="/" className="flex w-12 flex-col items-center gap-0.5 text-[10px] text-[var(--front-text-soft)]">
        <Home className="size-5" />
        {t("navHome")}
      </Link>
      <Link href="/service" className="flex w-12 flex-col items-center gap-0.5 text-[10px] text-[var(--front-text-soft)]">
        <Headset className="size-5" />
        {t("service")}
      </Link>
      <Link href="/cart" className="relative flex w-12 flex-col items-center gap-0.5 text-[10px] text-[var(--front-text-soft)]">
        <ShoppingCart className="size-5" />
        {t("cart")}
        {count > 0 && (
          <span className="absolute top-[-2px] right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--front-accent)] px-1 text-[10px] text-white">
            {count}
          </span>
        )}
      </Link>
      {product ? (
        <ProductCtaRow product={product} compact className="ml-1 min-w-0 flex-1" />
      ) : (
        <BuyNowButton className="ml-1 h-10 flex-1" />
      )}
    </div>
  );
}
