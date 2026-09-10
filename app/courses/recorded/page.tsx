import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { getCatalog } from "@/lib/store";
import { recordedProducts } from "@/lib/learning-access";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { locProductTitle } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function RecordedCoursesPage() {
  const locale = await getRequestLocale();
  const { products } = await getCatalog();
  const courses = recordedProducts(products);

  return (
    <div className="bg-[#f5f5f5] pb-4 md:bg-transparent md:px-0 md:py-6">
      <h1 className="sr-only md:not-sr-only md:mb-4 md:text-[22px] md:font-semibold">{t(locale, "recordedTitle")}</h1>
      {courses.length === 0 ? (
        <p className="px-4 py-16 text-center text-[14px] text-[#999]">{t(locale, "recordedEmpty")}</p>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          {courses.map((product) => {
            const count = product.detail?.lessons.length || product.sales || 0;
            return (
              <Link
                key={product.slug}
                href={`/courses/recorded/${product.slug}`}
                prefetch
                className="block overflow-hidden bg-white active:opacity-80"
              >
                <CoverArt theme={product.cover} image={product.coverImage} showVideoBadge className="aspect-[16/9]" />
                <div className="px-3 py-3">
                  <h2 className="text-[15px] leading-5 font-medium text-[#333]">{locProductTitle(product, locale)}</h2>
                  <p className="mt-1 text-[12px] text-[#999]">
                    {t(locale, "learnersCount", { n: product.sales || count })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
