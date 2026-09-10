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
    <div className="px-4 py-8 md:px-0">
      <h1 className="front-h2 font-serif">{t(locale, "recordedTitle")}</h1>
      <p className="mt-3 text-[15px] text-[var(--front-text-soft)]">{t(locale, "recordedHint")}</p>
      {courses.length === 0 ? (
        <p className="mt-10 text-center text-[15px] text-[var(--front-text-muted)]">{t(locale, "recordedEmpty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((product) => {
            const count = product.detail?.lessons.length || 0;
            return (
              <Link
                key={product.slug}
                href={`/courses/recorded/${product.slug}`}
                prefetch
                className="front-card overflow-hidden transition duration-150 hover:shadow-md active:opacity-70"
              >
                <CoverArt theme={product.cover} image={product.coverImage} showVideoBadge />
                <div className="px-5 py-4">
                  <h2 className="front-h3 font-serif">{locProductTitle(product, locale)}</h2>
                  <p className="mt-2 text-[13px] text-[var(--front-text-muted)]">
                    {t(locale, "recordedMeta", { n: count, sales: product.sales || 0 })}
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
