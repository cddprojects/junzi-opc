import { ComingSoonPoster } from "@/components/covers";
import { ProductRow } from "@/components/catalog";
import type { Poster, PosterPlacement, Product } from "@/lib/data";
import { postersByPlacement } from "@/lib/data";
import { locPosterKicker, locPosterTitle } from "@/lib/localize";
import type { Locale } from "@/lib/i18n";

export function PlacementCatalog({
  posters,
  products,
  placement,
  title,
  locale,
}: {
  posters: Poster[];
  products: Product[];
  placement: PosterPlacement;
  title: string;
  locale: Locale;
}) {
  const slot = postersByPlacement(posters, placement);
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const linked: Product[] = [];
  for (const poster of slot) {
    const product = poster.productSlug ? bySlug.get(poster.productSlug) : undefined;
    if (product && !linked.some((item) => item.slug === product.slug)) {
      linked.push(product);
    }
  }
  const hero = slot.find((item) => item.image);
  const heroTitle = hero ? locPosterTitle(hero, locale) : title;
  const month = hero ? locPosterKicker(hero, locale) : undefined;

  if (linked.length > 0) {
    return (
      <div className="bg-[#f5f5f5] pb-4 md:bg-transparent md:px-0 md:py-6">
        {hero?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image} alt={heroTitle} className="mb-2 block h-auto w-full md:rounded-xl" />
        ) : null}
        <div className="mp-card-list">
          {linked.map((product) => (
            <ProductRow key={product.slug} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="md:overflow-hidden md:rounded-2xl">
      <ComingSoonPoster title={heroTitle} month={month || undefined} image={hero?.image} />
    </div>
  );
}
