import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getStoreProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getStoreProduct(slug);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">编辑商品</h1>
      <ProductForm product={product} />
    </div>
  );
}
