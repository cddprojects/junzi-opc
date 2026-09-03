import { SimplePlaceholder } from "@/components/simple-page";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export default async function ServicePage() {
  const locale = await getRequestLocale();
  return (
    <SimplePlaceholder
      title={t(locale, "serviceTitle")}
      body={t(locale, "serviceBody")}
      actions={[{ href: "/help", label: t(locale, "serviceAction") }]}
    />
  );
}
