import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { listFeedback } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const locale = await getRequestLocale();
  const items = await listFeedback();
  const dateLocale = locale === "en" ? "en-MY" : "zh-CN";

  return (
    <div>
      <h1>{t(locale, "adminFeedback")}</h1>
      <p className="jx-lede">{t(locale, "adminFeedbackIntro")}</p>
      <div className="jx-panel mt-5 overflow-x-auto">
        <table className="jx-table">
          <thead>
            <tr>
              <th>{t(locale, "adminFeedbackBody")}</th>
              <th>{t(locale, "adminFeedbackDate")}</th>
            </tr>
          </thead>
          <tbody>
            {!items.length ? (
              <tr>
                <td colSpan={2}>{t(locale, "adminFeedbackEmpty")}</td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-pre-wrap">{row.body}</td>
                  <td className="whitespace-nowrap text-[var(--mute)]">
                    {new Date(row.createdAt).toLocaleString(dateLocale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
