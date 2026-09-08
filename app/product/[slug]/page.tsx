import { notFound } from "next/navigation";
import { CourseDetailView } from "@/components/course-detail";
import { getProductPage } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, video } = getProductPage(slug);
  if (!product) notFound();
  return <CourseDetailView product={product} video={video} />;
}
