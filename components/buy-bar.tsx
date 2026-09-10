"use client";

import Link from "next/link";
import { Home, ShoppingCart } from "lucide-react";
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
    <div className="fixed right-0 bottom-0 left-0 z-[30] border-t border-[#eee] bg-white pb-[env(safe-area-inset-bottom)] md:left-1/2 md:max-w-[1200px] md:-translate-x-1/2">
      <div className="flex h-[50px] items-center pr-2 pl-1">
        <Link href="/" className="flex w-11 flex-col items-center gap-0.5 text-[10px] text-[#666]">
          <Home className="size-5" />
          {t("navHome")}
        </Link>
        <Link href="/cart" className="relative flex w-11 flex-col items-center gap-0.5 text-[10px] text-[#666]">
          <ShoppingCart className="size-5" />
          {t("cart")}
          {count > 0 && (
            <span className="absolute top-[-2px] right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </Link>
        {product ? (
          <ProductCtaRow product={product} compact className="ml-1 min-w-0 flex-1" />
        ) : (
          <BuyNowButton className="ml-1 h-9 flex-1" />
        )}
      </div>
    </div>
  );
}
