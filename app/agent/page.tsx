import { SimplePlaceholder } from "@/components/simple-page";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export default async function AgentPage() {
  const locale = await getRequestLocale();
  return <SimplePlaceholder title={t(locale, "agentTitle")} body={t(locale, "agentBody")} />;
}
