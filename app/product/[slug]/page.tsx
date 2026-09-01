import { notFound } from "next/navigation";
import { CourseDetailView } from "@/components/course-detail";
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

  return <CourseDetailView product={product} video={video} />;
}
