import { SimplePlaceholder } from "@/components/simple-page";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export default async function NotFound() {
  const locale = await getRequestLocale();
  return (
    <SimplePlaceholder
      title={t(locale, "pageNotFound")}
      body={t(locale, "notFoundBody")}
      actions={[{ href: "/", label: t(locale, "backHome") }]}
    />
  );
}
