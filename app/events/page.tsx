import { PlacementCatalog } from "@/components/placement-catalog";
import { getCatalog } from "@/lib/store";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const locale = await getRequestLocale();
  const { posters, products } = await getCatalog();
  return (
    <PlacementCatalog
      posters={posters}
      products={products}
      placement="events"
      title={t(locale, "eventsTitle")}
      locale={locale}
    />
  );
}
