"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyHint, ProductRow } from "@/components/catalog";
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
    <div className="flex min-h-[calc(100dvh-96px)] flex-col bg-[#f5f5f5] md:min-h-0 md:bg-transparent">
      <div className="bg-white px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchKeyword")}
            className="mp-search-field h-9 w-full rounded-[50px] border-0 bg-[#f8f8f8] pr-3 pl-10 text-[13px] outline-none placeholder:text-[#bbb]"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="w-[88px] shrink-0 bg-[#f7f7f7] md:w-[120px]">
          {productCategories.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={cn(
                  "relative flex h-[56px] w-full items-center justify-start px-3 text-left text-[13px] leading-4",
                  selected ? "bg-white font-medium text-[#c9a24a]" : "text-[#666]",
                )}
              >
                {selected ? <span className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 bg-[#c9a24a]" /> : null}
                {localized(locale, category.label, category.labelEn)}
              </button>
            );
          })}
        </nav>
        <section className="min-w-0 flex-1 bg-white">
          {list.length === 0 ? (
            <EmptyHint>{t("noProducts")}</EmptyHint>
          ) : (
            <div>
              {list.map((product) => (
                <ProductRow key={product.slug} product={product} showOriginal={false} />
              ))}
            </div>
          )}
          <p className="py-8 text-center text-[12px] text-[#bbb]">{t("moreNone")}</p>
        </section>
      </div>
    </div>
  );
}
