import { notFound } from "next/navigation";
import { QihangDetail } from "@/components/qihang-detail";
import { SimpleProductDetail } from "@/components/simple-product";
import { GenericProductDetail } from "@/components/generic-product";
import { getCatalog, getStoreProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getStoreProduct(slug);
  if (!product) notFound();
  const video = getCatalog().videos.find(
    (item) => item.placement === "product-hero" && item.productSlug === slug,
  );

  if (product.slug === "qihang") {
    return <QihangDetail product={product} video={video} />;
  }
  if (product.slug === "shizhan" || product.slug === "compute") {
    return <SimpleProductDetail product={product} video={video} />;
  }
  return <GenericProductDetail product={product} video={video} />;
}
