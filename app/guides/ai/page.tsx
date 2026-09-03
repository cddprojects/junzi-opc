import { SimplePlaceholder } from "@/components/simple-page";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export default async function GuideAiPage() {
  const locale = await getRequestLocale();
  return (
    <SimplePlaceholder
      title={t(locale, "guideAiTitle")}
      body={t(locale, "guideAiBody")}
      actions={[
        { href: "/tools", label: t(locale, "toolsTitle") },
        { href: "/guides", label: t(locale, "pageGuides") },
      ]}
    />
  );
}
