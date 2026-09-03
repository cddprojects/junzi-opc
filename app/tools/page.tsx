import { AiToolBanner } from "@/components/covers";
import { SimplePlaceholder } from "@/components/simple-page";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export default async function ToolsPage() {
  const locale = await getRequestLocale();
  return (
    <div>
      <div className="px-3 pt-3">
        <AiToolBanner />
      </div>
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
