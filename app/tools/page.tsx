import { HomeAiBanner } from "@/components/home-ai-banner";
import { SimplePlaceholder } from "@/components/simple-page";
import { postersByPlacement } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const locale = await getRequestLocale();
  const { posters } = await getCatalog();
  const aiBanner = postersByPlacement(posters, "home-ai").find((item) => item.image);
  return (
    <div>
      {aiBanner ? (
        <div className="pt-3">
          <HomeAiBanner poster={aiBanner} locale={locale} ctaFallback={t(locale, "clickEnter")} />
        </div>
      ) : null}
      <SimplePlaceholder
        title={t(locale, "toolsTitle")}
        body={t(locale, "toolsBody")}
        actions={[
          { href: "/guides/ai", label: t(locale, "toolsGuide") },
          { href: "/product/compute", label: t(locale, "toolsCompute") },
        ]}
      />
    </div>
  );
}
