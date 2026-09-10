import { EmptyHint, ProductCard, SearchBox } from "@/components/catalog";
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
  const results = await searchStoreProducts(q);

  return (
    <div className="py-6 md:py-8">
      <div className="front-card px-3 md:px-5">
        <SearchBox placeholder={t(locale, "searchCoursesOrProducts")} defaultValue={q} />
      </div>
      {q ? (
        <p className="px-1 pt-5 text-[14px] text-[var(--front-text-muted)]">{t(locale, "searchResults", { n: results.length, q })}</p>
      ) : (
        <p className="px-1 pt-5 text-[14px] text-[var(--front-text-muted)]">{t(locale, "searchHint")}</p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyHint>{t(locale, "noProducts")}</EmptyHint>
          </div>
        ) : (
          results.map((product) => <ProductCard key={product.slug} product={product} />)
        )}
      </div>
    </div>
  );
}
