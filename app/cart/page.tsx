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
    <div className="front-card min-h-[60vh] overflow-hidden">
      {cart.length === 0 ? (
        <EmptyHint>{t("cartEmpty")}</EmptyHint>
      ) : (
        <div>
          {cart.map((row) => (
            <div key={row.slug} className="flex gap-4 border-b border-[var(--front-border)] px-5 py-5 md:px-8">
              <Link href={row.product.href} className="w-24 overflow-hidden rounded-[var(--front-radius-sm)]">
                <CoverArt theme={row.product.cover} image={row.product.coverImage} compact />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={row.product.href} className="block font-serif text-[17px] font-medium">
                  {locProductTitle(row.product, locale)}
                </Link>
                <p className="front-price mt-3 text-[18px]">
                  <Money cny={row.product.price} />
                </p>
                <div className="mt-3 flex items-center justify-between text-[13px] text-[var(--front-text-muted)]">
                  <span>{t("qty", { n: row.qty })}</span>
                  <button type="button" onClick={() => removeFromCart(row.slug)}>
                    {t("remove")}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-5 md:px-8">
            <p className="text-[15px]">
              {t("total")}{" "}
              <span className="front-price font-serif text-[22px]">
                <Money cny={total} />
              </span>
            </p>
            <button type="button" onClick={() => openPay()} className="front-btn-primary">
              {t("checkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
