"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyHint, ProductRow } from "@/components/catalog";
import { productCategories, products } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const [active, setActive] = useState<(typeof productCategories)[number]["id"]>("opc");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((item) => {
      if (item.categoryId !== active) return false;
      if (!q) return true;
      return [item.title, item.shortTitle, item.subtitle ?? ""].some((field) =>
        field.toLowerCase().includes(q),
      );
    });
  }, [active, query]);

  return (
    <div className="flex min-h-[calc(100dvh-96px)] flex-col bg-white">
      <div className="bg-white px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#bbb]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="请输入关键字进行搜索"
            className="h-9 w-full rounded-full bg-[#f3f3f3] pr-3 pl-9 text-[13px] outline-none placeholder:text-[#bbb]"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[96px] shrink-0 bg-[#f6f6f6]">
          {productCategories.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center text-[13px]",
                  selected ? "bg-white font-medium text-[#c9a24a]" : "text-[#555]",
                )}
              >
                {selected && <span className="absolute top-3 bottom-3 left-0 w-[3px] bg-[#c9a24a]" />}
                {category.label}
              </button>
            );
          })}
        </aside>
        <section className="min-w-0 flex-1">
          {list.length === 0 ? (
            <EmptyHint>没有找到相关商品</EmptyHint>
          ) : (
            list.map((product) => (
              <div key={product.slug} className="border-b border-[#f4f4f4]">
                <ProductRow product={product} showOriginal={false} />
              </div>
            ))
          )}
          <p className="py-6 text-center text-[12px] text-[#bbb]">没有更多了</p>
        </section>
      </div>
    </div>
  );
}
