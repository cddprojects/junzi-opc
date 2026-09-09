import Link from "next/link";
import { CoverArt } from "@/components/covers";
import { brand, guides } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";

export default async function GuidesPage() {
  const locale = await getRequestLocale();
  return (
    <div className="bg-white md:overflow-hidden md:rounded-2xl">
      <p className="px-3 py-2 text-[13px] text-[#666]">{localized(locale, brand.society, brand.societyEn)}</p>
      {guides.map((guide) => (
        <Link key={guide.slug} href={guide.href} className="block border-t border-[#f0f0f0]">
          <CoverArt theme={guide.cover} showVideoBadge className="mx-3 mt-3 rounded-sm" />
          <div className="px-3 pt-2 pb-3">
            <h3 className="font-serif text-[15px] leading-6">{localized(locale, guide.title, guide.titleEn)}</h3>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="text-[#999]">{t(locale, "learnersCount", { n: guide.learners })}</span>
              <span className="opc-price text-[#fa3534]">{localized(locale, guide.priceLabel, guide.priceLabelEn)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
