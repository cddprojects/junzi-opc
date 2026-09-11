import { ComingSoonPoster } from "@/components/covers";
import { MemberPurchase, MemberTopChrome } from "@/components/member-purchase";
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
  const linked = slot.some((item) => item.productSlug === membership.slug);
  const showPurchase = slot.length === 0 || linked;
  const hero = slot.find((item) => item.image);
  const details = slot.flatMap((item) => normalizeDetailImages(item.detailImages));
  const heroTitle = hero ? locPosterTitle(hero, locale) : t(locale, "navMember");
  const hasVisual = Boolean(hero?.image || details.length);
  const gallery = [
    ...(hero?.image ? [hero.image] : []),
    ...details.filter((src) => src !== hero?.image),
  ];

  return (
    <div className="bg-[#f5f5f5] pb-4">
      <MemberTopChrome />
      {gallery.length > 0 ? (
        <section className="grid grid-cols-1 gap-0.5 px-[12px] pt-3 pb-[12px]">
          {gallery.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${index}`}
              src={src}
              alt={index === 0 ? heroTitle : ""}
              className="block h-auto w-full"
            />
          ))}
        </section>
      ) : null}
      {showPurchase ? <MemberPurchase /> : null}
      {!hasVisual && !showPurchase ? <ComingSoonPoster title={heroTitle} /> : null}
    </div>
  );
}
