import { ComingSoonPoster } from "@/components/covers";
import { MemberPurchase } from "@/components/member-purchase";
import { normalizeDetailImages } from "@/lib/course";
import { membership, postersByPlacement } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { locPosterTitle } from "@/lib/localize";
import { t } from "@/lib/messages";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const locale = await getRequestLocale();
  const { posters } = await getCatalog();
  const slot = postersByPlacement(posters, "member");
  const showPurchase = slot.length === 0 || slot.some((item) => item.productSlug === membership.slug);
  const hero = slot.find((item) => item.image);
  const details = slot.flatMap((item) => normalizeDetailImages(item.detailImages));
  const heroTitle = hero ? locPosterTitle(hero, locale) : t(locale, "navMember");

  return (
    <div className="bg-[#f5f5f5] pb-4 md:bg-transparent">
      {hero?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.image} alt={heroTitle} className="block h-auto w-full md:rounded-t-xl" />
      ) : null}
      {details.length > 0 ? (
        <section className="grid grid-cols-1 gap-0.5 bg-white px-[12px] pb-[2px] md:grid-cols-2">
          {details.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${src}-${index}`} src={src} alt="" className="block h-auto w-full" />
          ))}
        </section>
      ) : null}
      {showPurchase ? <MemberPurchase /> : null}
      {!showPurchase && !hero?.image ? (
        <div className="md:overflow-hidden md:rounded-2xl">
          <ComingSoonPoster title={heroTitle} />
        </div>
      ) : null}
    </div>
  );
}
