"use client";

import Link from "next/link";
import type { Product } from "@/lib/data";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function BuyNowButton({
  product,
  className,
  children,
}: {
  product?: Product;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  const href = product ? `/checkout?slug=${encodeURIComponent(product.slug)}` : "/checkout";

  return (
    <Link
      href={href}
      className={cn(
        "relative z-20 inline-flex cursor-pointer items-center justify-center rounded-md bg-[#fa3534] text-[15px] font-medium text-white hover:bg-[#e12f2e]",
        className,
      )}
    >
      {children || t("buyNow")}
    </Link>
  );
}
