import { listReferralNetwork } from "@/lib/user-store";
import { ReferralGraph } from "@/components/admin/referral-graph";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminNetworkPage() {
  const locale = await getRequestLocale();
  const data = await listReferralNetwork();

  return (
    <div className="referral-network-page">
      <h1>{t(locale, "adminNetwork")}</h1>
      <p className="jx-lede">{t(locale, "adminPayDepthHint")}</p>
      <p className="jx-lede">{t(locale, "adminGraphRelationHint")}</p>
      <div className="mt-5 space-y-4">
        {data.trees.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)]">{t(locale, "adminNoDownline")}</p>
        ) : (
          data.trees.map((tree) => (
            <section key={tree.userId} className="jx-panel overflow-hidden p-5">
              <h2 className="jx-serif">
                {tree.name} <span className="text-[13px] text-[var(--mute)]">{tree.code}</span>
              </h2>
              {tree.children.length ? (
                <ReferralGraph
                  root={{
                    userId: tree.userId,
                    name: tree.name,
                    code: tree.code,
                    status: tree.status,
                    children: tree.children,
                  }}
                />
              ) : (
                <p className="mt-2 text-[13px] text-[var(--mute)]">{t(locale, "adminNoDownline")}</p>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
