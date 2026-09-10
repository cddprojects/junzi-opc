import { parsePosterPlacement, type Poster } from "@/lib/data";
import { normalizeDetailImages } from "@/lib/course";

function optText(value: unknown, fallback?: string) {
  if (value === undefined) return fallback;
  const next = String(value ?? "").trim();
  return next || undefined;
}

export function posterFieldsFromBody(body: Partial<Poster>, previous?: Poster): Omit<Poster, "id"> {
  return {
    title: String(body.title ?? previous?.title ?? "").trim(),
    titleEn: optText(body.titleEn, previous?.titleEn),
    href: String(body.href ?? previous?.href ?? "/").trim() || "/",
    sort: Number(body.sort ?? previous?.sort ?? 0),
    placement: parsePosterPlacement(body.placement ?? previous?.placement),
    image: body.image === undefined ? previous?.image : body.image?.trim() || undefined,
    subtitle: optText(body.subtitle, previous?.subtitle),
    subtitleEn: optText(body.subtitleEn, previous?.subtitleEn),
    kicker: optText(body.kicker, previous?.kicker),
    kickerEn: optText(body.kickerEn, previous?.kickerEn),
    priceLabel: optText(body.priceLabel, previous?.priceLabel),
    priceLabelEn: optText(body.priceLabelEn, previous?.priceLabelEn),
    theme: (body.theme || previous?.theme || "qihang") as Poster["theme"],
    productSlug: body.productSlug === undefined ? previous?.productSlug : body.productSlug?.trim() || undefined,
    detailImages:
      body.detailImages === undefined ? previous?.detailImages : normalizeDetailImages(body.detailImages),
  };
}
