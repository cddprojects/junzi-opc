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
  const product = await getStoreProduct(slug);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">编辑商品</h1>
      <p className="mb-4 text-[13px] leading-5 text-[#777]">
        默认只改名称、价格、封面和详情图。课节、直播和文字大纲收在「高级 / 课节与大纲」。
      </p>
      <ProductForm product={product} />
    </div>
  );
}
