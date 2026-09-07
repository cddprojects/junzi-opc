import Link from "next/link";
import { getCurrentUser } from "@/lib/user-auth";
import { paidOrdersForUser } from "@/lib/user-store";
import { getStoreProduct } from "@/lib/store";
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
  const orders = paidOrdersForUser(user.id);
  const bySlug = new Map<string, (typeof orders)[number]>();
  for (const order of orders) {
    if (!bySlug.has(order.productSlug)) bySlug.set(order.productSlug, order);
  }
  const items = [...bySlug.values()];

  return (
    <div className="px-4 py-6 md:px-0">
      <h1 className="font-serif text-[24px]">{t(locale, "learningTitle")}</h1>
      <p className="mt-2 text-[13px] text-[#777]">{t(locale, "learningHint")}</p>
      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white px-4 py-8 text-center text-[14px] text-[#666]">
          <p>{t(locale, "learningEmpty")}</p>
          <Link href="/product/qihang" className="mt-3 inline-block text-[#8a5a20]">
            {t(locale, "learningViewQihang")}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((order) => {
            const product = getStoreProduct(order.productSlug);
            return (
              <article key={order.productSlug} className="flex gap-3 rounded-2xl bg-white p-3">
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
                      className="mt-2 inline-block text-[13px] text-[#8a5a20]"
                    >
                      {t(locale, "enterLessons")}
                    </Link>
                  ) : null}
                  <p className="mt-1 text-[12px] text-[#888]">{t(locale, "courseCode")}</p>
                  {order.verifyCode ? (
                    <CopyCode code={order.verifyCode} className="font-mono text-[13px] text-[#8a5a20]" />
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
