import { ComingSoonPoster } from "@/components/covers";
import { normalizeDetailImages } from "@/lib/course";
import { postersByPlacement } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { locPosterTitle } from "@/lib/localize";
import { t } from "@/lib/messages";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const { posters } = await getCatalog();
  const slot = postersByPlacement(posters, "about");
  const hero = slot.find((item) => item.image);
  const details = slot.flatMap((item) => normalizeDetailImages(item.detailImages));
  const title = hero ? locPosterTitle(hero, locale) : t(locale, "aboutTitle");
  const gallery = [
    ...(hero?.image ? [hero.image] : []),
    ...details.filter((src) => src !== hero?.image),
  ];

  return (
    <div className="bg-[#f5f5f5] pb-4">
      {gallery.length > 0 ? (
        <section className="grid grid-cols-1 gap-0.5 px-[12px] pt-3 pb-[12px] md:grid-cols-2">
          {gallery.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${index}`}
              src={src}
              alt={index === 0 ? title : ""}
              className="block h-auto w-full"
            />
          ))}
        </section>
      ) : (
        <ComingSoonPoster title={title} />
      )}
    </div>
  );
}
