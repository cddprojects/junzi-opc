import { EmptyHint, ProductCard, ProductRow, SearchBox } from "@/components/catalog";
import { searchStoreProducts } from "@/lib/store";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getRequestLocale();
  const { q = "" } = await searchParams;
  const results = searchStoreProducts(q);

  return (
    <div className="bg-[#f7f7f7] md:bg-transparent">
      <div className="bg-white md:rounded-2xl md:px-4">
        <SearchBox placeholder={t(locale, "searchCoursesOrProducts")} defaultValue={q} />
      </div>
      {q ? (
        <p className="px-3 pt-3 text-[12px] text-[#888] md:px-0">{t(locale, "searchResults", { n: results.length, q })}</p>
      ) : (
        <p className="px-3 pt-3 text-[12px] text-[#888] md:px-0">{t(locale, "searchHint")}</p>
      )}
      <div className="mt-2 bg-white md:hidden">
        {results.length === 0 ? (
          <EmptyHint>{t(locale, "noProducts")}</EmptyHint>
        ) : (
          results.map((product) => (
            <div key={product.slug} className="border-b border-[#f4f4f4]">
              <ProductRow product={product} />
            </div>
          ))
        )}
      </div>
      <div className="mt-4 hidden gap-5 md:grid md:grid-cols-3">
        {results.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
