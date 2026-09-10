"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyHint, ProductCard } from "@/components/catalog";
import { productCategories, type Product, type ProductCategoryId } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { localized } from "@/lib/i18n";

export function CategoriesClient({ products }: { products: Product[] }) {
  const [active, setActive] = useState<ProductCategoryId>("opc");
  const [query, setQuery] = useState("");
  const { locale, t } = useLocale();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((item) => {
      if (item.categoryId !== active) return false;
      if (!q) return true;
      return [item.title, item.titleEn, item.shortTitle, item.shortTitleEn, item.subtitle ?? "", item.subtitleEn ?? ""].some(
        (field) => (field || "").toLowerCase().includes(q),
      );
    });
  }, [active, query, products]);

  return (
    <div className="flex min-h-[calc(100dvh-96px)] flex-col py-4 md:min-h-0 md:py-8">
      <div className="px-4 md:px-0">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--front-text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchKeyword")}
            className="front-input h-12 w-full rounded-[var(--front-radius-sm)] border border-[var(--front-border)] bg-[var(--front-surface)] pr-3 pl-10 text-[15px] outline-none placeholder:text-[var(--front-text-muted)]"
          />
        </div>
        <nav className="mt-6 flex gap-6 overflow-x-auto">
          {productCategories.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={cn("front-tab shrink-0 text-[15px] md:text-[16px]", selected && "is-active")}
              >
                {localized(locale, category.label, category.labelEn)}
              </button>
            );
          })}
        </nav>
      </div>
      <section className="min-w-0 flex-1 px-4 pt-6 md:px-0">
        {list.length === 0 ? (
          <EmptyHint>{t("noProducts")}</EmptyHint>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {list.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
        <p className="py-10 text-center text-[13px] text-[var(--front-text-muted)]">{t("moreNone")}</p>
      </section>
    </div>
  );
}
