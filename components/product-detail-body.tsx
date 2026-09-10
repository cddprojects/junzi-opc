"use client";

import { hasDetailImages, normalizeDetailImages } from "@/lib/course";
import type { Product } from "@/lib/data";
import { useLocale } from "@/components/locale-provider";

export default function ProductDetailBody({ product }: { product: Product }) {
  const { t } = useLocale();

  if (!hasDetailImages(product)) {
    return <p className="bg-white px-4 py-16 text-center text-[13px] text-[#999]">{t("noProductDetail")}</p>;
  }

  const images = normalizeDetailImages(product.detailImages);
  return (
    <section className="grid grid-cols-1 gap-0.5 bg-white px-[12px] pb-[12px] md:grid-cols-2 rounded-b-[12px]">
      {images.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      ))}
    </section>
  );
}
