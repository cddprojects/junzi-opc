import { listReferralNetwork } from "@/lib/user-store";
import { DownlineTree } from "@/components/admin/downline-tree";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminNetworkPage() {
  const locale = await getRequestLocale();
  const data = await listReferralNetwork();

  return (
    <div>
      <h1>{t(locale, "adminNetwork")}</h1>
      <p className="jx-lede">{t(locale, "adminPayDepthHint")}</p>
      <div className="mt-5 space-y-4">
        {data.trees.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)]">{t(locale, "adminNoDownline")}</p>
        ) : (
          data.trees.map((tree) => (
            <section key={tree.userId} className="jx-panel p-5">
              <h2 className="jx-serif">
                {tree.name} <span className="text-[13px] text-[var(--mute)]">{tree.code}</span>
              </h2>
              {tree.children.length ? (
                <DownlineTree nodes={tree.children} rates={data.plan.tiers} lazyAfter={1} />
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
