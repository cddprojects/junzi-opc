import Link from "next/link";
import { getCurrentUser } from "@/lib/user-auth";
import { paidOrdersForUser } from "@/lib/user-store";
import { getStoreProductsBySlugs } from "@/lib/store";
import { LoginPrompt } from "@/components/login-prompt";
import { CopyCode } from "@/components/copy-code";
import { CoverArt } from "@/components/covers";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/messages";
import { locProductTitle } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const locale = await getRequestLocale();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <LoginPrompt
        title={t(locale, "learningTitle")}
        body={t(locale, "learningLoginBody")}
        next="/learning"
      />
    );
  }
  const orders = await paidOrdersForUser(user.id);
  const bySlug = new Map<string, (typeof orders)[number]>();
  for (const order of orders) {
    if (!bySlug.has(order.productSlug)) bySlug.set(order.productSlug, order);
  }
  const items = [...bySlug.values()];
  const products = await getStoreProductsBySlugs(items.map((order) => order.productSlug));

  return (
    <div className="px-4 py-8 md:px-0">
      <h1 className="front-h2 font-serif">{t(locale, "learningTitle")}</h1>
      <p className="mt-3 text-[15px] text-[var(--front-text-soft)]">{t(locale, "learningHint")}</p>
      {items.length === 0 ? (
        <div className="front-card mt-8 px-5 py-10 text-center text-[15px] text-[var(--front-text-soft)]">
          <p>{t(locale, "learningEmpty")}</p>
          <Link href="/product/qihang" className="mt-4 inline-block text-[var(--front-accent)]">
            {t(locale, "learningViewQihang")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((order) => {
            const product = products.get(order.productSlug);
            return (
              <article key={order.productSlug} className="front-card flex gap-4 p-4">
                <Link href={product?.href || `/product/${order.productSlug}`} className="w-20 overflow-hidden rounded-md">
                  <CoverArt
                    theme={product?.cover || "qihang"}
                    image={product?.coverImage}
                    compact
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={product?.href || `/product/${order.productSlug}`} className="block text-[15px] font-medium">
                    {product ? locProductTitle(product, locale) : order.productTitle}
                  </Link>
                  {product?.detail?.lessons?.length ? (
                    <Link
                      href={`/courses/recorded/${order.productSlug}`}
                      className="mt-2 inline-block text-[14px] text-[var(--front-accent)]"
                    >
                      {t(locale, "enterLessons")}
                    </Link>
                  ) : null}
                  <p className="mt-1 text-[12px] text-[var(--front-text-muted)]">{t(locale, "courseCode")}</p>
                  {order.verifyCode ? (
                    <CopyCode code={order.verifyCode} className="font-mono text-[13px] text-[var(--front-accent)]" />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
