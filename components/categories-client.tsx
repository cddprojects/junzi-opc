"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyHint, ProductCard, ProductRow } from "@/components/catalog";
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
    <div className="flex min-h-[calc(100dvh-96px)] flex-col bg-white md:min-h-0 md:overflow-hidden md:rounded-2xl">
      <div className="bg-white px-3 py-2 md:px-6 md:py-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchKeyword")}
            className="h-9 w-full rounded-full bg-[#f4efe6] pr-3 pl-9 text-[13px] outline-none placeholder:text-[#bbb] md:h-10"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[96px] shrink-0 bg-[#f6f2ea] md:w-44">
          {productCategories.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center text-[13px] md:justify-start md:px-5 md:text-[15px]",
                  selected ? "bg-white font-medium text-[#8a5a20]" : "text-[#555]",
                )}
              >
                {selected && <span className="absolute top-3 bottom-3 left-0 w-[3px] bg-[#8a5a20]" />}
                {localized(locale, category.label, category.labelEn)}
              </button>
            );
          })}
        </aside>
        <section className="min-w-0 flex-1">
          {list.length === 0 ? (
            <EmptyHint>{t("noProducts")}</EmptyHint>
          ) : (
            <>
              <div className="md:hidden">
                {list.map((product) => (
                  <div key={product.slug} className="border-b border-[#f4f4f4]">
                    <ProductRow product={product} showOriginal={false} />
                  </div>
                ))}
              </div>
              <div className="hidden gap-4 p-5 md:grid md:grid-cols-2 lg:grid-cols-3">
                {list.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </>
          )}
          <p className="py-6 text-center text-[12px] text-[#bbb]">{t("moreNone")}</p>
        </section>
      </div>
    </div>
  );
}
