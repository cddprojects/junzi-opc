"use client";

import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { useDemoStore } from "@/components/demo-store";
import { EmptyHint } from "@/components/catalog";
import { Money } from "@/components/money";
import { useLocale } from "@/components/locale-provider";
import { locProductTitle } from "@/lib/localize";

export default function CartPage() {
  const { cart, removeFromCart, openPay } = useDemoStore();
  const { locale, t } = useLocale();
  const total = cart.reduce((sum, row) => sum + row.product.price * row.qty, 0);

  return (
    <div className="min-h-[60vh] bg-white md:overflow-hidden md:rounded-2xl md:shadow-sm">
      {cart.length === 0 ? (
        <EmptyHint>{t("cartEmpty")}</EmptyHint>
      ) : (
        <div>
          {cart.map((row) => (
            <div key={row.slug} className="flex gap-3 border-b border-[#f3f3f3] px-3 py-3 md:px-6">
              <Link href={row.product.href} className="w-20 overflow-hidden rounded-md">
                <CoverArt theme={row.product.cover} image={row.product.coverImage} compact />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={row.product.href} className="block text-[14px] font-medium">
                  {locProductTitle(row.product, locale)}
                </Link>
                <p className="mt-2 text-[15px] text-[#fa3534]">
                  <Money cny={row.product.price} />
                </p>
                <div className="mt-2 flex items-center justify-between text-[12px] text-[#888]">
                  <span>{t("qty", { n: row.qty })}</span>
                  <button type="button" onClick={() => removeFromCart(row.slug)}>
                    {t("remove")}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-3 md:px-6">
            <p className="text-[14px]">
              {t("total")}{" "}
              <span className="text-[18px] text-[#fa3534]">
                <Money cny={total} />
              </span>
            </p>
            <button
              type="button"
              onClick={() => openPay()}
              className="rounded-lg bg-[#fa3534] px-4 py-2 text-[14px] text-white"
            >
              {t("checkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
