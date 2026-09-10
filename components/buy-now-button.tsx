"use client";

import type { Product } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
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
  const { loading } = useAuth();
  const t = useT();

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => openPay(product)}
      className={cn(
        "front-btn-primary relative z-20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children || t("buyNow")}
    </button>
  );
}
