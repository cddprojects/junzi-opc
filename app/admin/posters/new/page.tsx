import { PosterForm } from "@/components/admin/poster-form";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewPosterPage() {
  const { products } = await getCatalog();
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">新增海报</h1>
      <PosterForm products={products} />
    </div>
  );
}
