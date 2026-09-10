import { CheckoutClient } from "@/components/checkout-client";
import { getStoreProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; member?: string }>;
}) {
  const params = await searchParams;
  const product = params.slug ? await getStoreProduct(params.slug) : null;
  return <CheckoutClient product={product} member={params.member === "1"} />;
}
