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
  const { products } = getCatalog();
  const courses = recordedProducts(products);

  return (
    <div className="px-3 py-4 md:px-0">
      <h1 className="font-serif text-[24px]">{t(locale, "recordedTitle")}</h1>
      <p className="mt-2 text-[13px] text-[#777]">{t(locale, "recordedHint")}</p>
      {courses.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-[#888]">{t(locale, "recordedEmpty")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2">
          {courses.map((product) => {
            const count = product.detail?.lessons.length || 0;
            return (
              <Link
                key={product.slug}
                href={`/courses/recorded/${product.slug}`}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <CoverArt theme={product.cover} image={product.coverImage} showVideoBadge />
                <div className="px-4 py-3">
                  <h2 className="text-[16px] font-medium">{locProductTitle(product, locale)}</h2>
                  <p className="mt-1 text-[12px] text-[#888]">
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
