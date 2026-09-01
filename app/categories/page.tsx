import { getCatalog } from "@/lib/store";
import { CategoriesClient } from "@/components/categories-client";

export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  const { products } = getCatalog();
  return <CategoriesClient products={products} />;
}
