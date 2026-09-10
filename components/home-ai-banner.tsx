import Link from "next/link";
import type { Poster } from "@/lib/data";
import { locPosterCta, locPosterTitle } from "@/lib/localize";
import type { Locale } from "@/lib/i18n";

export function HomeAiBanner({ poster, locale, ctaFallback }: { poster: Poster; locale: Locale; ctaFallback: string }) {
  if (!poster.image) return null;
  const title = locPosterTitle(poster, locale);
  const cta = locPosterCta(poster, locale, ctaFallback);
  const href = poster.href || "/tools";

  return (
    <Link href={href} className="mp-full-bleed relative block bg-[#132033]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster.image} alt={title} className="block h-auto w-full" />
      {poster.kicker || poster.priceLabel ? (
        <span className="absolute top-3 right-3 rounded-sm border border-[#d4b56a] bg-[#132033]/80 px-2.5 py-1.5 text-[11px] leading-4 font-medium text-[#d4b56a]">
          {cta}
        </span>
      ) : null}
    </Link>
  );
}
