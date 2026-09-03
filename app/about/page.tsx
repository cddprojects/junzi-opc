import { SimplePlaceholder } from "@/components/simple-page";
import { brand } from "@/lib/data";
import { getRequestLocale } from "@/lib/i18n-server";
import { localized } from "@/lib/i18n";
import { t } from "@/lib/messages";

export default async function AboutPage() {
  const locale = await getRequestLocale();
  return (
    <SimplePlaceholder
      title={t(locale, "aboutTitle")}
      body={`${t(locale, "aboutBody")} ${localized(locale, brand.mottoWay, brand.mottoWayEn)}.`}
      actions={[{ href: "/", label: t(locale, "backHome") }]}
    />
  );
}
