"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Headset, Home, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/data";
import { useDemoStore, cartCount } from "@/components/demo-store";
import { AddToCartButton } from "@/components/product-cta";
import { BuyNowButton } from "@/components/buy-now-button";
import { useT } from "@/components/locale-provider";

function BarLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 text-[10px] text-[#666]">
      {children}
      {label}
    </Link>
  );
}

export function BuyBar({ product }: { product?: Product }) {
  const { cart } = useDemoStore();
  const count = cartCount(cart);
  const t = useT();

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[30] border-t border-[#eee] bg-white md:hidden">
      <div className="flex items-center gap-1 pr-2 pl-1 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]">
        <BarLink href="/" label={t("navHome")}>
          <Home className="size-5" />
        </BarLink>
        <BarLink href="/service" label={t("service")}>
          <Headset className="size-5" />
        </BarLink>
        <BarLink href="/cart" label={t("cart")}>
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute top-0 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fa3534] px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </BarLink>
        {product ? (
          <AddToCartButton product={product} iconOnly className="size-11 rounded-xl" />
        ) : null}
        <BuyNowButton product={product} className="h-11 min-h-11 flex-1 rounded-xl text-[15px]" />
      </div>
    </div>
  );
}
