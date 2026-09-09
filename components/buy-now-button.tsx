"use client";

import type { Product } from "@/lib/data";
import { useDemoStore } from "@/components/demo-store";
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
  const { openPay } = useDemoStore();
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => openPay(product)}
      className={cn(
        "relative z-20 inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#8a5a20] text-[15px] font-medium text-white transition hover:bg-[#6f4818] active:opacity-80",
        className,
      )}
    >
      {children || t("buyNow")}
    </button>
  );
}
