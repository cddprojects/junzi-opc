"use client";

import { useState } from "react";
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
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        openPay(product);
        window.setTimeout(() => setBusy(false), 600);
      }}
      className={cn(
        "relative z-20 cursor-pointer rounded-md bg-[#fa3534] text-[15px] font-medium text-white hover:bg-[#e12f2e] disabled:opacity-70",
        className,
      )}
    >
      {busy ? t("pleaseWait") : children || t("buyNow")}
    </button>
  );
}
