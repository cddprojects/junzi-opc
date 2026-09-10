import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { guides } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";

export default async function GuidesPage() {
  const locale = await getRequestLocale();
  return (
    <div className="bg-[#f5f5f5] pb-4 md:bg-transparent md:px-0 md:py-6">
      <h1 className="sr-only md:not-sr-only md:mb-4 md:text-[22px] md:font-semibold">{t(locale, "pageGuides")}</h1>
      <div className="mp-card-list mp-card-list--grid">
        {guides.map((guide) => (
          <Link key={guide.slug} href={guide.href} prefetch className="mp-stack-card active:opacity-80">
            <CoverArt theme={guide.cover} showVideoBadge className="aspect-[16/9]" />
            <div className="px-3 py-3">
              <h2 className="text-[15px] leading-5 font-medium text-[#333]">{localized(locale, guide.title, guide.titleEn)}</h2>
              <p className="mt-1 text-[12px] text-[#999]">
                {t(locale, "learnersCount", { n: guide.learners })}
                <span className="opc-price ml-2 text-[#fa3534]">{localized(locale, guide.priceLabel, guide.priceLabelEn)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
