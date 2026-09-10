import { getCatalog } from "@/lib/store";
import { CategoriesClient } from "@/components/categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { products } = await getCatalog();
  return <CategoriesClient products={products} />;
}
