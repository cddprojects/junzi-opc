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
      <span className="absolute right-3 bottom-3 rounded-sm bg-[#d4b56a] px-2.5 py-1 text-[11px] font-medium text-[#132033]">
        {cta}
      </span>
    </Link>
  );
}
