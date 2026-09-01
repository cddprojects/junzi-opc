import { notFound } from "next/navigation";
import { QihangDetail } from "@/components/qihang-detail";
import { SimpleProductDetail } from "@/components/simple-product";
import { getProduct, products } from "@/lib/data";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  if (product.slug === "qihang") {
    return <QihangDetail product={product} />;
  }
  return <SimpleProductDetail product={product} />;
}
