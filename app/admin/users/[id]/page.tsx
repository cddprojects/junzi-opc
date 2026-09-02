import { notFound } from "next/navigation";
import { getCustomerAdmin } from "@/lib/user-store";
import { getCatalog } from "@/lib/store";
import { AdminUserDetail } from "@/components/admin/user-detail";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = getCustomerAdmin(id);
  if (!user) notFound();
  const { products } = getCatalog();
  return <AdminUserDetail user={user} products={products} />;
}
